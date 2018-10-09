package com.teleonome.webapp.forms;

import java.io.IOException;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetLogFileProcessingHandler extends ProcessingFormHandler {

	public GetLogFileProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub

	}

}
