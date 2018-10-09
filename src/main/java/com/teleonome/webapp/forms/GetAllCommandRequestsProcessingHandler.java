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

public class GetAllCommandRequestsProcessingHandler extends ProcessingFormHandler {

	public GetAllCommandRequestsProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String includeClientS = request.getParameter("IncludeClient");
		String includeInternalS = request.getParameter("IncludeInternal");
		int offset = Integer.parseInt(request.getParameter("offset"));
		int limit = Integer.parseInt(request.getParameter("limit"));
		
		boolean includeClient=false;
		boolean includeInternal=false;
		if(includeClientS!=null && includeClientS.equals("Yes"))includeClient=true;
		if(includeInternalS!=null && includeInternalS.equals("Yes"))includeInternal=true;
		
		//
		// the  method returns a JSONObject with the following structure:
		//
		// "Values":"JSonArray with values"
		// "Total" : integer that represents how many there are without the limit, this is to know fpr pagination
		
		JSONObject commandInfo  = aDBManager.getAllCommandRequests(includeClient,includeInternal,  offset,  limit );
		logger.debug("GetAllCommandRequests returns=" + commandInfo.toString(4)  );	
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(commandInfo.toString());
		out.flush();
		out.close();
	}

}
