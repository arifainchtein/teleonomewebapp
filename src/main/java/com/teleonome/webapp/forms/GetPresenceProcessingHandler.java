package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * Who is here, who came and who left, for Cleotilde's Devices page (added 2026-11-05; design: OpenWrtOne
 * 05-teleonome-design.md section 8). Read-only, from the networkdeviceactivity_Y_M_D tables (one row per
 * device present at each scan, ~every 3.5 min) and the critical list (networkdevicecriticallist).
 *   Hours=1..168 (default 24)
 * -> {Now, Since, Scans, LastScan, ScanEvery (median millis between scans), Gaps [[from,to]] (no scans),
 *     Critical [{Mac, Name, IP, Present, Down, LastSeen, OfflineMinutes, Availability (0..1 in the window)}],
 *     Devices [{Mac, Name, IP, Known, Critical, Present, Intervals [[from, to or 0 = still here]]}],
 *     Events [{Time, Type arrived|left, Mac, Name, Known, Critical}] newest first}
 *
 * A device has left after missing 3 scans that really ran: a scan counts only if it found at least half the
 * median number of devices, so a scan that failed half way doesn't make everyone "leave". Its departure time
 * is the last scan that saw it. Phones that sleep come and go, so they show up often in the feed.
 */
public class GetPresenceProcessingHandler extends ProcessingFormHandler {

	private static final int MISSES_TO_LEAVE = 3;
	private static final long LOOKBACK_MILLIS = 2 * 3_600_000L;	// to know who was already here at the start
	// networkdevicecriticallist (framework TeleonomeConstants since 2026-11-05); the literal, so this form works with an older framework jar
	private static final String CRITICAL_LIST_TABLE = "networkdevicecriticallist";
	private static final String MAC_PATTERN = "[0-9a-f]{2}(:[0-9a-f]{2}){5}";

	public GetPresenceProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	private static class Seen {
		String name = "", ip = "";
		boolean known;
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		int hours = 24;
		try {
			hours = Math.max(1, Math.min(168, Integer.parseInt(request.getParameter("Hours"))));
		} catch (NumberFormatException e) {
			// default
		}
		long now = System.currentTimeMillis(), since = now - hours * 3_600_000L, from = since - LOOKBACK_MILLIS;

		// scan time -> who it saw; mac -> latest name/ip/known
		TreeMap<Long, Set<String>> scans = new TreeMap<>();
		Map<String, Seen> latest = new HashMap<>();
		JSONArray criticalRows = new JSONArray();
		Connection connection = null;
		try {
			connection = aDBManager.getConnection();
			for (String table : tables(connection, from, now)) {
				// table names are built here from dates, not from the request
				try (PreparedStatement st = connection.prepareStatement("select scantimemillis, lower(devicemacaddress), devicename, deviceipaddress, whiteliststatus from "
						+ table + " where ispresent and devicemacaddress<>'' and scantimemillis>=? order by scantimemillis")) {
					st.setLong(1, from);
					try (ResultSet rs = st.executeQuery()) {
						while (rs.next()) {
							String mac = rs.getString(2);
							if (mac == null || !mac.matches(MAC_PATTERN)) continue;
							scans.computeIfAbsent(rs.getLong(1), k -> new HashSet<>()).add(mac);
							Seen s = latest.computeIfAbsent(mac, k -> new Seen());
							s.name = rs.getString(3) == null ? "" : rs.getString(3);
							s.ip = rs.getString(4) == null ? "" : rs.getString(4);
							s.known = rs.getBoolean(5);
						}
					}
				}
			}
			if (exists(connection, CRITICAL_LIST_TABLE)) {
				try (PreparedStatement st = connection.prepareStatement("select devicename, lower(devicemacaddress), coalesce(offlineminutes,10) from "
						+ CRITICAL_LIST_TABLE + " order by devicename");
						ResultSet rs = st.executeQuery()) {
					while (rs.next()) {
						criticalRows.put(new JSONObject().put("Name", rs.getString(1) == null ? "" : rs.getString(1))
								.put("Mac", rs.getString(2)).put("OfflineMinutes", rs.getInt(3)));
					}
				}
			}
		} catch (SQLException e) {
			logger.warn(Utils.getStringException(e));
		} finally {
			if (connection != null) aDBManager.closeConnection(connection);
		}

		// only the scans that really ran
		List<Integer> sizes = new ArrayList<>();
		for (Set<String> s : scans.values()) sizes.add(s.size());
		Collections.sort(sizes);
		int median = sizes.isEmpty() ? 0 : sizes.get(sizes.size() / 2);
		List<Long> valid = new ArrayList<>();
		for (Map.Entry<Long, Set<String>> e : scans.entrySet()) {
			if (e.getValue().size() >= Math.max(3, median / 2.0)) valid.add(e.getKey());
		}

		JSONObject nicknames = readNicknames();
		Set<String> criticalMacs = new HashSet<>();
		for (int i = 0; i < criticalRows.length(); i++) criticalMacs.add(criticalRows.getJSONObject(i).getString("Mac"));

		// walk the scans: arrivals, departures, and each device's intervals
		Map<String, Boolean> here = new HashMap<>();
		Map<String, Integer> misses = new HashMap<>();
		Map<String, Long> lastSeen = new HashMap<>(), arrivedAt = new HashMap<>();
		Map<String, Integer> presentScansInWindow = new HashMap<>();
		Map<String, JSONArray> intervals = new LinkedHashMap<>();
		JSONArray events = new JSONArray();
		int scansInWindow = 0;
		for (int i = 0; i < valid.size(); i++) {
			long t = valid.get(i);
			Set<String> seen = scans.get(t);
			if (t >= since) scansInWindow++;
			for (String mac : seen) {
				if (!Boolean.TRUE.equals(here.get(mac))) {
					here.put(mac, true);
					arrivedAt.put(mac, t);
					// the first scan only tells who was already here
					if (i > 0 && t >= since) events.put(event(t, "arrived", mac, latest, nicknames, criticalMacs));
				}
				misses.put(mac, 0);
				lastSeen.put(mac, t);
				if (t >= since) presentScansInWindow.merge(mac, 1, Integer::sum);
			}
			for (Map.Entry<String, Boolean> e : here.entrySet()) {
				String mac = e.getKey();
				if (!e.getValue() || seen.contains(mac)) continue;
				int m = misses.merge(mac, 1, Integer::sum);
				if (m == MISSES_TO_LEAVE) {
					e.setValue(false);
					long left = lastSeen.get(mac);
					if (left >= since) events.put(event(left, "left", mac, latest, nicknames, criticalMacs));
					addInterval(intervals, mac, arrivedAt.get(mac), left, since);
				}
			}
		}
		for (Map.Entry<String, Boolean> e : here.entrySet()) {
			if (e.getValue()) addInterval(intervals, e.getKey(), arrivedAt.get(e.getKey()), 0, since);
		}

		JSONArray devices = new JSONArray();
		for (Map.Entry<String, JSONArray> e : intervals.entrySet()) {
			String mac = e.getKey();
			devices.put(new JSONObject().put("Mac", mac).put("Name", nameOf(mac, latest, nicknames))
					.put("IP", latest.get(mac).ip).put("Known", latest.get(mac).known).put("Critical", criticalMacs.contains(mac))
					.put("Present", Boolean.TRUE.equals(here.get(mac))).put("Intervals", e.getValue()));
		}

		JSONArray critical = new JSONArray();
		for (int i = 0; i < criticalRows.length(); i++) {
			JSONObject c = criticalRows.getJSONObject(i);
			String mac = c.getString("Mac");
			long last = lastSeen.containsKey(mac) ? lastSeen.get(mac) : 0;
			boolean present = Boolean.TRUE.equals(here.get(mac));
			// down: not seen for longer than its threshold (scans only run every few minutes, so never sooner than 2 scans)
			boolean down = last == 0 || now - last > Math.max(c.getInt("OfflineMinutes") * 60_000L, 2 * scanEvery(valid));
			Seen s = latest.get(mac);
			critical.put(new JSONObject().put("Mac", mac)
					.put("Name", s != null ? nameOf(mac, latest, nicknames) : nicknames.optString(mac, c.getString("Name")))
					.put("IP", s != null ? s.ip : "").put("Present", present).put("Down", down).put("LastSeen", last)
					.put("OfflineMinutes", c.getInt("OfflineMinutes"))
					.put("Availability", scansInWindow == 0 ? 0 : presentScansInWindow.getOrDefault(mac, 0) / (double) scansInWindow));
		}

		// newest first
		List<JSONObject> sorted = new ArrayList<>();
		for (int i = 0; i < events.length(); i++) sorted.add(events.getJSONObject(i));
		sorted.sort((a, b) -> Long.compare(b.getLong("Time"), a.getLong("Time")));

		JSONArray gaps = new JSONArray();
		long every = scanEvery(valid);
		for (int i = 1; i < valid.size(); i++) {
			if (valid.get(i) >= since && valid.get(i) - valid.get(i - 1) > Math.max(15 * 60_000L, 4 * every)) {
				gaps.put(new JSONArray().put(Math.max(since, valid.get(i - 1))).put(valid.get(i)));
			}
		}

		JSONObject answer = new JSONObject().put("Now", now).put("Since", since).put("Hours", hours)
				.put("Scans", scansInWindow).put("LastScan", valid.isEmpty() ? 0 : valid.get(valid.size() - 1))
				.put("ScanEvery", every).put("Gaps", gaps)
				.put("Critical", critical).put("Devices", devices).put("Events", new JSONArray(sorted));
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}

	private static void addInterval(Map<String, JSONArray> intervals, String mac, long start, long end, long since) {
		if (end != 0 && end < since) return;
		intervals.computeIfAbsent(mac, k -> new JSONArray()).put(new JSONArray().put(Math.max(start, since)).put(end));
	}

	private static long scanEvery(List<Long> valid) {
		if (valid.size() < 2) return 240_000L;
		List<Long> gaps = new ArrayList<>();
		for (int i = 1; i < valid.size(); i++) gaps.add(valid.get(i) - valid.get(i - 1));
		Collections.sort(gaps);
		return gaps.get(gaps.size() / 2);
	}

	private static String nameOf(String mac, Map<String, Seen> latest, JSONObject nicknames) {
		String nick = nicknames.optString(mac, "");
		return nick.isEmpty() ? latest.get(mac).name : nick;
	}

	private static JSONObject event(long t, String type, String mac, Map<String, Seen> latest, JSONObject nicknames, Set<String> criticalMacs) {
		return new JSONObject().put("Time", t).put("Type", type).put("Mac", mac).put("Name", nameOf(mac, latest, nicknames))
				.put("IP", latest.get(mac).ip).put("Known", latest.get(mac).known).put("Critical", criticalMacs.contains(mac));
	}

	/** networkdeviceactivity_Y_M_D (1-based month) for every day from..until that exists */
	private List<String> tables(Connection connection, long from, long until) throws SQLException {
		List<String> toReturn = new ArrayList<>();
		Calendar c = Calendar.getInstance();
		c.setTimeInMillis(from);
		c.set(Calendar.HOUR_OF_DAY, 0);
		c.set(Calendar.MINUTE, 0);
		c.set(Calendar.SECOND, 0);
		c.set(Calendar.MILLISECOND, 0);
		while (c.getTimeInMillis() <= until) {
			String name = TeleonomeConstants.NETWORK_DEVICE_ACTIVITY_TABLE + "_" + c.get(Calendar.YEAR) + "_" + (1 + c.get(Calendar.MONTH)) + "_" + c.get(Calendar.DATE);
			if (exists(connection, name)) toReturn.add(name);
			c.add(Calendar.DATE, 1);
		}
		return toReturn;
	}

	private static boolean exists(Connection connection, String table) throws SQLException {
		try (PreparedStatement st = connection.prepareStatement("select to_regclass(?) is not null")) {
			st.setString(1, table);
			try (ResultSet rs = st.executeQuery()) {
				return rs.next() && rs.getBoolean(1);
			}
		}
	}

	private JSONObject readNicknames() {
		File f = new File(Utils.getLocalDirectory() + "DeviceNicknames.json");
		try {
			return f.isFile() ? new JSONObject(FileUtils.readFileToString(f, StandardCharsets.UTF_8)) : new JSONObject();
		} catch (IOException | JSONException e) {
			return new JSONObject();
		}
	}
}
