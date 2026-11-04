package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.Calendar;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.microcontroller.cleotildemicrocontroller.TrafficStore;
import com.teleonome.framework.microcontroller.cleotildemicrocontroller.TrafficWatcher;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * Cleotilde's Traffic panel (added 2026-11-04; design: OpenWrtOne/documents/05-teleonome-design.md, 7c).
 * Reads the tables TrafficWatcher fills (TrafficStore).
 *   View=overview  Days=1|7|30  -> {Devices, Countries, Hours, TopDomains, Events (last 7 days or Days), Allowlist}
 *   View=device    Days, Mac    -> {Destinations, Domains, Hours}
 *   View=country   Days, Country -> {Devices, Destinations}  (the map tab, 2026-11-04)
 * Days=1 means since midnight. Read-only.
 */
public class GetTrafficProcessingHandler extends ProcessingFormHandler {

	public GetTrafficProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		TrafficStore store = new TrafficStore(aDBManager);
		String view = request.getParameter("View") == null ? "overview" : request.getParameter("View");
		int days = 1;
		try {
			days = Math.max(1, Math.min(60, Integer.parseInt(request.getParameter("Days"))));
		} catch (NumberFormatException e) {
			// today
		}
		Calendar c = Calendar.getInstance();
		c.set(Calendar.HOUR_OF_DAY, 0);
		c.set(Calendar.MINUTE, 0);
		c.set(Calendar.SECOND, 0);
		c.set(Calendar.MILLISECOND, 0);
		long since = c.getTimeInMillis() - (days - 1) * 86_400_000L;

		JSONObject answer = new JSONObject().put("Since", since).put("Days", days);
		if ("country".equals(view)) {
			// the map's country detail (2026-11-04): who talks to it, and where there
			String country = request.getParameter("Country") == null ? "" : request.getParameter("Country").trim().toUpperCase();
			if (!country.matches("[A-Z]{2}")) country = "";
			answer.put("Country", country);
			JSONObject detail = store.countryDetail(country, since, 50);
			answer.put("Devices", detail.getJSONArray("Devices"));
			answer.put("Destinations", detail.getJSONArray("Destinations"));
		} else if ("device".equals(view)) {
			String mac = request.getParameter("Mac") == null ? "" : request.getParameter("Mac");
			answer.put("Mac", mac);
			answer.put("Destinations", store.destinations(mac, since, 100));
			answer.put("Domains", store.domains(mac, since, 50));
			answer.put("Hours", store.hours(mac, since));
		} else {
			answer.put("Devices", store.devices(since));
			answer.put("Countries", store.countries(since));
			answer.put("Hours", store.hours("", since));
			answer.put("TopDomains", store.domains("", since, 30));
			answer.put("Events", store.events(Math.min(since, System.currentTimeMillis() - 7 * 86_400_000L), 100));
			answer.put("Allowlist", readAllowlist());
		}
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}

	private JSONArray readAllowlist() {
		File f = new File(Utils.getLocalDirectory() + TrafficWatcher.ALLOWLIST_FILE);
		try {
			return f.isFile() ? new JSONArray(FileUtils.readFileToString(f, StandardCharsets.UTF_8)) : new JSONArray();
		} catch (IOException | JSONException e) {
			logger.warn("Could not read " + f.getAbsolutePath() + ": " + e.getMessage());
			return new JSONArray();
		}
	}
}
