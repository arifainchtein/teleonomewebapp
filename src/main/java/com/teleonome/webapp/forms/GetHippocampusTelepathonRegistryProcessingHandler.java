package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.webapp.servlet.ProcessingFormHandler;
import com.teleonome.webapp.servlet.TeleonomeDataGateway;

/**
 * curl "http://chinampamonitor.local/TeleonomeServlet?formName=GetHippocampusTelepathonRegistry"
 *
 * Backs the Hippocampus modal's "Telepathons" tab (which replaced the Registry Status
 * popup): every Cerebellum-registry device with its last message and current/stale
 * classification, plus the temporary list - all answered by the hippocampus from
 * memory over MQTT (TeleonomeDataGateway.queryTelepathonRegistry()).
 *
 * No Postgres fallback by design: the old per-device "last record" search over the
 * daily telepathon tables is what made the popup take forever, and a hippocampus that
 * doesn't answer is itself the thing worth showing. On failure the response is
 * HTTP 503 with {"error": "..."}.
 */
public class GetHippocampusTelepathonRegistryProcessingHandler extends ProcessingFormHandler {

	public GetHippocampusTelepathonRegistryProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		TeleonomeDataGateway gateway = (TeleonomeDataGateway) getServletContext().getAttribute("TeleonomeDataGateway");
		try {
			if (gateway == null) throw new IllegalStateException("TeleonomeDataGateway not initialized");
			out.print(gateway.queryTelepathonRegistry().toString());
		} catch (Exception e) {
			logger.warn("Telepathon registry request to hippocampus failed: " + e.getMessage());
			response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
			out.print(new JSONObject().put("error", "Hippocampus not responding: " + e.getMessage()).toString());
		}
		out.flush();
		out.close();
	}
}
