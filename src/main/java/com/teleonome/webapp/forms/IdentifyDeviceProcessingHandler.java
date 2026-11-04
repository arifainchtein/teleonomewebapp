package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.Charset;
import java.util.Collections;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.microcontroller.cleotildemicrocontroller.CleotildeMicroController;
import com.teleonome.framework.microcontroller.cleotildemicrocontroller.DeviceIdentifier;
import com.teleonome.framework.microcontroller.cleotildemicrocontroller.TrafficStore;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * Identify button on Cleotilde's device cards (added 2026-11-04): what a device probably is, to name it.
 *   GET Mac -> {Mac, Name, IP, Vendor, Connection, Private MAC, NetworkName (asked now, mDNS), Guess, Because,
 *               Domains (7 days, top 15), Destinations (7 days, top 10), First Seen, Last Seen}
 * The card's own fields come from NetworkSensor.json (CleotildeMicroController's scan); the rest from the traffic
 * tables. Read-only; only the home network reaches the page.
 */
public class IdentifyDeviceProcessingHandler extends ProcessingFormHandler {

	public IdentifyDeviceProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		String mac = request.getParameter("Mac") == null ? "" : request.getParameter("Mac").trim().toLowerCase();
		JSONObject answer = new JSONObject().put("Mac", mac);
		if (!mac.matches("[0-9a-f]{2}(:[0-9a-f]{2}){5}")) {
			answer.put("error", "Not a MAC address");
			send(answer);
			return;
		}
		JSONObject card = findCard(mac);
		String ip = card.optString(TeleonomeConstants.IP_ADDRESS, "");
		answer.put("Name", card.optString(TeleonomeConstants.DEVICE_NAME, mac)).put("IP", ip)
				.put("Vendor", card.optString(CleotildeMicroController.VENDOR, ""))
				.put("Connection", card.optString(CleotildeMicroController.CONNECTION, ""))
				.put("Private MAC", card.optBoolean(CleotildeMicroController.PRIVATE_MAC))
				.put("Original Name", card.optString(CleotildeMicroController.ORIGINAL_NAME, ""))
				.put("First Seen", card.optLong(CleotildeMicroController.FIRST_SEEN, 0))
				.put("Last Seen", card.optLong(CleotildeMicroController.LAST_SEEN, 0))
				.put("Present", card.optBoolean(TeleonomeConstants.IS_DEVICE_PRESENT));

		String networkName = card.optString(CleotildeMicroController.NETWORK_NAME, "");
		if (!ip.isEmpty()) {
			Map<String, String> now = DeviceIdentifier.networkNames(Collections.singletonList(ip), 6);
			if (now.containsKey(ip)) networkName = now.get(ip);
		}
		answer.put("NetworkName", networkName);

		long weekAgo = System.currentTimeMillis() - 7 * 86_400_000L;
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		TrafficStore store = new TrafficStore(aDBManager);
		JSONArray domains = store.domains(mac, weekAgo, 15);
		answer.put("Domains", domains);
		answer.put("Destinations", store.destinations(mac, weekAgo, 10));
		String names = networkName + " " + card.optString(CleotildeMicroController.ORIGINAL_NAME, card.optString(TeleonomeConstants.DEVICE_NAME, ""));
		JSONObject guess = DeviceIdentifier.guess(answer.getString("Vendor"), names, answer.getString("Connection"), DeviceIdentifier.domainNames(domains));
		answer.put("Guess", guess.getString("Guess")).put("Because", guess.getString("Because"));
		send(answer);
	}

	/** The device's entry in the scan's device list (token 2 of NetworkSensor.json), or an empty object. */
	private JSONObject findCard(String mac) {
		File f = new File(Utils.getLocalDirectory() + CleotildeMicroController.NETWORK_SENSOR_FILE);
		try {
			String[] t = FileUtils.readFileToString(f, Charset.defaultCharset()).split("#", -1);
			if (t.length > 2) {
				JSONArray list = new JSONArray(t[2]);
				for (int i = 0; i < list.length(); i++) {
					JSONObject d = list.getJSONObject(i);
					if (mac.equalsIgnoreCase(d.optString(TeleonomeConstants.MAC_ADDRESS))) return d;
				}
			}
		} catch (IOException | JSONException e) {
			logger.warn("IdentifyDevice could not read " + f.getAbsolutePath() + ": " + e.getMessage());
		}
		return new JSONObject();
	}

	private void send(JSONObject answer) throws IOException {
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}
}
