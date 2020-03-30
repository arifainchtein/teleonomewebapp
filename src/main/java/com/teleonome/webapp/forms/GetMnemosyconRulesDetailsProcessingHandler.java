package com.teleonome.webapp.forms;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.AbstractMap;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Map;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.denome.Identity;
import com.teleonome.framework.exception.InvalidDenomeException;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class GetMnemosyconRulesDetailsProcessingHandler extends ProcessingFormHandler {

	public GetMnemosyconRulesDetailsProcessingHandler(HttpServletRequest req, HttpServletResponse res,
			ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");

		String requestedMnemosyconName = request.getParameter("MnemosyconName");
		long timemillis = Long.parseLong(request.getParameter("PulseMillis"));
		String telonomeName = (String) servletContext.getAttribute("TeleonomeName");
		JSONObject pulseJSONObject = aDBManager.getPulseByTimestamp(  timemillis);
		logger.debug("requestedMnemosyconName=" + requestedMnemosyconName + " timemillis=" + timemillis + " telonomeName=" + telonomeName);
		Identity identity = new Identity(telonomeName,TeleonomeConstants.NUCLEI_PURPOSE, TeleonomeConstants.DENECHAIN_MNEMOSYCON_PROCESSING);
		JSONObject mnemosyconProcessingDeneChain;
		String deneWordName;
		Object deneWordValue;
		JSONObject toReturn = new JSONObject();
		ArrayList unsortedRules = new ArrayList();
		JSONArray databaseRules = new JSONArray();
		JSONArray filesRules = new JSONArray();
		toReturn.put("DatabaseRules", databaseRules);
		toReturn.put("FilesRules", filesRules);
		
		if(pulseJSONObject!=null) {
			try {
				mnemosyconProcessingDeneChain = DenomeUtils.getDeneChainByIdentity(pulseJSONObject, identity);
				if(mnemosyconProcessingDeneChain!=null) {
					JSONArray allRuleDenes = DenomeUtils.getDenesByDeneType(mnemosyconProcessingDeneChain, TeleonomeConstants.DENE_TYPE_MNEMOSYCON_RULE_PROCESSING);
					//
					// only get the denes that have a codon with the same value as requestedMnemosyconName
					JSONObject ruleProcessingJSONObject, ruleProcessingDeneWordJSONObject;
					JSONArray ruleProcessingDeneWordsJSONArray;
					logger.debug("allRuleDenes=" + allRuleDenes.length());

					for(int i=0;i<allRuleDenes.length();i++) {
						ruleProcessingJSONObject = allRuleDenes.getJSONObject(i);
						ruleProcessingDeneWordsJSONArray = ruleProcessingJSONObject.getJSONArray("DeneWords");
						found:
						for(int j=0;j<ruleProcessingDeneWordsJSONArray.length();j++) {
							ruleProcessingDeneWordJSONObject = ruleProcessingDeneWordsJSONArray.getJSONObject(j);
							
							logger.debug(ruleProcessingDeneWordJSONObject.toString(4));
							deneWordName = ruleProcessingDeneWordJSONObject.getString(TeleonomeConstants.DENEWORD_NAME_ATTRIBUTE);
							if(ruleProcessingDeneWordJSONObject.has(TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE)) {
								deneWordValue = ruleProcessingDeneWordJSONObject.get(TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE);

								logger.debug("deneWordName=" + deneWordName + " deneWordValue=" + deneWordValue);
								if(deneWordValue!=null && deneWordName.equals(TeleonomeConstants.CODON) &&
										deneWordValue.equals(requestedMnemosyconName)
										) {
											//
											// this rule processing belongs to the same 
									unsortedRules.add(ruleProcessingJSONObject);
									break found;
								}
							}else {
								logger.debug("deneWordName=" + deneWordName + " has no deneWordValue=" );
								
							}
							
						}
					}
					//
					// now separate them into database ad file
					//
					String mnemosyconRuleSource="";
					
					for(int i=0;i<unsortedRules.size();i++) {
						ruleProcessingJSONObject = (JSONObject) unsortedRules.get(i);
						mnemosyconRuleSource = (String) DenomeUtils.getDeneWordAttributeByDeneWordNameFromDene(ruleProcessingJSONObject, TeleonomeConstants.MNEMOSYCON_RULE_SOURCE, TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE);
						if(mnemosyconRuleSource.equals(TeleonomeConstants.MNEMOSYCON_DATA_SOURCE_DATABASE)) {
							
							databaseRules.put(ruleProcessingJSONObject);
							
						}else if(mnemosyconRuleSource.equals(TeleonomeConstants.MNEMOSYCON_DATA_SOURCE_FILE_SYSTEM)) {
							filesRules.put(ruleProcessingJSONObject);
							
						}
					}
					
				}
				
			} catch (InvalidDenomeException e) {
				// TODO Auto-generated catch block
				logger.warn(Utils.getStringException(e));
			}
		}
		
		
		
		response.setContentType("application/json;charset=UTF-8");
		PrintWriter out = response.getWriter();
		out.print(toReturn.toString());
		out.flush();
		out.close(); 
	}

}
