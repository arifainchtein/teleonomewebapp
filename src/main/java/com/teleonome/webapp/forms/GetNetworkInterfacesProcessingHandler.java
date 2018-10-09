package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.network.NetworkUtilities;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetNetworkInterfacesProcessingHandler extends ProcessingFormHandler {

	public GetNetworkInterfacesProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		JSONObject interfacesJSONObject = NetworkUtilities.getNetworkInterfaces();
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(interfacesJSONObject.toString());
		out.flush();
		out.close(); 

	}

}
