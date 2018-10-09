package com.teleonome.webapp.servlet;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.TimeZone;

import javax.servlet.ServletException;

import javax.servlet.http.HttpSession;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.postgresql.util.PGobject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.denome.Identity;
import com.teleonome.framework.exception.InvalidDenomeException;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.network.NetworkUtilities;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletRequest;

public class TeleonomeServlet extends HttpServlet {


	Logger logger;


	public void init() {
		logger = Logger.getLogger(getClass());

	}

	public void  doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException{
		process(req, res);
	}
	public void  doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException{
		process(req, res);
	}

	public void  process(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException{		
		String errorMessage="";
		HttpSession session = req.getSession(true);
		String formName = req.getParameter("formName");
		logger.debug("formaName=" + formName );
		String className = "com.teleonome.webapp.forms." + formName + "ProcessingHandler";
		ProcessingFormHandler processingFormHandler;
		try {
			processingFormHandler = ProcessingFormHandlerFactory.createProcessingFormHandler(className,req,res, getServletContext());
			processingFormHandler.process();
		} catch (ServletProcessingException e) {
			// TODO Auto-generated catch block
			logger.warn(Utils.getStringException(e));
		}
	}


	





	public String getServletInfo() {
		return "Teleonome Servlet";
	}
}
