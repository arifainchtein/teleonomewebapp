package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONObject;

import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.exception.MissingDenomeException;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.exception.TeleonomeValidationException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GenerateDenomeAnalysisProcessingHandler extends ProcessingFormHandler {

	public GenerateDenomeAnalysisProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		
		JSONObject denomeJSONObject = (JSONObject) servletContext.getAttribute("CurrentPulse");
		String result="Failure";
		try {
			ArrayList<String> lines = DenomeUtils.generateDenomePhysiologyReportHTMLTable(denomeJSONObject);
			String listString = String.join(", ", lines);
			FileUtils.writeLines(new File("/home/pi/Teleonome/tomcat/webapps/ROOT/TeleonomeAnalysis.html"), lines);
			result="Ok";
		} catch (MissingDenomeException | TeleonomeValidationException e) {
			// TODO Auto-generated catch block
			logger.warn(Utils.getStringException(e));
		}
		
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(result);
		out.flush();
		out.close();
	}

}
