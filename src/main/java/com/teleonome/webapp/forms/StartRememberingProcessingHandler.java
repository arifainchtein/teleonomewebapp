package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class StartRememberingProcessingHandler extends ProcessingFormHandler {

	public StartRememberingProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);
		String newRememberedDeneWordIdentity = request.getParameter("Identity");
		String clientIp = request.getRemoteAddr();
		logger.debug("newRememberedDeneWordIdentity=" + newRememberedDeneWordIdentity);
		//command = TeleonomeConstants.COMMAND_REBOOT_ENABLE_NETWORK;
		JSONObject payLoadParentJSONObject = new JSONObject();
		JSONObject payLoadJSONObject = new JSONObject();
		String payLoad="";
		try {
			payLoadParentJSONObject.put("Mutation Name","StartRemembering");
			payLoadParentJSONObject.put("Payload", payLoadJSONObject);
			JSONArray updatesArray = new JSONArray();
			payLoadJSONObject.put("Updates"	, updatesArray);

			JSONObject updateJSONObject =  new JSONObject();
			updateJSONObject.put("Target","@On Load:Update Target Identity:Update Target Identity");
			updateJSONObject.put("Value",newRememberedDeneWordIdentity);
			updatesArray.put(updateJSONObject);
			payLoad=payLoadParentJSONObject.toString();
			logger.debug("payLoad=" + payLoad);
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}

		// 
		// to repaint the table, get all the commandrequests
		//
		JSONObject commandsInfo  = sendCommand(command, commandCode,payLoad, clientIp);
		logger.debug("sent command=" + command  + " commandCode="+commandCode + " payLoad=" + payLoad + " clientIp=" + clientIp);	
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(commandsInfo.toString());
		out.flush();
		out.close();

	}

}