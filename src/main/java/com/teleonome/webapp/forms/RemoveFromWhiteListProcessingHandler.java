package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.exception.MissingDenomeException;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.exception.TeleonomeValidationException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class RemoveFromWhiteListProcessingHandler extends ProcessingFormHandler {

	public RemoveFromWhiteListProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {

		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String deviceName = request.getParameter("DeviceName");
		String clientIp = request.getRemoteAddr();
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);

		JSONObject payLoadParentJSONObject = new JSONObject();
		JSONObject payLoadJSONObject = new JSONObject();
		payLoadParentJSONObject.put("Mutation Name","Remove From White List");
		payLoadParentJSONObject.put("Payload", payLoadJSONObject);
		JSONArray updatesArray = new JSONArray();
		payLoadJSONObject.put("Updates"	, updatesArray);

		JSONObject updateJSONObject =  new JSONObject();
		updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_UPDATE_TARGET,"@On Load:Update DeneWord:Update DeneWord");
		String value = "RemoveDeviceFromWhiteList#"+deviceName;
		updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_VALUE,value);
		updatesArray.put(updateJSONObject);

		command="RemoveFromWhiteList";
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





		//		aDBManager.removeDeviceFromWhiteList(deviceName);
		//		response.setContentType("text/html;charset=UTF-8");
		//		PrintWriter out = response.getWriter();
		//		out.print("Ok");
		//		out.flush();
		//		out.close();
	}

}
