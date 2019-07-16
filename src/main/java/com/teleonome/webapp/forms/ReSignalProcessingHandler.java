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

public class ReSignalProcessingHandler extends ProcessingFormHandler {

	public ReSignalProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		String currentIdentityMode = (String) getServletContext().getAttribute("CurrentIdentityMode");
		
		
		String action = request.getParameter("action");
		String clientIp = request.getRemoteAddr();
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);
		String enableNetworkModeS = request.getParameter("EnableNetworkMode");
		boolean enableNetworkMode = enableNetworkModeS!=null && enableNetworkModeS.equals("Yes");
		
		String command=null;
		String payload="";
		
		logger.debug("enableNetworkMode=" + enableNetworkMode);
		if(enableNetworkMode){
			//command = TeleonomeConstants.COMMAND_REBOOT_ENABLE_NETWORK;

			String ssid = request.getParameter("AvailableNetworks");
			String password = request.getParameter("password");
			
			
			logger.debug("ssid=" + ssid);
			logger.debug("password=" + password);
			JSONObject payLoadParentJSONObject = new JSONObject();

			JSONObject payLoadJSONObject = new JSONObject();
			try {
				payLoadParentJSONObject.put("Mutation Name","SetNetworkMode");

				payLoadParentJSONObject.put("Payload", payLoadJSONObject);
				JSONArray updatesArray = new JSONArray();
				payLoadJSONObject.put("Updates"	, updatesArray);

				JSONObject updateJSONObject =  new JSONObject();
				updateJSONObject.put("Target","@On Load:Update SSID:Update SSID");
				updateJSONObject.put("Value",ssid);
				updatesArray.put(updateJSONObject);

				JSONObject updateJSONObject2 =  new JSONObject();
				updateJSONObject2.put("Target","@On Load:Update PSK:Update PSK");
				updateJSONObject2.put("Value", password );
				updatesArray.put(updateJSONObject2);
				payload=payLoadParentJSONObject.toString();
				logger.debug("Setting newtork info, ssid=" + ssid + " ps=" + password);
				logger.debug("payLoad=" + payload);
			} catch (JSONException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}


		}



		logger.debug("the action is " + action);
		if(action.equals(TeleonomeConstants.COMMAND_REBOOT) || action.equals(TeleonomeConstants.COMMAND_REBOOT_TEXT)){
			if(enableNetworkMode){
					command = TeleonomeConstants.COMMAND_REBOOT_ENABLE_NETWORK;
					logger.debug("setting command to " + command);
			}else{
				String enableHostMode = request.getParameter("EnableHostMode");
				logger.debug("the enableHostMode is " + enableHostMode);
				if(enableHostMode!=null && enableHostMode.equals("Yes")){
					command = TeleonomeConstants.COMMAND_REBOOT_ENABLE_HOST;
				}else{
					command = action;
				}
			}
		}else if(action.equals(TeleonomeConstants.COMMAND_SHUTDOWN)  || action.equals(TeleonomeConstants.COMMAND_SHUTDOWN_TEXT)){
			if(currentIdentityMode.equals(TeleonomeConstants.TELEONOME_IDENTITY_SELF)){
				logger.debug("the enableNetworkMode is " + enableNetworkMode);

				if(enableNetworkMode){
					command = TeleonomeConstants.COMMAND_SHUTDOWN_ENABLE_NETWORK;
				}else{
					command = action;
				}

			}else{
				String enableHostMode = request.getParameter("EnableHostMode");
				logger.debug("the enableHostMode is " + enableHostMode);
				if(enableHostMode!=null && enableHostMode.equals("Yes")){
					command = TeleonomeConstants.COMMAND_SHUTDOWN_ENABLE_HOST;
				}else{
					command = action;
				}
			} 
		}else{
		}

		// 
		// to repaint the table, get all the commandrequests
		//
		boolean restartRequired=false;
		JSONObject commandsInfo  = sendCommand(command, commandCode,payload, clientIp, restartRequired);
		
		logger.debug("sent command=" + command  + " commandCode="+commandCode + " payLoad=" + payload + " clientIp=" + clientIp);	
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(commandsInfo.toString());
		out.flush();
		out.close();
	}

}
