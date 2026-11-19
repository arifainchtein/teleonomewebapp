package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

/**
 * Structural mutations from the web page (2026-11-19): the Home Page Pills' tabs (Create / Update / Delete Human
 * Interface Page) and the water networks (Create / Update / Delete Water Network). The page builds the payload (the
 * Denes and DeneChains, HomePagePillsTeleonomeHost.js); this only queues it as a command, with the 6-digit code,
 * like DeleteTelepathon does.
 *
 * It takes only a mutation of this Denome whose Mutation Configuration names an "Allowed Payload Nucleus" (the
 * mutations made for this by the HumanInterfacePages and WaterNetworks sperms): any other command name is refused
 * here. What the payload may do is checked again by the framework (StructuralPayload) before anything changes; a
 * refusal comes back on the command ("Refused: ..."), through the Heart's UpdateFormResponse.
 *
 * Answers {"id": the command's id} or {"error": why}.
 */
public class RequestStructuralMutationProcessingHandler extends ProcessingFormHandler {

	private static final int MAX_PAYLOAD = 200000;

	public RequestStructuralMutationProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		JSONObject answer = new JSONObject();
		String mutation = request.getParameter("mutation");
		String payload = request.getParameter("payload");
		String commandCode = request.getParameter(TeleonomeConstants.COMMAND_CODE);
		try {
			if (mutation == null || payload == null || commandCode == null || commandCode.trim().isEmpty()) {
				answer.put("error", "Missing mutation, payload or code.");
			} else if (payload.length() > MAX_PAYLOAD) {
				answer.put("error", "The change is too big.");
			} else if (!takesStructuralPayload(mutation)) {
				answer.put("error", "This Teleonome has no mutation " + mutation + " that takes Denes and DeneChains.");
			} else {
				JSONObject parsed = new JSONObject(payload);
				if (!mutation.equals(parsed.optString("Mutation Name")) || parsed.optJSONObject("Payload") == null) {
					answer.put("error", "The payload is not for " + mutation + ".");
				} else {
					PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
					command = mutation;
					JSONObject queued = aDBManager.requestCommandToExecute(mutation, commandCode.trim(), TeleonomeConstants.TELEONOME_SECURITY_CODE,
							parsed.toString(), request.getRemoteAddr(), false);
					answer.put("id", queued.getInt("id"));
				}
			}
		} catch (JSONException e) {
			answer = new JSONObject().put("error", "The payload is not well formed: " + e.getMessage());
		}
		response.setContentType("application/json");
		PrintWriter out = response.getWriter();
		out.print(answer.toString());
		out.flush();
		out.close();
	}

	// Whether this Denome (the current pulse) has the mutation, with an "Allowed Payload Nucleus" in its Mutation Configuration.
	private boolean takesStructuralPayload(String mutationName) {
		Object pulse = getServletContext().getAttribute("CurrentPulse");
		if (!(pulse instanceof JSONObject)) return false;
		JSONObject denome = ((JSONObject) pulse).optJSONObject("Denome");
		JSONArray mutations = denome == null ? null : denome.optJSONArray("Mutations");
		if (mutations == null) return false;
		for (int i = 0; i < mutations.length(); i++) {
			JSONObject m = mutations.optJSONObject(i);
			if (m == null || !mutationName.equals(m.optString("Name"))) continue;
			JSONArray chains = m.optJSONArray("DeneChains");
			for (int j = 0; chains != null && j < chains.length(); j++) {
				JSONObject chain = chains.optJSONObject(j);
				if (chain == null || !TeleonomeConstants.DENECHAIN_MUTATION_CONFIGURATION.equals(chain.optString("Name"))) continue;
				JSONArray denes = chain.optJSONArray("Denes");
				for (int k = 0; denes != null && k < denes.length(); k++) {
					JSONArray words = denes.getJSONObject(k).optJSONArray("DeneWords");
					for (int w = 0; words != null && w < words.length(); w++) {
						JSONObject word = words.getJSONObject(w);
						if (TeleonomeConstants.DENEWORD_ALLOWED_PAYLOAD_NUCLEUS.equals(word.optString("Name")) && word.optString("Value").length() > 0) return true;
					}
				}
			}
		}
		return false;
	}
}
