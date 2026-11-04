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
 * The star on Cleotilde's Devices page (added 2026-11-05; design: OpenWrtOne 05-teleonome-design.md section 8):
 * puts a device on, or takes it off, the critical list (devices that must always be online).
 *   DeviceMacAddress, DeviceName, Critical=true|false, OfflineMinutes (default 10), CommandCode
 * Code-protected like the whitelist buttons. Same route as Rename and Forget: the existing "Remove Device From
 * WhiteList" mutation carries "AddDeviceToCriticalList#name#mac#minutes" or "RemoveDeviceFromCriticalList#mac",
 * which CleotildeWriter hands to CleotildeMicroController, so no denome change is needed.
 */
public class SetCriticalDeviceProcessingHandler extends ProcessingFormHandler {

	public SetCriticalDeviceProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String mac = request.getParameter("DeviceMacAddress") == null ? "" : request.getParameter("DeviceMacAddress").trim().toLowerCase();
		String name = request.getParameter("DeviceName") == null ? "" : request.getParameter("DeviceName");
		boolean critical = "true".equalsIgnoreCase(request.getParameter("Critical"));
		int minutes = 10;
		try {
			minutes = Math.max(1, Math.min(1440, Integer.parseInt(request.getParameter("OfflineMinutes"))));
		} catch (NumberFormatException e) {
			// default
		}
		String clientIp = request.getRemoteAddr();
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);

		JSONObject responseJSON;
		if (!mac.matches("[0-9a-f]{2}(:[0-9a-f]{2}){5}")) {
			responseJSON = new JSONObject().put("error", "Only a device with a MAC address can be critical");
		} else {
			// '#' separates the command's fields; names are DHCP hostnames, chosen by the device
			name = name.replaceAll("[\\p{Cntrl}#]", "").trim();
			if (name.length() > 100) name = name.substring(0, 100);
			String value = critical ? "AddDeviceToCriticalList#" + name + "#" + mac + "#" + minutes : "RemoveDeviceFromCriticalList#" + mac;

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

			command = critical ? "Add To Critical List" : "Remove From Critical List";
			responseJSON = aDBManager.requestCommandToExecute(command, commandCode, TeleonomeConstants.TELEONOME_SECURITY_CODE,
					payLoadParentJSONObject.toString(), clientIp, false);
			logger.debug("sent command=" + command + " value=" + value + " response=" + responseJSON);
		}
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(responseJSON.toString());
		out.flush();
		out.close();
	}
}
