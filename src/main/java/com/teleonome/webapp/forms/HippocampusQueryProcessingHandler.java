package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.ZoneId;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.TeleonomeDataGateway;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * HTTP/curl gateway for hippocampus data.
 *
 * Invoke via: POST /TeleonomeServlet  (formName=HippocampusQuery)
 *
 * ── variableReport ──────────────────────────────────────────────────────────
 * Single DeneWord time series. Uses MQTT → Hippocampus in-memory store (fast).
 * Falls back to PostgreSQL if MQTT is unavailable.
 *
 *   Required: telepathon, dene, deneword
 *   Time:     rangeMs=<ms from now>   OR   from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 *   curl http://raspi.local:8080/TeleonomeServlet \
 *        -d "formName=HippocampusQuery&command=variableReport \
 *            &telepathon=TopTank&dene=TopTank&deneword=Tank+Level \
 *            &rangeMs=86400000"
 *
 * ── deviceReport ────────────────────────────────────────────────────────────
 * All DeneWords for a Telepathon. Issues one MQTT request per DeneWord.
 * NOTE: results are limited to the hippocampus in-memory window (default 24h).
 * To get a full week extend the pruning window in Hippocampus.java.
 *
 *   Required: telepathon, from=YYYY-MM-DD, to=YYYY-MM-DD
 *
 *   curl http://raspi.local:8080/TeleonomeServlet \
 *        -d "formName=HippocampusQuery&command=deviceReport \
 *            &telepathon=TopTank&from=2025-06-04&to=2025-06-08"
 *
 * ── listRememberedDeneWords ──────────────────────────────────────────────────
 * Catalog of all remembered DeneWord identities.
 *
 *   curl http://raspi.local:8080/TeleonomeServlet \
 *        -d "formName=HippocampusQuery&command=listRememberedDeneWords"
 *
 * ── rememberedReport ────────────────────────────────────────────────────────
 * Time series for a remembered DeneWord (PostgreSQL remembereddenewords table).
 *
 *   Required: identity=<full @identity string>
 *   Time:     rangeMs=<ms from now>   OR   from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 *   curl http://raspi.local:8080/TeleonomeServlet \
 *        -d "formName=HippocampusQuery&command=rememberedReport \
 *            &identity=@MyTeleonome:Internal:Mnemosycons:MySensor:TankLevel \
 *            &rangeMs=86400000"
 */
public class HippocampusQueryProcessingHandler extends ProcessingFormHandler {

    private static final ZoneId ZONE = ZoneId.of("Australia/Melbourne");

    public HippocampusQueryProcessingHandler(HttpServletRequest req, HttpServletResponse res,
            ServletContext servletContext) {
        super(req, res, servletContext);
    }

    @Override
    public void process() throws ServletProcessingException, IOException {
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Access-Control-Allow-Origin", "*");
        PrintWriter out = response.getWriter();
        JSONObject result = new JSONObject();
        try {
            String command = request.getParameter("command");
            if (command == null || command.isEmpty()) {
                result.put("error", "Missing required parameter: command");
                result.put("validCommands", new JSONArray()
                        .put("variableReport").put("deviceReport")
                        .put("listRememberedDeneWords").put("rememberedReport"));
            } else {
                switch (command) {
                    case "variableReport":          result = handleVariableReport();          break;
                    case "deviceReport":            result = handleDeviceReport();            break;
                    case "listRememberedDeneWords":  result = handleListRememberedDeneWords(); break;
                    case "rememberedReport":        result = handleRememberedReport();        break;
                    default:
                        result.put("error", "Unknown command: " + command);
                }
            }
        } catch (IllegalArgumentException e) {
            result.put("error", e.getMessage());
        } catch (Exception e) {
            logger.warn("HippocampusQueryProcessingHandler error: " + e.getMessage());
            result.put("error", e.getMessage());
        }
        out.print(result.toString(2));
        out.flush();
        out.close();
    }

    /**
     * Single-variable time series via MQTT → Hippocampus in-memory store.
     * Params: telepathon, dene, deneword, + time range.
     */
    private JSONObject handleVariableReport() throws Exception {
        String telepathon = required("telepathon");
        String dene       = required("dene");
        String deneword   = required("deneword");
        long[] range = parseTimeRange();
        long rangeMs = range[1] - range[0];

        String teleonomeName = (String) servletContext.getAttribute("TeleonomeName");
        String identity = "@" + teleonomeName + ":" + TeleonomeConstants.NUCLEI_TELEPATHONS
                + ":" + telepathon + ":" + dene + ":" + deneword;

        TeleonomeDataGateway gateway = (TeleonomeDataGateway) servletContext.getAttribute("TeleonomeDataGateway");

        JSONObject result = new JSONObject();
        result.put("command",    "variableReport");
        result.put("identity",   identity);
        result.put("fromMillis", range[0]);
        result.put("toMillis",   range[1]);

        boolean useHippocampus = gateway != null && gateway.isConnected()
                && gateway.isTrackedByHippocampus(identity);

        if (useHippocampus) {
            JSONObject response = gateway.queryHippocampus(identity, rangeMs);
            JSONArray data = response.optJSONArray("Data");
            if (data == null) data = new JSONArray();

            // Hippocampus's in-memory cache can lose older history out from under a tracked
            // identity (observed 2026-07-22: a 24h request backfilled 151 points from Postgres,
            // then a re-query moments later was back down to ~9, all from after local midnight --
            // root cause not yet found). Whatever Hippocampus actually returned is trusted as-is;
            // only the older slice it's missing gets filled from Postgres, so this self-heals
            // regardless of why the cache came up short.
            long requestedStartSeconds = range[0] / 1000;
            long requestedEndSeconds   = range[1] / 1000;
            long earliestReturnedSeconds = data.length() > 0 ? earliestTimeSeconds(data) : requestedEndSeconds + 1;
            if (earliestReturnedSeconds > requestedStartSeconds) {
                JSONArray dbGap = db().getTelepathonDeneWordStart(telepathon, dene, deneword,
                        requestedStartSeconds, earliestReturnedSeconds - 1);
                if (dbGap.length() > 0) {
                    data = mergeAndSortByTime(dbGap, data);
                    result.put("source", "hippocampus+database");
                } else {
                    result.put("source", "hippocampus");
                }
            } else {
                result.put("source", "hippocampus");
            }
            result.put("count", data.length());
            result.put("data",  data);
        } else {
            long startSeconds = range[0] / 1000;
            long endSeconds   = range[1] / 1000;
            JSONArray data = db().getTelepathonDeneWordStart(telepathon, dene, deneword, startSeconds, endSeconds);
            result.put("source", "database");
            result.put("count",  data.length());
            result.put("data",   data);
        }
        return result;
    }

    /**
     * Merges two {timeSeconds, timeString, Value} arrays into one, sorted ascending by
     * timeSeconds and deduplicated by timeSeconds (later argument wins on collision).
     * Needed because the two sources disagree on order: Hippocampus returns ascending
     * (oldest first), while the multi-table Postgres query concatenates each day's table
     * in its own descending order without a global sort.
     */
    private JSONArray mergeAndSortByTime(JSONArray a, JSONArray b) {
        java.util.TreeMap<Long, JSONObject> merged = new java.util.TreeMap<>();
        for (int i = 0; i < a.length(); i++) {
            JSONObject o = a.getJSONObject(i);
            merged.put(o.getLong("timeSeconds"), o);
        }
        for (int i = 0; i < b.length(); i++) {
            JSONObject o = b.getJSONObject(i);
            merged.put(o.getLong("timeSeconds"), o);
        }
        JSONArray result = new JSONArray();
        for (JSONObject o : merged.values()) result.put(o);
        return result;
    }

    private long earliestTimeSeconds(JSONArray data) {
        long earliest = Long.MAX_VALUE;
        for (int i = 0; i < data.length(); i++) {
            long t = data.getJSONObject(i).getLong("timeSeconds");
            if (t < earliest) earliest = t;
        }
        return earliest;
    }

    /**
     * All numeric DeneWords for a Telepathon, one MQTT query per DeneWord.
     * Reads the dene/deneword structure from the live denome, then queries each field.
     * Params: telepathon, from=YYYY-MM-DD, to=YYYY-MM-DD.
     */
    private JSONObject handleDeviceReport() throws Exception {
        String telepathonName = required("telepathon");
        long[] range = parseTimeRange();

        String teleonomeName = (String) servletContext.getAttribute("TeleonomeName");
        JSONObject denome = (JSONObject) servletContext.getAttribute("CurrentPulse");

        JSONObject telepathonDC = null;
        try {
            telepathonDC = DenomeUtils.getDeneChainByName(denome, TeleonomeConstants.NUCLEI_TELEPATHONS, telepathonName);
        } catch (Exception e) {
            logger.warn("deviceReport: telepathon not found in current denome: " + telepathonName);
        }

        JSONObject result = new JSONObject();
        result.put("command",    "deviceReport");
        result.put("telepathon", telepathonName);
        result.put("fromMillis", range[0]);
        result.put("toMillis",   range[1]);

        TeleonomeDataGateway gateway = (TeleonomeDataGateway) servletContext.getAttribute("TeleonomeDataGateway");
        boolean mqttAvailable = gateway != null && gateway.isConnected();
        result.put("source", mqttAvailable ? "hippocampus+database" : "database");

        JSONArray deneResults = new JSONArray();
        if (telepathonDC != null) {
            JSONArray denes = telepathonDC.optJSONArray("Denes");
            if (denes != null) {
                long rangeMs      = range[1] - range[0];
                long startSeconds = range[0] / 1000;
                long endSeconds   = range[1] / 1000;

                for (int i = 0; i < denes.length(); i++) {
                    JSONObject dene = denes.getJSONObject(i);
                    String deneName = dene.getString("Name");
                    JSONArray deneWords = dene.optJSONArray("DeneWords");
                    if (deneWords == null) continue;

                    JSONArray denewordResults = new JSONArray();
                    for (int j = 0; j < deneWords.length(); j++) {
                        JSONObject deneWord = deneWords.getJSONObject(j);
                        String dwName = deneWord.optString("Name", "");
                        String dwType = deneWord.optString("Value Type", "String");
                        if (dwName.isEmpty() || dwType.equals("String") || dwType.equals("long")) continue;

                        JSONArray data;
                        String identity = "@" + teleonomeName + ":" + TeleonomeConstants.NUCLEI_TELEPATHONS
                                + ":" + telepathonName + ":" + deneName + ":" + dwName;
                        boolean useHippocampus = mqttAvailable && gateway.isTrackedByHippocampus(identity);
                        if (useHippocampus) {
                            try {
                                JSONObject resp = gateway.queryHippocampus(identity, rangeMs);
                                data = resp.optJSONArray("Data");
                                if (data == null) data = new JSONArray();
                                // See handleVariableReport's matching comment: fill whatever
                                // older slice Hippocampus's cache is missing from Postgres.
                                long earliestReturnedSeconds = data.length() > 0 ? earliestTimeSeconds(data) : endSeconds + 1;
                                if (earliestReturnedSeconds > startSeconds) {
                                    JSONArray dbGap = db().getTelepathonDeneWordStart(telepathonName, deneName, dwName,
                                            startSeconds, earliestReturnedSeconds - 1);
                                    if (dbGap.length() > 0) data = mergeAndSortByTime(dbGap, data);
                                }
                            } catch (Exception e) {
                                logger.warn("deviceReport hippocampus query failed for " + dwName + ", falling back to DB: " + e.getMessage());
                                data = db().getTelepathonDeneWordStart(telepathonName, deneName, dwName, startSeconds, endSeconds);
                            }
                        } else {
                            data = db().getTelepathonDeneWordStart(telepathonName, deneName, dwName, startSeconds, endSeconds);
                        }

                        if (data.length() > 0) {
                            JSONObject dwResult = new JSONObject();
                            dwResult.put("deneword", dwName);
                            dwResult.put("type",     dwType);
                            dwResult.put("count",    data.length());
                            dwResult.put("data",     data);
                            denewordResults.put(dwResult);
                        }
                    }
                    if (denewordResults.length() > 0) {
                        JSONObject deneResult = new JSONObject();
                        deneResult.put("dene",      deneName);
                        deneResult.put("denewords", denewordResults);
                        deneResults.put(deneResult);
                    }
                }
            }
        }
        result.put("denes", deneResults);
        return result;
    }

    /**
     * Returns the catalog of remembered DeneWord identities from servlet context.
     */
    private JSONObject handleListRememberedDeneWords() {
        JSONObject deneWordsToRemember = (JSONObject) servletContext.getAttribute("DeneWordsToRemember");
        JSONObject result = new JSONObject();
        result.put("command", "listRememberedDeneWords");
        result.put("rememberedDeneWords", deneWordsToRemember != null ? deneWordsToRemember : new JSONObject());
        return result;
    }

    /**
     * Time series for a remembered DeneWord from the remembereddenewords PostgreSQL tables.
     * Params: identity=<full @identity string>, + time range.
     */
    private JSONObject handleRememberedReport() throws Exception {
        String identity = required("identity");
        long[] range = parseTimeRange();

        JSONArray data = db().getRemeberedDeneWordStart(identity, range[0], range[1]);

        JSONObject result = new JSONObject();
        result.put("command",    "rememberedReport");
        result.put("identity",   identity);
        result.put("fromMillis", range[0]);
        result.put("toMillis",   range[1]);
        result.put("source",     "database");
        result.put("count",      data.length());
        result.put("data",       data);
        return result;
    }

    /**
     * Parses time range from request. Returns [startMillis, endMillis].
     * Accepts: rangeMs=<ms from now>  OR  from=YYYY-MM-DD&to=YYYY-MM-DD
     */
    private long[] parseTimeRange() {
        String rangeMs = request.getParameter("rangeMs");
        if (rangeMs != null && !rangeMs.isEmpty()) {
            long end   = System.currentTimeMillis();
            long start = end - Long.parseLong(rangeMs);
            return new long[]{start, end};
        }
        String from = request.getParameter("from");
        String to   = request.getParameter("to");
        if (from != null && to != null && !from.isEmpty() && !to.isEmpty()) {
            long start = LocalDate.parse(from).atStartOfDay(ZONE).toInstant().toEpochMilli();
            long end   = LocalDate.parse(to).atTime(23, 59, 59).atZone(ZONE).toInstant().toEpochMilli();
            return new long[]{start, end};
        }
        throw new IllegalArgumentException(
                "Must provide either 'rangeMs' (ms from now) or both 'from' and 'to' (YYYY-MM-DD)");
    }

    private String required(String param) {
        String val = request.getParameter(param);
        if (val == null || val.isEmpty()) {
            throw new IllegalArgumentException("Missing required parameter: " + param);
        }
        return val;
    }

    private PostgresqlPersistenceManager db() {
        return (PostgresqlPersistenceManager) servletContext.getAttribute("DBManager");
    }
}
