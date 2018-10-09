package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.TimeZone;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class RememberDeneWordProcessingHandler extends ProcessingFormHandler {

	public RememberDeneWordProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		
		String identityPointer = request.getParameter("identity");
		TimeZone timeZone = (TimeZone) getServletContext().getAttribute("TimeZone");
		long from = Long.parseLong(request.getParameter("from"));
		long until = Long.parseLong(request.getParameter("until"));
		logger.debug("identityPointer=" + identityPointer);
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
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(toReturn.toString());
		out.flush();
		out.close();
	}

	

}
