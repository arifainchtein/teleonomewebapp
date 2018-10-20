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

public class UpdateFormRequestProcessingHandler extends ProcessingFormHandler {

	public UpdateFormRequestProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		
		String identityPointer = request.getParameter(TeleonomeConstants.TELEONOME_IDENTITY_LABEL);
		String value = request.getParameter(TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE);
		Object valueType = request.getParameter("ValueType");//TeleonomeConstants.DENEWORD_VALUETYPE_ATTRIBUTE);
		
		String clientIp = request.getRemoteAddr();
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);

		logger.warn("about to apply mutation identityPointer=" + identityPointer + " value=" + value + " valueType=" + valueType);

		JSONObject payLoadParentJSONObject = new JSONObject();
		JSONObject payLoadJSONObject = new JSONObject();
		payLoadParentJSONObject.put("Mutation Name","UpdateControlParameters");
		payLoadParentJSONObject.put("Payload", payLoadJSONObject);
		JSONArray updatesArray = new JSONArray();
		payLoadJSONObject.put("Updates"	, updatesArray);

		JSONObject updateJSONObject =  new JSONObject();
		updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_UPDATE_TARGET,"@On Load:Update DeneWord:Update DeneWord");
		updateJSONObject.put(TeleonomeConstants.MUTATION_TARGET,identityPointer);
		
		if(valueType.equals(TeleonomeConstants.DATATYPE_INTEGER)) {
			updateJSONObject.put("Value",Integer.parseInt(value));
			
		}else if(valueType.equals(TeleonomeConstants.DATATYPE_DOUBLE)) {
			updateJSONObject.put("Value",Double.parseDouble(value));
			
		}else if(valueType.equals(TeleonomeConstants.DATATYPE_LONG)) {
			updateJSONObject.put("Value",Long.parseLong(value));
			
		}else if(valueType.equals(TeleonomeConstants.DATATYPE_DENE_POINTER)) {
			updateJSONObject.put("Value",value);
		
		}else if(valueType.equals(TeleonomeConstants.DATATYPE_STRING)) {
			updateJSONObject.put("Value",value);
		
		}
		updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_VALUE,value);
		updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_VALUETYPE,valueType);
		
		updatesArray.put(updateJSONObject);

		


		command="SetParameters";
		String payLoad=payLoadParentJSONObject.toString();

		JSONObject responseJSON = aDBManager.requestCommandToExecute(command, commandCode,payLoad, clientIp);
		logger.debug("sent command=" + command  + " response=" + responseJSON.toString(4));	
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(responseJSON.toString());
		out.flush();
		out.close();
	}

}
