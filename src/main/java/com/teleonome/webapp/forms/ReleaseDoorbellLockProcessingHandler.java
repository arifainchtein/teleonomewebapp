package com.teleonome.webapp.forms;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.microcontroller.cleotildemicrocontroller.DoorbellPoller;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * Release button of Cleotilde's Doorbell panel (added 2026-10-20). After 5 wrong doorbell codes in an
 * hour the board refuses every code, so this can't be a CommandRequest with a code like the other
 * commands: it leaves a flag file in the working directory (shared with the Hypothalamus), which
 * DoorbellPoller turns into ResetCodeLockout within 10 s. No code is asked for because only the home
 * network reaches this page; a stranger on the internet can ring Zhinu's doorbell but not press this.
 */
public class ReleaseDoorbellLockProcessingHandler extends ProcessingFormHandler {

	public ReleaseDoorbellLockProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		JSONObject answer = new JSONObject();
		if (!"POST".equals(request.getMethod())) {
			answer.put("error", "Release with POST");
		} else {
			File flag = new File(Utils.getLocalDirectory() + DoorbellPoller.RELEASE_FLAG_FILE);
			if (flag.exists() || flag.createNewFile()) {
				logger.info("Doorbell lock release asked from " + request.getRemoteAddr());
				answer.put("error", "");
			} else {
				answer.put("error", "Could not write " + flag.getAbsolutePath());
			}
		}
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}
}
