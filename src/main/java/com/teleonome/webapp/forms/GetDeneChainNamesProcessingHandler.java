package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetDeneChainNamesProcessingHandler extends ProcessingFormHandler {

	public GetDeneChainNamesProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		
		String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
		String anyTeleonomeName = request.getParameter("TeleonomeName");
		String nucleus = request.getParameter("Nucleus");
		logger.debug("GetDeneChainNames, anyTeleonomeName=" + anyTeleonomeName + " nucleus=" + nucleus);
		JSONArray data=null;
		if(teleonomeName.equals(anyTeleonomeName)) {
			JSONObject pulse = (JSONObject) getServletContext().getAttribute("LastPulse");
			data = DenomeUtils.getAllDeneChainsForNucleus(pulse, nucleus);
		}else {
			data = aDBManager.getDeneChainNamesForTeleonomeInOrganism(anyTeleonomeName, nucleus);
		}


		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(data.toString());
		out.flush();
		out.close();
	}

}
