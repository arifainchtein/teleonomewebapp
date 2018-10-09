package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Set;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.network.NetworkUtilities;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetConnectedClientsProcessingHandler extends ProcessingFormHandler {

	public GetConnectedClientsProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		JSONArray clientsJSONArray=new JSONArray();
		LinkedHashMap linkedMap = null;
		try {
			linkedMap = NetworkUtilities.getConnectedClients();
		}catch(Exception e) {
			logger.warn("Exceptin getting the connected clients, e=" + e.getMessage());
			logger.debug("Exceptin getting the connected clients, e=" + e.getMessage());
		}
		if(linkedMap!=null) {
			Set set = linkedMap.keySet();
			Iterator it = set.iterator();
			String name, ipaddress;

			JSONObject client;
			while(it.hasNext()){
				name=(String)it.next();
				ipaddress = (String) linkedMap.get(name);
				//logger.debug("name=" + name + "  ipaddress=" + ipaddress);	
				client = new JSONObject();
				client.put("name", name);
				client.put("ipaddress", ipaddress);

				clientsJSONArray.put(client);
			} 
		}
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(clientsJSONArray);
		out.flush();
		out.close();
	}

}
