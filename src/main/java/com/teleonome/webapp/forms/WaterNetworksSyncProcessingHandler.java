package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.microcontroller.digitalstablespublisher.WaterNetworksSync;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * The water network's "Update Digital Stables" button (2026-11-20). The Hypothalamus sends the water networks to
 * devices.digitalstables.com by itself whenever they change (framework WaterNetworksSync, at Publish To
 * DigitalStables) and keeps what it sent and what was acknowledged in DigitalStablesWaterNetworks.info:
 *   status  when they were last sent and acknowledged, and whether a send was asked for and not done yet
 *   send    forget what was acknowledged, so the next Publish To DigitalStables sends them all again
 * No code: it only sends this Teleonome's own networks to its own customer page again.
 */
public class WaterNetworksSyncProcessingHandler extends ProcessingFormHandler {

	public WaterNetworksSyncProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		JSONObject answer;
		try {
			File file = new File(Utils.getLocalDirectory() + WaterNetworksSync.STATE_FILE);
			JSONObject state = file.isFile() ? new JSONObject(FileUtils.readFileToString(file, StandardCharsets.UTF_8)) : new JSONObject();
			if ("send".equals(request.getParameter("action"))) {
				state.remove("Acked Hash");
				state.remove("Sent Hash");
				state.put("Requested At", System.currentTimeMillis());
				FileUtils.writeStringToFile(file, state.toString(4), StandardCharsets.UTF_8);
			}
			answer = new JSONObject();
			for (String key : new String[] { "Sent At", "Acked At", "Requested At", "Answered At" }) answer.put(key, state.optLong(key, 0));
			answer.put("Outcome", state.optString("Outcome", ""));
			answer.put("Sent Networks", state.optJSONArray("Sent Networks") != null ? state.getJSONArray("Sent Networks") : new org.json.JSONArray());
		} catch (Exception e) {
			logger.warn(Utils.getStringException(e));
			answer = new JSONObject().put("error", e.getClass().getSimpleName() + ": " + e.getMessage());
		}
		response.setContentType("application/json");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}
}
