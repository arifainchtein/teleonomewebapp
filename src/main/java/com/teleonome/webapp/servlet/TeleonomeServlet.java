package com.teleonome.webapp.servlet;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Iterator;
import java.util.List;

import javax.servlet.ServletException;

import javax.servlet.http.HttpSession;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.log4j.Logger;

import com.teleonome.framework.utils.Utils;

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
		if(formName.equals("GetLogFile")) {
			String logFileName = req.getParameter("logFileName");
			File logFile = new File(Utils.getLocalDirectory() + "tomcat/webapps/ROOT/" + logFileName);
			List<String> logLines = FileUtils.readLines(logFile);
			StringBuffer toReturn = new StringBuffer();
			Iterator<String> it = logLines.iterator();
			while(it.hasNext()) {
				toReturn.append(it.next() + "<br>");
			}
			
			res.setContentType("text/html;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(toReturn.toString());
			out.flush();
			out.close();
		}else if(formName.equals("GetLogFileNames")) {
			String dirName = req.getParameter("dirName");
			StringBuffer toReturn = new StringBuffer();
			File logDir = new File(Utils.getLocalDirectory() + "tomcat/webapps/ROOT/logs/" + dirName);
			File[] files = logDir.listFiles();
			for(int i=0;i<files.length;i++) {
				if(i>0)toReturn.append(",");
				toReturn.append(FilenameUtils.getBaseName(files[i].getAbsolutePath()));
			}
			
			res.setContentType("text/html;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(toReturn.toString());
			out.flush();
			out.close();
		}
		
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
