package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.TimeZone;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;
import org.postgresql.util.PGobject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.denome.Identity;
import com.teleonome.framework.exception.InvalidDenomeException;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class ExportCurrentViewAsDataProcessingHandler extends ProcessingFormHandler {

	public ExportCurrentViewAsDataProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process()  {
		// TODO Auto-generated method stub
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		JSONArray toReturn = new JSONArray();
		String rawData = request.getParameter("data");
		logger.debug("line 38 Refreshcurrent virew, received:" + rawData);
		JSONArray data = new JSONArray(rawData);
		StringBuffer completeResults = new StringBuffer();
		completeResults.append("Pulse Timestamp in Milliseconds#Identity String#Value#Units" + System.lineSeparator());
		
		for(int i =0;i<data.length();i++) {
			JSONObject dataElement = data.getJSONObject(i);
			logger.debug("line 42 Refreshcurrent virew, processing:" + dataElement.toString(4));
			long fromMillis = dataElement.getLong("fromMillis");
			long untilMillis = dataElement.getLong("untilMillis");
			String identityPointer =  dataElement.getString("identity");
			String[] identities = {identityPointer};
			logger.debug("line 77 identityPointer=" + identityPointer + " fromMillis=" + fromMillis+ " untilMillis=" + untilMillis);
			String results = aDBManager.exportRemeberedDeneWordsByPeriodByIdentities(fromMillis, untilMillis, identities, ",");
			completeResults.append(results);
		}

		
		PrintWriter out;
		try {
			out = response.getWriter();
			out.print(completeResults);
			out.flush();
			out.close();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			logger.warn(Utils.getStringException(e));
		}
		
	}
}
