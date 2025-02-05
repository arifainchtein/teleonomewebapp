package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
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


public class DeleteTelepathonProcessingHandler extends ProcessingFormHandler {

	public DeleteTelepathonProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub

		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String telepathonName = request.getParameter("telepathonName");
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);
		String clientIp = request.getRemoteAddr();
		command="Delete Telepathon";
		
		JSONObject payLoadParentJSONObject = new JSONObject();
		JSONObject payLoadJSONObject = new JSONObject();
		payLoadParentJSONObject.put("Mutation Name","Delete Telepathon");
		payLoadParentJSONObject.put("Payload", payLoadJSONObject);
		JSONArray updatesArray = new JSONArray();
		payLoadJSONObject.put("Updates"	, updatesArray);

		JSONObject updateJSONObject =  new JSONObject();
		updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_UPDATE_TARGET,"@On Load:Update DeneWord:Set DeneWord");
		String value = "DeleteTelepathon#"+telepathonName;
		updateJSONObject.put(TeleonomeConstants.MUTATION_PAYLOAD_VALUE,value);
		
		updatesArray.put(updateJSONObject);
		String payLoad=payLoadParentJSONObject.toString();
		
		
		
		boolean restartRequired=false;
		String commandCodeType=TeleonomeConstants.TELEONOME_SECURITY_CODE;
		JSONObject responseJSON = aDBManager.requestCommandToExecute(command, commandCode,commandCodeType,payLoad, clientIp, restartRequired);
		
		
		PrintWriter out = response.getWriter();
		out.print("");
		out.flush();
		out.close();
	}

}
