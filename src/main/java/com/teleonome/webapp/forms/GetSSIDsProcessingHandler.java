package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.network.NetworkUtilities;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetSSIDsProcessingHandler extends ProcessingFormHandler {

	public GetSSIDsProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		JSONArray ssidJSONArray = NetworkUtilities.getSSID(true);
		logger.debug("GetSSIDs=" +ssidJSONArray.toString(4));
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(ssidJSONArray);
		out.flush();
		out.close();
	}

}
