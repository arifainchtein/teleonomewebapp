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
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
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
