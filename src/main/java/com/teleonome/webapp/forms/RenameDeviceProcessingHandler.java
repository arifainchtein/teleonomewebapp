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
 * Rename button on Cleotilde's device cards (added 2026-11-04): gives a device a nickname
 * (CleotildeMicroController.renameDevice, kept in DeviceNicknames.json on the Pi); an empty Nickname goes
 * back to the router's name. Code-protected like the whitelist buttons, since on a security page a rename
 * could make an intruder look like a known device. Same route as Forget: the existing "Remove Device From
 * WhiteList" mutation carries "RenameDevice#mac#nickname", so no denome change is needed.
 */
public class RenameDeviceProcessingHandler extends ProcessingFormHandler {

	public RenameDeviceProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String mac = request.getParameter("DeviceMacAddress") == null ? "" : request.getParameter("DeviceMacAddress").trim();
		String nickname = request.getParameter("Nickname") == null ? "" : request.getParameter("Nickname");
		String clientIp = request.getRemoteAddr();
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);

		JSONObject responseJSON;
		if (!mac.toLowerCase().matches("[0-9a-f]{2}(:[0-9a-f]{2}){5}")) {
			responseJSON = new JSONObject().put("error", "Only a device with a MAC address can be renamed");
		} else {
			// '#' separates the command's fields; control characters have no place in a name
			nickname = nickname.replaceAll("[\\p{Cntrl}#]", "").trim();
			if (nickname.length() > 40) nickname = nickname.substring(0, 40).trim();

			JSONObject payLoadParentJSONObject = new JSONObject();
			JSONObject payLoadJSONObject = new JSONObject();
			payLoadParentJSONObject.put("Mutation Name", "Remove Device From WhiteList");
			payLoadParentJSONObject.put("Payload", payLoadJSONObject);
			JSONArray updatesArray = new JSONArray();
			payLoadJSONObject.put("Updates", updatesArray);
			JSONObject updateJSONObject = new JSONObject();
			updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_UPDATE_TARGET, "@On Load:Update DeneWord:Set DeneWord");
			updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_VALUE, "RenameDevice#" + mac + "#" + nickname);
			updatesArray.put(updateJSONObject);

			command = "Rename Device";
			responseJSON = aDBManager.requestCommandToExecute(command, commandCode, TeleonomeConstants.TELEONOME_SECURITY_CODE,
					payLoadParentJSONObject.toString(), clientIp, false);
			logger.debug("sent command=" + command + " mac=" + mac + " nickname=" + nickname + " response=" + responseJSON);
		}
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(responseJSON.toString());
		out.flush();
		out.close();
	}
}
