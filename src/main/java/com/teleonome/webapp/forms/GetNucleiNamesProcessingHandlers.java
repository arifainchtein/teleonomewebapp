package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetNucleiNamesProcessingHandlers extends ProcessingFormHandler {

	public GetNucleiNamesProcessingHandlers(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		String anyTeleonomeName = request.getParameter("TeleonomeName");
		JSONArray data = new JSONArray();			
		data.put(TeleonomeConstants.NUCLEI_MNEMOSYNE);
		data.put(TeleonomeConstants.NUCLEI_PURPOSE);

		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(data.toString());
		out.flush();
		out.close();
	}

}
