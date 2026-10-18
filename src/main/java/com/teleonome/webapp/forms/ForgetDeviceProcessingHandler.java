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
 * Forget button on the "Not seen" device cards (added 2026-10-18 for Cleotilde): deletes the
 * device's scan history so it leaves the list (CleotildeMicroController.forgetDevice).
 * It goes through the existing "Remove Device From WhiteList" mutation, which just sets its
 * action's command to the value sent here, so no denome change is needed; the writer tells the
 * commands apart by their first token.
 */
public class ForgetDeviceProcessingHandler extends ProcessingFormHandler {

	public ForgetDeviceProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {

		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String deviceName = request.getParameter("DeviceName");
		String deviceMacAddress = request.getParameter("DeviceMacAddress");
		String clientIp = request.getRemoteAddr();
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);

		JSONObject payLoadParentJSONObject = new JSONObject();
		JSONObject payLoadJSONObject = new JSONObject();
		payLoadParentJSONObject.put("Mutation Name","Remove Device From WhiteList");
		payLoadParentJSONObject.put("Payload", payLoadJSONObject);
		JSONArray updatesArray = new JSONArray();
		payLoadJSONObject.put("Updates"	, updatesArray);

		JSONObject updateJSONObject =  new JSONObject();
		updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_UPDATE_TARGET,"@On Load:Update DeneWord:Set DeneWord");
		// '#' separates the command's fields, so it can't be part of a name
		String value = "ForgetDevice#" + deviceName.replace("#", "")
				+ (deviceMacAddress == null || deviceMacAddress.isEmpty() ? "" : "#" + deviceMacAddress.replace("#", ""));
		updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_VALUE,value);
		updatesArray.put(updateJSONObject);

		command="Forget Device";
		boolean restartRequired=false;
		String payLoad=payLoadParentJSONObject.toString();
		String commandCodeType=TeleonomeConstants.TELEONOME_SECURITY_CODE;
		JSONObject responseJSON = aDBManager.requestCommandToExecute(command, commandCode,commandCodeType,payLoad, clientIp, restartRequired);

		logger.debug("sent commandCode=" + commandCode + " command=" + command  + " response=" + responseJSON.toString(4));
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(responseJSON.toString());
		out.flush();
		out.close();
	}

}
