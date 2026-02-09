package com.teleonome.webapp.forms;



import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.exception.InvalidDenomeException;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;
import com.teleonome.framework.denome.Identity;
public class GetDeneWordValueByIdentityProcessingHandler extends ProcessingFormHandler {

	public GetDeneWordValueByIdentityProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub

		String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
		
		String identityString = request.getParameter("identity");
		Identity identity = new Identity(identityString);
		
//		String anyTeleonomeName = request.getParameter("TeleonomeName");
//		String nucleus = request.getParameter("Nucleus");
//		String deneChain = request.getParameter("DeneChain");
//		String dene = request.getParameter("Dene");
//		String deneWord = request.getParameter("DeneWord");
		
		logger.debug("GetDeneWordValueByIdentityProcessingHandler, identity=" + identity);//+ " nucleus=" + nucleus + " deneChain=" + deneChain + " dene=" + dene + " deneWord=" + deneWord);

		JSONObject data=new JSONObject();
		if(teleonomeName.equals(identity.getTeleonomeName())) {
			JSONObject pulse = (JSONObject) getServletContext().getAttribute("CurrentPulse");
			try {
				data = (JSONObject) DenomeUtils.getDeneWordByIdentity(pulse, identity, TeleonomeConstants.COMPLETE);
			} catch (InvalidDenomeException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				data.put("Error", "Invalid Identity " + identityString);
			}
		}else {
			data.put("Error", "Invalid Identity " + identityString);
		}

		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(data.toString());
		out.flush();
		out.close();
	}

}
