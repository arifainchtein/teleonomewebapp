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
import com.teleonome.framework.denome.Identity;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class LookUpDeneWordProcessingHandler extends ProcessingFormHandler {

	public LookUpDeneWordProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		
		String identityPointer = request.getParameter("identity");
		Identity identity = new Identity(identityPointer);
		TimeZone timeZone = (TimeZone) getServletContext().getAttribute("TimeZone");
		long from = Long.parseLong(request.getParameter("from"));
		long until = Long.parseLong(request.getParameter("until"));

		String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
		logger.debug("for search teleonomeName :" + teleonomeName + " identity.getTeleonomeName()=" + identity.getTeleonomeName());

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
		String units = "";
		if(pg!=null) {
			units = pg.toString();
		}
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

		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(toReturn.toString());
		out.flush();
		out.close();
	}

}
