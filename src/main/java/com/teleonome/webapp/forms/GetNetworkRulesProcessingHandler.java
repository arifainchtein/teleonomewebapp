package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.microcontroller.cleotildemicrocontroller.OpenWrtUbusClient;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * Cleotilde's Network Rules panel (added 2026-10-27; design: OpenWrtOne/documents/07-network-rules-design.md):
 * the router's tunnel firewall rules, read live from the router on every call. They are never written to
 * the denome, because the denome is public: the IPs, ports and peers only travel router -> here -> browser.
 *
 * A tunnel rule is a firewall rule from zone "relay" (the gate: lets the inner WireGuard tunnel in) or zone
 * "remote" (a door: one tunnel peer to one LAN host and port). Read through ubus uci.get as the read-only
 * rpcd user "cleotilde", whose ACL allows the firewall config only (the network config holds the WireGuard
 * private keys). Peer names come from the optional local file TunnelPeers.json, e.g.
 * {"10.98.0.2": "Ari phone", "10.98.0.3": "Paula3"}, which also stays out of the denome.
 *
 * Answer: {"Rules": [{"Section", "Name", "Kind" (Gate/Door), "Enabled", "From", "FromName", "To", "Ports",
 * "Protocol", "Target"}], "Error": ""}.
 */
public class GetNetworkRulesProcessingHandler extends ProcessingFormHandler {

	public static final String PEERS_FILE = "TunnelPeers.json";
	private static final String ROUTER_ADDRESS = "192.168.1.1";
	private static final String ROUTER_USER = "cleotilde";
	private static final String ROUTER_PASSWORD_FILE = "CleotildeRouter.secret";
	private static final String GATE_ZONE = "relay";
	private static final String DOOR_ZONE = "remote";

	public GetNetworkRulesProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		JSONObject answer = new JSONObject();
		JSONArray rules = new JSONArray();
		String error = "";
		try {
			String password = FileUtils.readFileToString(new File(Utils.getLocalDirectory() + ROUTER_PASSWORD_FILE), StandardCharsets.UTF_8).trim();
			OpenWrtUbusClient ubus = new OpenWrtUbusClient(ROUTER_ADDRESS, ROUTER_USER, password);
			JSONObject sections = ubus.call("uci", "get", new JSONObject().put("config", "firewall")).optJSONObject("values");
			JSONObject peers = readPeers();
			for (JSONObject rule : tunnelRulesInRouterOrder(sections)) {
				rules.put(summary(rule, peers));
			}
		} catch (IOException | JSONException e) {
			error = "Could not read the router's firewall rules: " + e.getMessage();
			logger.warn(error);
		}
		answer.put("Rules", rules);
		answer.put("Error", error);
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}

	private List<JSONObject> tunnelRulesInRouterOrder(JSONObject sections) {
		List<JSONObject> found = new ArrayList<>();
		if (sections == null) return found;
		for (String key : sections.keySet()) {
			JSONObject section = sections.getJSONObject(key);
			String zone = section.optString("src");
			if ("rule".equals(section.optString(".type")) && (GATE_ZONE.equals(zone) || DOOR_ZONE.equals(zone))) {
				found.add(section);
			}
		}
		found.sort(Comparator.comparingInt(s -> s.optInt(".index")));
		return found;
	}

	private JSONObject summary(JSONObject rule, JSONObject peers) {
		boolean gate = GATE_ZONE.equals(rule.optString("src"));
		String from = gate ? "" : text(rule, "src_ip");
		JSONObject s = new JSONObject();
		s.put("Section", rule.optString(".name"));
		s.put("Name", text(rule, "name"));
		s.put("Kind", gate ? "Gate" : "Door");
		s.put("Enabled", !"0".equals(rule.optString("enabled", "1")));
		s.put("From", from);
		// a door without src_ip lets every tunnel peer through
		s.put("FromName", gate ? "the relay (chilhuacle)" : from.isEmpty() ? "every tunnel peer" : peers.optString(from, ""));
		// no dest zone = traffic to the router itself
		s.put("To", rule.has("dest") ? text(rule, "dest_ip") : "the router");
		s.put("Ports", text(rule, "dest_port"));
		s.put("Protocol", rule.has("icmp_type") ? "icmp " + text(rule, "icmp_type") : text(rule, "proto"));
		s.put("Target", text(rule, "target"));
		return s;
	}

	/** uci list options come back as arrays, plain options as strings. */
	private static String text(JSONObject section, String option) {
		JSONArray list = section.optJSONArray(option);
		if (list == null) return section.optString(option, "");
		List<String> parts = new ArrayList<>();
		for (int i = 0; i < list.length(); i++) parts.add(list.optString(i));
		return String.join(" ", parts);
	}

	private JSONObject readPeers() {
		File file = new File(Utils.getLocalDirectory() + PEERS_FILE);
		try {
			if (file.isFile()) return new JSONObject(FileUtils.readFileToString(file, StandardCharsets.UTF_8));
		} catch (IOException | JSONException e) {
			logger.warn("Could not read " + file.getAbsolutePath() + ": " + e.getMessage());
		}
		return new JSONObject();
	}
}
