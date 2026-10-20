package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.FileUtils;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.microcontroller.cleotildemicrocontroller.DoorbellPoller;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * Cleotilde's Doorbell panel: the recent rings and the board's lock, as DoorbellPoller keeps them in
 * DoorbellRings.json ({"Messages": [...], "Status": {"Locked", "WrongCodesLastHour", "LastRelease",
 * "LastReleaseResult"}}), plus whether a release is waiting for the poller.
 */
public class GetDoorbellStatusProcessingHandler extends ProcessingFormHandler {

	public GetDoorbellStatusProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		JSONObject answer = new JSONObject();
		File file = new File(Utils.getLocalDirectory() + DoorbellPoller.LOCAL_FILE);
		try {
			if (file.isFile()) answer = new JSONObject(FileUtils.readFileToString(file, StandardCharsets.UTF_8));
		} catch (JSONException e) {
			logger.warn("Could not read " + file.getAbsolutePath() + ": " + e.getMessage());
		}
		answer.put("ReleasePending", new File(Utils.getLocalDirectory() + DoorbellPoller.RELEASE_FLAG_FILE).exists());
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}
}
