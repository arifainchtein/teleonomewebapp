package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * Doors (added 2026-11-05; design: OpenWrtOne 07-network-rules-design.md, sections 4-5): let the WireGuard tunnel
 * (the phone on 3G, Paula3) reach one home device on some ports. Never the internet: a door only opens zone "remote".
 *   Action=open    Mac, IP, Ports (comma separated), Minutes (0 = until closed), Source (a tunnel address or "any"),
 *                  Label, CommandCode
 *   Action=close   Mac, CommandCode      (the door stays listed and can be opened again)
 *   Action=remove  Mac, CommandCode
 * Opening widens access, so it is refused unless the request comes from the home network (192.168.1.x): from the
 * tunnel you can look and close, not open. Closing works from anywhere. Both need the 6-digit code.
 * The command goes the same way as Rename and the critical star: the "Remove Device From WhiteList" mutation carries
 * "Door#open#name#dest#ports#minutes#src#label", CleotildeWriter runs the router's cleotilde-doors, which checks
 * every field again and only touches firewall sections named cleotilde_*. The door's name is the MAC without colons.
 */
public class SetDoorProcessingHandler extends ProcessingFormHandler {

	private static final String HOME_NETWORK = "192.168.1.";

	public SetDoorProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	private String param(String name) {
		String v = request.getParameter(name);
		return v == null ? "" : v.trim();
	}

	/** true if the browser is on the home network, not on the tunnel (10.98.0.x) or anywhere else */
	public static boolean fromHome(HttpServletRequest request) {
		String ip = request.getRemoteAddr();
		return ip != null && ip.startsWith(HOME_NETWORK);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String action = param("Action"), mac = param("Mac").toLowerCase();
		String clientIp = request.getRemoteAddr();
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);

		String error = null, value = null;
		if (!mac.matches("[0-9a-f]{2}(:[0-9a-f]{2}){5}")) {
			error = "A door needs the device's MAC address";
		} else if ("open".equals(action)) {
			String ip = param("IP"), ports = param("Ports").replace(" ", ""), source = param("Source").isEmpty() ? "any" : param("Source");
			String label = param("Label").replaceAll("[^A-Za-z0-9 ._-]", "").trim();
			if (label.length() > 40) label = label.substring(0, 40).trim();
			int minutes = -1;
			try {
				minutes = Integer.parseInt(param("Minutes"));
			} catch (NumberFormatException e) {
				// checked below
			}
			if (!fromHome(request)) error = "Doors can only be opened from the home network (you are on " + clientIp + "). Closing works from anywhere.";
			else if (!ip.matches("192\\.168\\.1\\.\\d{1,3}") || ip.equals("192.168.1.1")) error = "The device needs a home network address";
			else if (!ports.matches("\\d{1,5}(,\\d{1,5}){0,5}")) error = "Ports: up to 6 numbers separated by commas";
			else if (minutes < 0 || minutes > 10080) error = "Minutes: 0 (until closed) to 10080 (7 days)";
			else if (!source.equals("any") && !source.matches("10\\.98\\.0\\.\\d{1,3}")) error = "Source: a tunnel address or any";
			else value = "Door#open#" + mac.replace(":", "") + "#" + ip + "#" + ports + "#" + minutes + "#" + source + "#" + label;
		} else if ("close".equals(action) || "remove".equals(action)) {
			value = "Door#" + action + "#" + mac.replace(":", "");
		} else {
			error = "Action must be open, close or remove";
		}

		JSONObject responseJSON;
		if (error != null) {
			responseJSON = new JSONObject().put("error", error);
		} else {
			JSONObject payLoadParentJSONObject = new JSONObject();
			JSONObject payLoadJSONObject = new JSONObject();
			payLoadParentJSONObject.put("Mutation Name", "Remove Device From WhiteList");
			payLoadParentJSONObject.put("Payload", payLoadJSONObject);
			JSONArray updatesArray = new JSONArray();
			payLoadJSONObject.put("Updates", updatesArray);
			JSONObject updateJSONObject = new JSONObject();
			updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_UPDATE_TARGET, "@On Load:Update DeneWord:Set DeneWord");
			updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_VALUE, value);
			updatesArray.put(updateJSONObject);

			command = "Door " + action;
			responseJSON = aDBManager.requestCommandToExecute(command, commandCode, TeleonomeConstants.TELEONOME_SECURITY_CODE,
					payLoadParentJSONObject.toString(), clientIp, false);
			logger.debug("sent command=" + command + " value=" + value + " from " + clientIp + " response=" + responseJSON);
		}
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(responseJSON.toString());
		out.flush();
		out.close();
	}
}
