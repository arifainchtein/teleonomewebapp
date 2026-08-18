package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * curl "http://chinampamonitor.local/TeleonomeServlet?formName=GetLastTelepathonRecords&telepathonNames=FISH,TopTank"
 *
 * Returns each requested telepathon's single most recent stored reading -
 * {timeSeconds, data} where data is the full DeneChain JSON, same shape
 * getTelepathonDataStart's rows use - as a JSON object keyed by name. A name
 * with no stored data at all (never seen, or outside the lookback window) maps
 * to null rather than being omitted, so the caller can tell "no data" apart
 * from "didn't ask".
 *
 * Backs the Telepathon Registry popup, which needs to show a device's last
 * known reading even after it has aged out of the live (self-pruning) denome -
 * unlike GetTelepathonRecordsForLastHours/ForToday, this isn't a bounded-window
 * query, it always finds the single latest row regardless of how long ago it was.
 */
public class GetLastTelepathonRecordsProcessingHandler extends ProcessingFormHandler {

	public GetLastTelepathonRecordsProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {

		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String telepathonNamesParam = request.getParameter("telepathonNames");

		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();

		if (telepathonNamesParam == null || telepathonNamesParam.trim().isEmpty()) {
			response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
			out.print("{\"error\":\"missing required parameter telepathonNames\"}");
			out.flush();
			out.close();
			return;
		}

		JSONObject result = new JSONObject();
		for (String name : telepathonNamesParam.split(",")) {
			name = name.trim();
			if (name.isEmpty()) continue;
			JSONObject lastRecord = aDBManager.getLastTelepathonData(name);
			result.put(name, lastRecord == null ? JSONObject.NULL : lastRecord);
		}

		out.print(result.toString());
		out.flush();
		out.close();
	}

}
