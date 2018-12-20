package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;
              
public class GetOrganismPulseByTeleonomeNameAndTimestampProcessingHandler extends ProcessingFormHandler {

	public GetOrganismPulseByTeleonomeNameAndTimestampProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		
		String requestedTeleonomeName = request.getParameter("TeleonomeName");
		long timemillis = Long.parseLong(request.getParameter("PulseMillis"));
		JSONObject pulseJSONObject = new JSONObject();
		String telonomeName = (String) servletContext.getAttribute("TeleonomeName");
		if(requestedTeleonomeName.equals(telonomeName)) {
			pulseJSONObject = aDBManager.getPulseByTimestamp(  timemillis);
		}else {
			pulseJSONObject = aDBManager.getOrganismPulseByTeleonomeNameAndTimestamp( requestedTeleonomeName,  timemillis);
		}
		
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(pulseJSONObject.toString(4));
		out.flush();
		out.close(); 
	}

}
