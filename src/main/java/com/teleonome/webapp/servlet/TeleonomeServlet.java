package com.teleonome.webapp.servlet;

import java.io.IOException;
import javax.servlet.ServletException;

import javax.servlet.http.HttpSession;

import org.apache.log4j.Logger;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletRequest;

public class TeleonomeServlet extends HttpServlet {


	Logger logger;

public void init() {
	logger = Logger.getLogger(getClass());
}






	public void  doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException{		
		String errorMessage="";
		HttpSession session = req.getSession(true);
		String formName = req.getParameter("formName");
		boolean waitForResponse=true;
		logger.debug("Do Get formaName=" + formName);
	}
	public void  doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException{
		String errorMessage="";
		HttpSession session = req.getSession(true);
		String formName = req.getParameter("formName");
		boolean waitForResponse=true;
		logger.debug("Do Post formaName=" + formName);

	}


	public String getServletInfo() {
		return "Teleonome Servlet";
	}
}
