package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.exception.MissingDenomeException;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.exception.TeleonomeValidationException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;


public class GetTelepathonDataValueByPeriodProcessingHandler extends ProcessingFormHandler {

	public GetTelepathonDataValueByPeriodProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub

		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		String telepathonName = request.getParameter("telepathonName");
		String deneName = request.getParameter("deneName");
		String deneWordName = request.getParameter("deneWordName");
		
		long startTimeSeconds;
		long  endTimeSeconds;
		ZoneId zone = ZoneId.of("Australia/Melbourne");
		LocalDate today = LocalDate.now(zone);

		LocalDateTime startOfDay = today.atStartOfDay();
		LocalDateTime endOfDay = today.atTime(23, 59, 59);

		startTimeSeconds = startOfDay.atZone(zone).toEpochSecond()*1000;
		endTimeSeconds = endOfDay.atZone(zone).toEpochSecond()*1000;
		System.out.print("line 56, telepathonName=" + telepathonName + " deneName=" + deneName + " deneWordName=" + deneWordName + " startTimeSeconds=" + startTimeSeconds + " endTimeSeconds=" + endTimeSeconds);
		JSONArray data= aDBManager.getTelepathonDeneWordStart(  telepathonName,  deneName,  deneWordName,   startTimeSeconds,   endTimeSeconds);
		
		PrintWriter out = response.getWriter();
		out.print(data.toString());

		//		logger.debug("AddToWhiteList deviceName=" + deviceName + " " + deviceMacAddress);
		//		boolean b = aDBManager.addDeviceToWhiteList(deviceName, deviceMacAddress);
		//		logger.debug("AddToWhiteList deviceName=" + deviceName + " " + deviceMacAddress + " " + b);

		//		response.setContentType("text/html;charset=UTF-8");
		//		PrintWriter out = response.getWriter();
		//		out.print("Ok");
		out.flush();
		out.close();
	}

}
