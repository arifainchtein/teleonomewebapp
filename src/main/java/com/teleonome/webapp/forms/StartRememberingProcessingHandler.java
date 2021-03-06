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
import com.teleonome.framework.denome.Identity;
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
		Identity identity = new Identity(newRememberedDeneWordIdentity);
		String clientIp = request.getRemoteAddr();
		logger.debug("newRememberedDeneWordIdentity=" + newRememberedDeneWordIdentity);
		//command = TeleonomeConstants.COMMAND_REBOOT_ENABLE_NETWORK;
		JSONObject payLoadParentJSONObject = new JSONObject();
		JSONObject payLoadJSONObject = new JSONObject();
		String payload="";
		command="StartRemembering";
		try {
			payLoadParentJSONObject.put("Mutation Name","StartRemembering");
			payLoadParentJSONObject.put("Payload", payLoadJSONObject);
			JSONArray updatesArray = new JSONArray();
			payLoadJSONObject.put("Updates"	, updatesArray);

			JSONObject updateJSONObject =  new JSONObject();
			updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_UPDATE_TARGET,"@Dene Injections:New DeneWord To Remember:DeneWord To Remember");
			updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_VALUE,newRememberedDeneWordIdentity);
			updatesArray.put(updateJSONObject);
			
			JSONObject updateJSONObject2 =  new JSONObject();
			updateJSONObject2.put(TeleonomeConstants.MUTATION_PAYLOAD_UPDATE_TARGET,"@On Finish:Update Dene Name:Update Dene Name");
			updateJSONObject2.put(TeleonomeConstants.MUTATION_PAYLOAD_VALUE,"Remember " +identity.getTeleonomeName() + "-" + identity.getDeneWordName());
			updatesArray.put(updateJSONObject2);
			
			
			payload=payLoadParentJSONObject.toString();
			logger.debug("payLoad=" + payload);
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
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
