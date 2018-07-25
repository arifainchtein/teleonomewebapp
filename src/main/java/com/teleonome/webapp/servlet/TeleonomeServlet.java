package com.teleonome.webapp.servlet;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.Iterator;
import java.util.List;
import java.util.TimeZone;

import javax.servlet.ServletException;

import javax.servlet.http.HttpSession;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONObject;
import org.postgresql.util.PGobject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.denome.Identity;
import com.teleonome.framework.exception.InvalidDenomeException;
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
		}else if(formName.equals("GetRememberDeneWordList")) {
			//
			// is expeting of the form
			// items={option1:{value:1,text:1},option2:{value:2,text:2}}
			//
			JSONObject deneWordsToRemember = (JSONObject) getServletContext().getAttribute("DeneWordsToRemember");
			Iterator it = deneWordsToRemember.keys();
			int counter=1;
			JSONObject toReturn = new JSONObject();
			JSONObject jo;
			
			while(it.hasNext()) {
				String identityPointer = (String) it.next();
				Identity identity = new Identity(identityPointer);
				String deneWordName = identity.getDeneWordName();
				String teleonomeName = identity.getTeleonomeName();
				jo = new JSONObject();
				jo.put("text", teleonomeName + "-" + deneWordName);
				jo.put("value", identityPointer);
				
				toReturn.put("option"+counter, jo);
				counter++;
			}
			
			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(toReturn.toString());
			out.flush();
			out.close();
			
		}else if(formName.equals("LookUpDeneWord")) {
			
			String identityPointer = req.getParameter("identity");
			Identity identity = new Identity(identityPointer);
			TimeZone timeZone = (TimeZone) getServletContext().getAttribute("TimeZone");
			long from = Long.parseLong(req.getParameter("from"));
			long until = Long.parseLong(req.getParameter("until"));
			
			String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
			logger.debug("for search teleonomeName :" + teleonomeName + " identity.getTeleonomeName()=" + identity.getTeleonomeName());
			PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
			
			JSONArray values = null;
			if(identity.getTeleonomeName().equals(teleonomeName)) {
				values = aDBManager.getDeneWordTimeSeriesByIdentity( identity,  from,  until);
			}else {
				values = aDBManager.getOrganismDeneWordTimeSeriesByIdentity( identity,  from,  until);
			}
			
			logger.debug("After search for :" + identity + " values length=" + values.length());
			
			JSONObject toReturn = new JSONObject();
			toReturn.put("Value", values);
			//
			// to get the units and the minimum, get the last pulse
			org.postgresql.util.PGobject pg = (PGobject) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
			String units = pg.toString();
			//String units = (String) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
			//double minimum = (double) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE);
			pg = (PGobject) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE);
			double minimum = 0.0;
			if(pg!=null && pg.getValue()!=null) {
				minimum = Double.parseDouble(pg.getValue());
			}
			
			logger.debug("After search otherTelenomeLastPulse :" + units + " minimum=" + minimum);
			
			
			
			
			toReturn.put("Units", units);
			toReturn.put("Minimum", minimum);
			
			
			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(toReturn.toString());
			out.flush();
			out.close();
			
	    }else if(formName.equals("RememberDeneWord")) {
			String identityPointer = req.getParameter("identity");
			TimeZone timeZone = (TimeZone) getServletContext().getAttribute("TimeZone");
			long from = Long.parseLong(req.getParameter("from"));
			long until = Long.parseLong(req.getParameter("until"));
			PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
			
			JSONArray values = aDBManager.getRemeberedDeneWord(timeZone, identityPointer, from, until);
			
			JSONObject toReturn = new JSONObject();
			toReturn.put("Value", values);
			
			JSONObject deneWordsToRemember = (JSONObject) getServletContext().getAttribute("DeneWordsToRemember");
			JSONObject deneWordToRemember = deneWordsToRemember.getJSONObject(identityPointer);
			String units="N.A.";
			if(deneWordToRemember.has(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE)) {
				units = deneWordToRemember.getString(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
			}
			double minimum=0.0;
			if(deneWordToRemember.has(TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE)) {
				minimum = deneWordToRemember.getDouble(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
			}
			
			toReturn.put("Units", units);
			toReturn.put("Minimum", minimum);
			res.setContentType("application/json;charset=UTF-8");
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
