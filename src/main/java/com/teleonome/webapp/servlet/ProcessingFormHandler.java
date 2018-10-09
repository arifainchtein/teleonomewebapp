package com.teleonome.webapp.servlet;




/**
 * this class is the parent of all classes that
 * are use to process forms
 */
import javax.servlet.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Hashtable;
import javax.servlet.http.*;
import org.apache.log4j.*;
import org.json.JSONObject;

import com.teleonome.framework.exception.PersistenceException;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;


public abstract class ProcessingFormHandler{

	protected HttpServletRequest request;
	
	protected String actionName;
	protected ServletContext servletContext;
	protected HttpServletResponse response;
	protected HttpSession session;
	protected Logger logger;
	protected String command, payload;
	protected Class aClass=null;
	
	
     public ProcessingFormHandler(HttpServletRequest req,HttpServletResponse res,ServletContext servletContext) {
			this.request=req;
			this.response=res;
			this.actionName=actionName;
			this.servletContext=servletContext;	
			logger = Logger.getLogger(getClass());	
			session = request.getSession();
	}
		
	
	/**
	 * process the request and returns the string that represents the class
	 * to be followed next
	 */
	public abstract void process() throws ServletProcessingException, IOException;
	

	public HttpServletRequest getRequest(){
		return request;
	}
	
	
	
	public HttpServletResponse getResponse(){
		return response;
	}
	
	/**
	 * this is used by the action manager
	 *@return ServletContext
	 *@see com.casete.framework.managers.ActionManager
	 */
	public ServletContext getServletContext(){
		return servletContext;
	}

	public String getPayload(){
		return payload;
	}
	public String getCommand(){
		return command;
	}
	
	public JSONObject sendCommand(String command,String commandCode, String payLoad, String clientIp){
		logger.debug("sending command to database =" + command + " commandCode=" + commandCode);
		String toReturn="";
		byte[] buffer = command.getBytes(StandardCharsets.UTF_8);
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");

		JSONObject responseJSONObject = aDBManager.requestCommandToExecute(command,commandCode, payLoad, clientIp);
		boolean includeHuman=true;
		boolean includeInternal=false;
		int offset=0;
		int limit=20;
		JSONObject commandInfo = aDBManager.getAllCommandRequests( includeHuman,  includeInternal,  offset,  limit);
		logger.debug("TeleonomeServlet responseJSONObject=" + commandInfo.toString(4));
		return commandInfo;
	}
}	