package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetTeleonomeDateAvailableProcessingHandler extends ProcessingFormHandler {

	public GetTeleonomeDateAvailableProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		
		JSONArray data = aDBManager.getTeleonomeDataAvailableInOrganism();
		String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
		JSONObject j2 = aDBManager.getTeleonomeDataAvailableRanges();
		JSONObject j = new JSONObject();
		j.put("Name", teleonomeName);
		if(j2.has("TimeMin")){
			j.put("TimeMin", j2.get("TimeMin"));
		}
		if(j2.has("TimeMax")){
			j.put("TimeMax", j2.get("TimeMax"));
		}

		data.put(j);

		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(data.toString());
		out.flush();
		out.close();
	}

}
