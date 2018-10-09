package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.List;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONObject;

import com.teleonome.framework.denome.Identity;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetRememberDeneWordListProcessingHandler  extends ProcessingFormHandler {

	
	
	public GetRememberDeneWordListProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}
	
	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		//
		// is expeting of the form
		// items={option1:{value:1,text:1},option2:{value:2,text:2}}
		//
		JSONObject deneWordsToRemember = (JSONObject) getServletContext().getAttribute("DeneWordsToRemember");
		Iterator it = deneWordsToRemember.keys();
		int counter=1;
		JSONObject toReturn = new JSONObject();
		JSONObject jo;
		//
		// sort them by teleonome name first and then by deneword name
		//
		List list = new ArrayList();
		Hashtable h = new Hashtable();
		logger.debug("before sorting");
		while(it.hasNext()) {
			String identityPointer = (String) it.next();
			Identity identity = new Identity(identityPointer);
			String deneWordName = identity.getDeneWordName();
			String teleonomeName = identity.getTeleonomeName();
			list.add(teleonomeName + "-" + deneWordName);
			h.put(teleonomeName + "-" + deneWordName, identityPointer);
			logger.debug("before sorting, storing " + identityPointer);
		}
		Collections.sort(list);

		it = list.iterator();
		while(it.hasNext()) {
			String text=(String) it.next();
			String identityPointer = (String) h.get(text); ;
			logger.debug("after sorting, storing " + identityPointer);
			//Identity identity = new Identity(identityPointer);
			//String deneWordName = identity.getDeneWordName();
			//String teleonomeName = identity.getTeleonomeName();
			jo = new JSONObject();
			jo.put("text", text);
			jo.put("value", identityPointer);

			toReturn.put("option"+counter, jo);
			counter++;
		}

		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(toReturn.toString());
		out.flush();
		out.close();
	}

}
