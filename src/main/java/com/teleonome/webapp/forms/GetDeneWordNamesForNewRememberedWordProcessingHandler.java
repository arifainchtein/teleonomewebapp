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

public class GetDeneWordNamesForNewRememberedWordProcessingHandler extends ProcessingFormHandler {

	public GetDeneWordNamesForNewRememberedWordProcessingHandler(HttpServletRequest req, HttpServletResponse res,
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
		String deneChain = request.getParameter("DeneChain");
		String dene = request.getParameter("Dene");
		logger.debug("GetDeneWordNames, anyTeleonomeName=" + anyTeleonomeName + " nucleus=" + nucleus + " deneChain=" + deneChain + " dene=" + dene);

		JSONArray data=null;
		if(teleonomeName.equals(anyTeleonomeName)) {
			JSONObject pulse = (JSONObject) getServletContext().getAttribute("CurrentPulse");
			data = DenomeUtils.getAllDeneWordNamesForDene(pulse, nucleus, deneChain, dene);
		}else {
			data = aDBManager.getDeneWordNamesForTeleonomeInOrganism(anyTeleonomeName, nucleus, deneChain, dene);
		}
		//
		// now check to see if any of these denewords is already part of the remembered denewords, if so dont include it
		//
		
		JSONObject deneWordsToRemember = (JSONObject) servletContext.getAttribute("DeneWordsToRemember");
		String deneWordName;
		String identityPointer;
		JSONArray fixedData = new JSONArray();
		for(int i=0;i<data.length();i++) {
			deneWordName = data.getString(i);
			identityPointer = "@"+anyTeleonomeName + ":" + nucleus + ":" + deneChain + ":" + dene+ ":" + deneWordName;
			System.out.println("identityPointer=" + identityPointer + " " + !deneWordsToRemember.has(identityPointer));
			if(!deneWordsToRemember.has(identityPointer)) {
				fixedData.put(deneWordName);
			}
			
		}
		
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(fixedData.toString());
		out.flush();
		out.close();
	}

}
