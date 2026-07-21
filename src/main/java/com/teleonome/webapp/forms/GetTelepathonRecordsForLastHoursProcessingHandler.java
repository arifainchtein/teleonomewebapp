package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * curl "http://chinampamonitor.local/TeleonomeServlet?formName=GetTelepathonRecordsForLastHours&telepathonName=TopTank&hours=8"
 * curl "http://chinampamonitor.local/TeleonomeServlet?formName=GetTelepathonRecordsForLastHours&telepathonName=TopTank&hours=8"
 *
 * Returns every record stored in the last <hours> hours for the given telepathon,
 * across whichever daily telepathon_<date> tables that window spans (e.g. hours=24
 * spans today's and yesterday's tables, hours=40 spans three days' tables). If
 * telepathonName is omitted, returns records for every telepathon that reported data
 * in that window, as a JSON object keyed by telepathon name.
 */
public class GetTelepathonRecordsForLastHoursProcessingHandler extends ProcessingFormHandler {

	public GetTelepathonRecordsForLastHoursProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {

		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String telepathonName = request.getParameter("telepathonName");
		String hoursParam = request.getParameter("hours");

		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();

		double hours;
		try {
			hours = Double.parseDouble(hoursParam);
		} catch (NullPointerException | NumberFormatException e) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			out.print("{\"error\":\"missing or invalid required parameter hours\"}");
			out.flush();
			out.close();
			return;
		}

		long endTimeSeconds = System.currentTimeMillis() / 1000;
		long startTimeSeconds = endTimeSeconds - Math.round(hours * 3600);

		if (telepathonName == null || telepathonName.trim().isEmpty()) {
			JSONObject result = new JSONObject();
			ArrayList<String> allNames = aDBManager.getDistinctTelepathonNames(startTimeSeconds, endTimeSeconds);
			for (String name : allNames) {
				result.put(name, aDBManager.getTelepathonDataStart(name, startTimeSeconds, endTimeSeconds));
			}
			out.print(result.toString());
		} else {
			JSONArray data = aDBManager.getTelepathonDataStart(telepathonName, startTimeSeconds, endTimeSeconds);
			out.print(data.toString());
		}

		out.flush();
		out.close();
	}

}
