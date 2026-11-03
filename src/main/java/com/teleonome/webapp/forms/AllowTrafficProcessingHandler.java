package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.microcontroller.cleotildemicrocontroller.TrafficWatcher;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * Allow / Remove on Cleotilde's Traffic panel (added 2026-11-04): edits TrafficAllowlist.json in the working
 * directory, which TrafficWatcher re-reads within 30 s. Kept out of the denome, which is public.
 *   POST Action=add    Mac, Rule, Country, Domain (empty = any)
 *   POST Action=remove Index
 * Like the doorbell's Release, no code is asked for: only the home network reaches this page, and an
 * allowlist entry only silences alerts, it never opens anything.
 */
public class AllowTrafficProcessingHandler extends ProcessingFormHandler {

	public AllowTrafficProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		JSONObject answer = new JSONObject().put("error", "");
		File f = new File(Utils.getLocalDirectory() + TrafficWatcher.ALLOWLIST_FILE);
		if (!"POST".equals(request.getMethod())) {
			answer.put("error", "Use POST");
		} else {
			synchronized (AllowTrafficProcessingHandler.class) {
				JSONArray list = new JSONArray();
				try {
					if (f.isFile()) list = new JSONArray(FileUtils.readFileToString(f, StandardCharsets.UTF_8));
				} catch (JSONException e) {
					logger.warn("Could not read " + f.getAbsolutePath() + ", starting a new one: " + e.getMessage());
				}
				String action = param("Action");
				if ("remove".equals(action)) {
					try {
						list.remove(Integer.parseInt(param("Index")));
					} catch (RuntimeException e) {
						answer.put("error", "No such entry");
					}
				} else {
					JSONObject entry = new JSONObject().put("Mac", param("Mac")).put("Rule", param("Rule"))
							.put("Country", param("Country").toUpperCase()).put("Domain", param("Domain").toLowerCase())
							.put("Added", System.currentTimeMillis()).put("From", request.getRemoteAddr());
					if (param("Mac").isEmpty() && param("Rule").isEmpty() && param("Country").isEmpty() && param("Domain").isEmpty()) {
						answer.put("error", "An entry needs at least one of device, rule, country or domain");
					} else {
						list.put(entry);
					}
				}
				if (answer.getString("error").isEmpty()) {
					FileUtils.writeStringToFile(f, list.toString(2), StandardCharsets.UTF_8);
					logger.info("Traffic allowlist " + action + " from " + request.getRemoteAddr() + ": " + list.length() + " entries");
				}
				answer.put("Allowlist", list);
			}
		}
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}

	/** Trimmed, at most 200 characters, never null. */
	private String param(String name) {
		String v = request.getParameter(name);
		v = v == null ? "" : v.trim();
		return v.length() > 200 ? v.substring(0, 200) : v;
	}
}
