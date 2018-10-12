package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetRememberedDeneWordListProcessingHandler extends ProcessingFormHandler {

	public GetRememberedDeneWordListProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		// 
		// to repaint the table, get all the commandrequests
		//
		JSONObject deneWordsToRemember = (JSONObject) servletContext.getAttribute("DeneWordsToRemember");
		
		
		logger.debug("GetRememberedDeneWordListProcessingHandler=" + deneWordsToRemember.toString(4));
		
		response.setContentType("text/html;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(deneWordsToRemember.toString());
		out.flush();
		out.close();
	}

}
