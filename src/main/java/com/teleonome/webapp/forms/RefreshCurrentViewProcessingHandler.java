package com.teleonome.webapp.forms;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.TimeZone;

import javax.servlet.ServletContext;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONObject;
import org.postgresql.util.PGobject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.denome.Identity;
import com.teleonome.framework.exception.InvalidDenomeException;
import com.teleonome.framework.exception.ServletProcessingException;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.webapp.servlet.ProcessingFormHandler;

public class RefreshCurrentViewProcessingHandler extends ProcessingFormHandler {

	public RefreshCurrentViewProcessingHandler(HttpServletRequest req, HttpServletResponse res, ServletContext servletContext) {
		super(req, res, servletContext);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void process() throws ServletProcessingException, IOException {
		// TODO Auto-generated method stub
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");
		

		JSONArray toReturn = new JSONArray();
		String rawData = request.getParameter("data");
		logger.debug("Refreshcurrent virew, received:" + rawData);
		JSONArray data = new JSONArray(rawData);
		for(int i =0;i<data.length();i++) {
			JSONObject dataElement = data.getJSONObject(i);
			logger.debug("Refreshcurrent virew, processing:" + dataElement.toString(4));
			String formName2 = dataElement.getString("formName");
			String chartTitle = dataElement.getString("chartTitle");
			String chartDivId = dataElement.getString("chartDivId");
			boolean showMax = false;
			if(dataElement.has("showMax")) {
				showMax = dataElement.getBoolean("showMax");
			}
			boolean showMin = false;
			if(dataElement.has("showMin")) {
				showMin = dataElement.getBoolean("showMin");
			}
			boolean showAvg = false;
			if(dataElement.has("showAvg")) {
				showAvg = dataElement.getBoolean("showAvg");
			}
			logger.debug("showMax="  + showMax + " showMin=" + showMin + " showAvg=" + showAvg);
			String localStoreageKey = dataElement.getString("localStoreageKey");
			String visualizationStyle = dataElement.getString("visualizationStyle");
			long fromMillis = dataElement.getLong("fromMillis");
			long untilMillis = dataElement.getLong("untilMillis");

			boolean liveUpdate = dataElement.getBoolean("liveUpdate");
			int liveUpdateMinutes = dataElement.getInt("liveUpdateMinutes");
			

			String identityPointer =  dataElement.getString("identity");
			Identity identity = new Identity(identityPointer);

			TimeZone timeZone = (TimeZone) getServletContext().getAttribute("TimeZone");


			if(formName2.equals("RememberDeneWord")) {


				logger.debug("identityPointer=" + identityPointer + " fromMillis=" + fromMillis+ " untilMillis=" + untilMillis  );
				JSONObject currentPulse = (JSONObject)servletContext.getAttribute("CurrentPulse");
				//
				// the wordToRememberSourceJSONObject is only going to be non null if the remembered deneword comes from 
				// the same teleonome
				//
				JSONObject wordToRememberSourceJSONObject=null;
				try {
					wordToRememberSourceJSONObject = (JSONObject) DenomeUtils.getDeneWordByIdentity(currentPulse, new Identity(identityPointer), TeleonomeConstants.COMPLETE);
				} catch (InvalidDenomeException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				
				JSONArray values = aDBManager.getRemeberedDeneWord(timeZone, identityPointer, fromMillis, untilMillis);

				JSONObject toReturnElement = new JSONObject();
				toReturnElement.put("Value", values);
				
				
				toReturnElement.put("showMax", showMax);
				toReturnElement.put("showMin", showMin);
				toReturnElement.put("showAvg", showAvg);
				
				if(showMax) {
					JSONObject maxDataInfo = aDBManager.getStatsInfoForRemeberedDeneWord(timeZone, identityPointer, fromMillis, untilMillis, TeleonomeConstants.DENEWORD_MAXIMUM_ATTRIBUTE);
					toReturnElement.put("maxDataInfo", maxDataInfo);
				}
				if(showMin) {
					JSONObject minDataInfo = aDBManager.getStatsInfoForRemeberedDeneWord(timeZone, identityPointer, fromMillis, untilMillis, TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE);
					toReturnElement.put("minDataInfo", minDataInfo);
				}
				
				if(showAvg) {
					JSONObject avgDataInfo = aDBManager.getStatsInfoForRemeberedDeneWord(timeZone, identityPointer, fromMillis, untilMillis, TeleonomeConstants.DENEWORD_AVERAGE_ATTRIBUTE);
					toReturnElement.put("avgDataInfo", avgDataInfo);
				}
				toReturnElement.put("liveUpdate", liveUpdate);
				toReturnElement.put("liveUpdateMinutes", liveUpdateMinutes);
				JSONObject deneWordsToRemember = (JSONObject) getServletContext().getAttribute("DeneWordsToRemember");
				JSONObject deneWordToRemember = null;
				if(deneWordsToRemember.has(identityPointer)) {
					deneWordToRemember= deneWordsToRemember.getJSONObject(identityPointer);
				}else {
					logger.warn("line 117,not found deneword using identity pointer=" + identityPointer);
				}
				String units="N.A.";
				logger.warn("before units,wordToRememberSourceJSONObject=" + wordToRememberSourceJSONObject);
				if(wordToRememberSourceJSONObject!=null) {
					if( wordToRememberSourceJSONObject.has(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE)) {
						units = wordToRememberSourceJSONObject.getString(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
					}
				}else if(values.length()>0) {
					JSONObject j = values.getJSONObject(0);
					if(j.has("Units"))units=j.getString("Units");
				}
				double minimum=-9999;
				if(wordToRememberSourceJSONObject!=null && wordToRememberSourceJSONObject.has(TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE)) {
					minimum = wordToRememberSourceJSONObject.getDouble(TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE);
				}
				
				double maximum=-9999;
				if(wordToRememberSourceJSONObject!=null && wordToRememberSourceJSONObject.has(TeleonomeConstants.DENEWORD_MAXIMUM_ATTRIBUTE)) {
					maximum = wordToRememberSourceJSONObject.getDouble(TeleonomeConstants.DENEWORD_MAXIMUM_ATTRIBUTE);
				}
				toReturnElement.put("TeleonomeName", identity.getTeleonomeName());
				toReturnElement.put("chartTitle", chartTitle);
				toReturnElement.put("Units", units);
				toReturnElement.put("chartDivId"	,chartDivId);
				if(minimum>-9999)toReturnElement.put("Minimum", minimum);
				if(maximum>-9999)toReturnElement.put("Maximum", maximum);
				toReturnElement.put("localStoreageKey", localStoreageKey);
				toReturnElement.put("fromMillis", fromMillis);
				toReturnElement.put("untilMillis", untilMillis);

				toReturnElement.put("VisualizationStyle", visualizationStyle);
				toReturn.put(toReturnElement);

			}else if(formName2.equals("LookUpDeneWord")){


				String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
				logger.debug("for search teleonomeName :" + teleonomeName + " identity.getTeleonomeName()=" + identity.getTeleonomeName());

				JSONArray values = null;
				if(identity.getTeleonomeName().equals(teleonomeName)) {
					values = aDBManager.getDeneWordTimeSeriesByIdentity( identity,  fromMillis,  untilMillis);
				}else {
					values = aDBManager.getOrganismDeneWordTimeSeriesByIdentity( identity,  fromMillis,  untilMillis);
				}

				logger.debug("After search for :" + identity + " values length=" + values.length());

				JSONObject toReturnElement = new JSONObject();
				toReturnElement.put("Value", values);
				//
				// to get the units and the minimum, get the last pulse
				org.postgresql.util.PGobject pg = (PGobject) aDBManager.getOrganismDeneWordAttributeLastValueByIdentity( identity, TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
				String units = "";
				if(pg!=null) {
					units = pg.toString();
				}
				//String units = (String) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
				//double minimum = (double) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE);
				pg = (PGobject) aDBManager.getOrganismDeneWordAttributeLastValueByIdentity( identity, TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE);
				double minimum = 0.0;
				if(pg!=null && pg.getValue()!=null) {
					minimum = Double.parseDouble(pg.getValue());
				}

				logger.debug("After search otherTelenomeLastPulse :" + units + " minimum=" + minimum);


				toReturnElement.put("TeleonomeName", identity.getTeleonomeName());
				toReturnElement.put("chartTitle", chartTitle);
				toReturnElement.put("Units", units);
				toReturnElement.put("Minimum", minimum);
				toReturn.put(toReturnElement);

			}
		}


		PrintWriter out = response.getWriter();
		out.print(toReturn.toString());
		out.flush();
		out.close();
	}
}
