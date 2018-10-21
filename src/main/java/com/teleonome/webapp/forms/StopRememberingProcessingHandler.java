package com.teleonome.webapp.forms;




import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;

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
	public class StopRememberingProcessingHandler extends ProcessingFormHandler {

	public StopRememberingProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);
		String stopRememberedDeneWordIdentity = request.getParameter("Identity");
		//
		// the value contained in the variable stopRememberedDeneWordIdentity
		// is the value of the deneword that needs to be deleted
		// so now to find out the actual deneword
		// ie find the deneword in the denome whose value is stopRememberedDeneWordIdentity
		
		JSONObject deneWordsToRemember = (JSONObject) getServletContext().getAttribute("DeneWordsToRemember");
		Iterator it = deneWordsToRemember.keys();
		
		JSONObject jo;
		String targetIdentity="";
		JSONObject infoJSONObject;
		found:
		while(it.hasNext()) {
			String identityPointer = (String) it.next();
			if(stopRememberedDeneWordIdentity.equals(identityPointer)) {
				
				infoJSONObject = deneWordsToRemember.getJSONObject(identityPointer);
				targetIdentity = infoJSONObject.getString(TeleonomeConstants.DENEWORD_IDENTITY_ATTRIBUTE);
			}
		}
	
		Identity identity = new Identity(stopRememberedDeneWordIdentity);
		String clientIp = request.getRemoteAddr();
		logger.debug("stopRememberedDeneWordIdentity=" + stopRememberedDeneWordIdentity + " targetIdentity=" + targetIdentity);
		
		//command = TeleonomeConstants.COMMAND_REBOOT_ENABLE_NETWORK;
		JSONObject payLoadParentJSONObject = new JSONObject();
		JSONObject payLoadJSONObject = new JSONObject();
		payload="";
		command="StopRemembering";
		try {
			payLoadParentJSONObject.put("Mutation Name","StopRemembering");
			payLoadParentJSONObject.put("Payload", payLoadJSONObject);
			JSONArray updatesArray = new JSONArray();
			payLoadJSONObject.put("Updates"	, updatesArray);

			JSONObject updateJSONObject =  new JSONObject();
			updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_UPDATE_TARGET,"@DeneWord Deletion:DeneWord Carrier:DeneWord To Stop Remembering");
			updateJSONObject.put(TeleonomeConstants.MUTATION_DELETION_TARGET,targetIdentity);
			updatesArray.put(updateJSONObject);
			
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
