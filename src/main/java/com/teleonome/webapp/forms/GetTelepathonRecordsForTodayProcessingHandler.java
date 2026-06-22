package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * curl "http://HOST:PORT/TeleonomeServlet?formName=GetTelepathonRecordsForToday&telepathonName=Chinampa"
 *
 * Returns every record stored today (Australia/Melbourne) for the given telepathon,
 * across whichever daily telepathon_<date> tables the day spans.
 */
public class GetTelepathonRecordsForTodayProcessingHandler extends ProcessingFormHandler {

	public GetTelepathonRecordsForTodayProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {

		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String telepathonName = request.getParameter("telepathonName");

		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();

		if (telepathonName == null || telepathonName.trim().isEmpty()) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			out.print("{\"error\":\"missing required parameter telepathonName\"}");
			out.flush();
			out.close();
			return;
		}

		ZoneId zone = ZoneId.of("Australia/Melbourne");
		LocalDate today = LocalDate.now(zone);
		LocalDateTime startOfDay = today.atStartOfDay();
		LocalDateTime endOfDay = today.atTime(23, 59, 59);

		long startTimeSeconds = startOfDay.atZone(zone).toEpochSecond();
		long endTimeSeconds = endOfDay.atZone(zone).toEpochSecond();

		JSONArray data = aDBManager.getTelepathonDataStart(telepathonName, startTimeSeconds, endTimeSeconds);

		out.print(data.toString());
		out.flush();
		out.close();
	}

}
