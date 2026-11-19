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
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * The Organs section of the Diagnostics page (added 2026-11-05): the status files the Cerebellum and the Hippocampus
 * write next to the denome every few seconds (CerebellumStatus.json: timestamp and pid; HippocampusStatus.json: also
 * its memory words). Read-only.
 * -> {"Now": millis, "Cerebellum": {...} or null, "Hippocampus": {...} or null}
 */
public class GetOrganStatusProcessingHandler extends ProcessingFormHandler {

	public GetOrganStatusProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		JSONObject answer = new JSONObject().put("Now", System.currentTimeMillis());
		answer.put("Cerebellum", read("CerebellumStatus.json"));
		answer.put("Hippocampus", read("HippocampusStatus.json"));
		answer.put("Hypothalamus", hypothalamus());
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}

	// The Hypothalamus (2026-11-19): whether its process is alive, when it last wrote the Denome (its pulse), and whether
	// a person stopped it for maintenance (HypothalamusStopped.info, written by the Hypothalamus on Stop with a token)
	private JSONObject hypothalamus() {
		String dir = Utils.getLocalDirectory();
		JSONObject h = new JSONObject();
		boolean running = false;
		try {
			String pid = FileUtils.readFileToString(new File(dir + "PaceMakerProcess.info"), StandardCharsets.UTF_8).split("@")[0].trim();
			running = pid.matches("\\d+") && new File("/proc/" + pid).isDirectory();
			h.put("Pid", pid);
		} catch (IOException e) {
			// no pid file: never started here
		}
		h.put("Running", running);
		File denome = new File(dir + "Teleonome.denome");
		if (denome.isFile()) h.put("Last Pulse Milliseconds", denome.lastModified());
		Object stop = read(com.teleonome.framework.TeleonomeConstants.HYPOTHALAMUS_STOPPED_FILE);
		if (stop instanceof JSONObject && System.currentTimeMillis() < ((JSONObject) stop).optLong("Until", 0)) {
			h.put("Stopped Until", ((JSONObject) stop).getLong("Until"));
		}
		return h;
	}

	private Object read(String name) {
		File f = new File(Utils.getLocalDirectory() + name);
		try {
			return f.isFile() ? new JSONObject(FileUtils.readFileToString(f, StandardCharsets.UTF_8)) : JSONObject.NULL;
		} catch (IOException | JSONException e) {
			// written while we read: the next call gets it
			return JSONObject.NULL;
		}
	}
}
