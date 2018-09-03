package com.teleonome.webapp.servlet;

import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Hashtable;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.TimeZone;

import javax.servlet.ServletException;

import javax.servlet.http.HttpSession;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.log4j.Logger;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.postgresql.util.PGobject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.denome.Identity;
import com.teleonome.framework.exception.InvalidDenomeException;
import com.teleonome.framework.network.NetworkUtilities;
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;

import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpServletRequest;

public class TeleonomeServlet extends HttpServlet {


	Logger logger;


	public void init() {
		logger = Logger.getLogger(getClass());

	}

	public void  doPost(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException{
		process(req, res);
	}
	public void  doGet(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException{
		process(req, res);
	}

	public void  process(HttpServletRequest req, HttpServletResponse res) throws ServletException, IOException{		
		String errorMessage="";
		HttpSession session = req.getSession(true);
		String formName = req.getParameter("formName");
		String action = req.getParameter("action");
		String commandCode = req.getParameter(TeleonomeConstants.COMMAND_CODE);
		String command=null;
		String payLoad="";
		boolean waitForResponse=true;
		logger.debug("Do Get formaName=" + formName + " action=" + action);
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager" );
		if(formName.equals("ReSignal")){

			String currentIdentityMode = (String) getServletContext().getAttribute("CurrentIdentityMode");

			String enableNetworkMode = req.getParameter("EnableNetworkMode");
			logger.debug("enableNetworkMode=" + enableNetworkMode);
			if(enableNetworkMode!=null && enableNetworkMode.equals("Yes")){
				command = TeleonomeConstants.COMMAND_REBOOT_ENABLE_NETWORK;

				String ssid = req.getParameter("AvailableNetworks");
				String password = req.getParameter("password");

				JSONObject payLoadParentJSONObject = new JSONObject();

				JSONObject payLoadJSONObject = new JSONObject();
				try {
					payLoadParentJSONObject.put("Mutation Name","SetNetworkMode");

					payLoadParentJSONObject.put("Payload", payLoadJSONObject);
					JSONArray updatesArray = new JSONArray();
					payLoadJSONObject.put("Updates"	, updatesArray);

					JSONObject updateJSONObject =  new JSONObject();
					updateJSONObject.put("Target","@On Load:Update SSID:Update SSID");
					updateJSONObject.put("Value",ssid);
					updatesArray.put(updateJSONObject);

					JSONObject updateJSONObject2 =  new JSONObject();
					updateJSONObject2.put("Target","@On Load:Update PSK:Update PSK");
					updateJSONObject2.put("Value", password );
					updatesArray.put(updateJSONObject2);

					logger.debug("Setting newtork info, ssid=" + ssid + " ps=" + password);

					updatesArray.put(updateJSONObject);
					payLoad=payLoadParentJSONObject.toString();
				} catch (JSONException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}


			}



			logger.debug("the action is " + action);
			if(action.equals(TeleonomeConstants.COMMAND_REBOOT) || action.equals(TeleonomeConstants.COMMAND_REBOOT_TEXT)){
				if(currentIdentityMode.equals(TeleonomeConstants.TELEONOME_IDENTITY_SELF)){
					if(enableNetworkMode!=null && enableNetworkMode.equals("Yes")){
						command = TeleonomeConstants.COMMAND_REBOOT_ENABLE_NETWORK;
					}else{
						command = action;
					}

				}else{
					String enableHostMode = req.getParameter("EnableHostMode");
					logger.debug("the enableHostMode is " + enableHostMode);
					if(enableHostMode!=null && enableHostMode.equals("Yes")){
						command = TeleonomeConstants.COMMAND_REBOOT_ENABLE_HOST;
					}else{
						command = action;
					}
				}
			}else if(action.equals(TeleonomeConstants.COMMAND_SHUTDOWN)  || action.equals(TeleonomeConstants.COMMAND_SHUTDOWN_TEXT)){
				if(currentIdentityMode.equals(TeleonomeConstants.TELEONOME_IDENTITY_SELF)){
					logger.debug("the enableNetworkMode is " + enableNetworkMode);

					if(enableNetworkMode!=null && enableNetworkMode.equals("Yes")){
						command = TeleonomeConstants.COMMAND_SHUTDOWN_ENABLE_NETWORK;
					}else{
						command = action;
					}

				}else{
					String enableHostMode = req.getParameter("EnableHostMode");
					logger.debug("the enableHostMode is " + enableHostMode);
					if(enableHostMode!=null && enableHostMode.equals("Yes")){
						command = TeleonomeConstants.COMMAND_SHUTDOWN_ENABLE_HOST;
					}else{
						command = action;
					}
				}
			}else{
			}

			sendCommand(command, commandCode,payLoad);

		}else if(formName.equals(TeleonomeConstants.HEART_TOPIC_UPDATE_FORM_REQUEST)) {

			String identityPointer = req.getParameter(TeleonomeConstants.TELEONOME_IDENTITY_LABEL);
			Object value = req.getParameter(TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE);
			

			logger.warn("about to apply mutation identityPointer=" + identityPointer + " value=" + value);

			JSONObject payLoadParentJSONObject = new JSONObject();
			JSONObject payLoadJSONObject = new JSONObject();
			payLoadParentJSONObject.put("Mutation Name","UpdateControlParameters");
			payLoadParentJSONObject.put("Payload", payLoadJSONObject);
			JSONArray updatesArray = new JSONArray();
			payLoadJSONObject.put("Updates"	, updatesArray);

			JSONObject updateJSONObject =  new JSONObject();
			updateJSONObject.put("Target","@On Load:Update DeneWord:Update DeneWord");
			updateJSONObject.put("MutationTargetNewValue",identityPointer);
			updateJSONObject.put("Value",value);
			updatesArray.put(updateJSONObject);




			command="SetParameters";
			payLoad=payLoadParentJSONObject.toString();

			int commandId = aDBManager.requestCommandToExecute(command, commandCode,payLoad);
			logger.debug("sent command=" + command  + " commandId=" + commandId);	
			res.setContentType("text/html;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(commandId);
			out.flush();
			out.close();

		}else if(formName.equals("GetConnectedClients")) {
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
			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(clientsJSONArray);
			out.flush();
			out.close();

		}else if(formName.equals("GetSSIDs")){
			JSONArray ssidJSONArray = NetworkUtilities.getSSID(true);
			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(ssidJSONArray);
			out.flush();
			out.close();
		}else if(formName.equals("GetDenome")) {
			String fileInString = FileUtils.readFileToString(new File("Teleonome.denome"));
			res.setContentType("text/html;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(fileInString);
			out.flush();
			out.close();

		}else if(formName.equals("GetLogFile")) {
			String logFileName = req.getParameter("logFileName");
			File logFile = new File(Utils.getLocalDirectory() + "tomcat/webapps/ROOT/" + logFileName);
			List<String> logLines = FileUtils.readLines(logFile);
			StringBuffer toReturn = new StringBuffer();
			Iterator<String> it = logLines.iterator();
			while(it.hasNext()) {
				toReturn.append(it.next() + "<br>");
			}

			res.setContentType("text/html;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(toReturn.toString());
			out.flush();
			out.close();
		}else if(formName.equals("GetLogFileNames")) {
			String dirName = req.getParameter("dirName");
			StringBuffer toReturn = new StringBuffer();
			File logDir = new File(Utils.getLocalDirectory() + "tomcat/webapps/ROOT/logs/" + dirName);
			File[] files = logDir.listFiles();
			for(int i=0;i<files.length;i++) {
				if(i>0)toReturn.append(",");
				toReturn.append(FilenameUtils.getBaseName(files[i].getAbsolutePath()));
			}

			res.setContentType("text/html;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(toReturn.toString());
			out.flush();
			out.close();
		}else if(formName.equals("GetRememberDeneWordList")) {
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

			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(toReturn.toString());
			out.flush();
			out.close();

		}else if(formName.equals("getOrganismPulseByTeleonomeNameAndTimestamp")) {

			String teleonomeName = req.getParameter("TeleonomeName");
			long timemillis = Long.parseLong(req.getParameter("PulseMillis"));
			JSONObject pulseJSONObject = aDBManager.getOrganismPulseByTeleonomeNameAndTimestamp( teleonomeName,  timemillis);
			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(pulseJSONObject.toString(4));
			out.flush();
			out.close(); 
		}else if(formName.equals("GetTeleonomeDateAvailable")) {
			JSONArray data = aDBManager.getTeleonomeDataAvailableInOrganism();
			String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
			JSONArray minMaxArray = aDBManager.getTeleonomeDataAvailableRanges();
			JSONObject j2 = minMaxArray.getJSONObject(0);
			JSONObject j = new JSONObject();
			j.put("Name", teleonomeName);
			if(j2.has("TimeMin")){
				j.put("TimeMin", j2.get("TimeMin"));
			}
			if(j2.has("TimeMax")){
				j.put("TimeMax", j2.get("TimeMax"));
			}

			data.put(j);

			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(data.toString());
			out.flush();
			out.close();

		}else if(formName.equals("GetTeleonomeNames")) {

			JSONArray data = aDBManager.getTeleonomeNamesInOrganism();

			String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
			data.put(teleonomeName);

			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(data.toString());
			out.flush();
			out.close();

		}else if(formName.equals("GetNucleiNames")) {
			String anyTeleonomeName = req.getParameter("TeleonomeName");
			JSONArray data = new JSONArray();			
			data.put(TeleonomeConstants.NUCLEI_MNEMOSYNE);
			data.put(TeleonomeConstants.NUCLEI_PURPOSE);

			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(data.toString());
			out.flush();
			out.close();

		}else if(formName.equals("GetDeneChainNames")) {
			String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
			String anyTeleonomeName = req.getParameter("TeleonomeName");
			String nucleus = req.getParameter("Nucleus");
			logger.debug("GetDeneChainNames, anyTeleonomeName=" + anyTeleonomeName + " nucleus=" + nucleus);
			JSONArray data=null;
			if(teleonomeName.equals(anyTeleonomeName)) {
				JSONObject pulse = (JSONObject) getServletContext().getAttribute("LastPulse");
				data = DenomeUtils.getAllDeneChainsForNucleus(pulse, nucleus);
			}else {
				data = aDBManager.getDeneChainNamesForTeleonomeInOrganism(anyTeleonomeName, nucleus);
			}


			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(data.toString());
			out.flush();
			out.close();

		}else if(formName.equals("GetDeneNames")) {
			String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
			String anyTeleonomeName = req.getParameter("TeleonomeName");
			String nucleus = req.getParameter("Nucleus");
			String deneChain = req.getParameter("DeneChain");
			logger.debug("GetDeneNamed, anyTeleonomeName=" + anyTeleonomeName + " nucleus=" + nucleus + " deneChain=" + deneChain);
			JSONArray data=null;
			if(teleonomeName.equals(anyTeleonomeName)) {
				JSONObject pulse = (JSONObject) getServletContext().getAttribute("LastPulse");
				data = DenomeUtils.getAllDenesForDeneChain(pulse, nucleus, deneChain);
			}else {
				data = aDBManager.getDeneNamesForTeleonomeInOrganism(anyTeleonomeName, nucleus, deneChain);
			}

			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(data.toString());
			out.flush();
			out.close();

		}else if(formName.equals("GetDeneWordNames")) {
			String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
			String anyTeleonomeName = req.getParameter("TeleonomeName");
			String nucleus = req.getParameter("Nucleus");
			String deneChain = req.getParameter("DeneChain");
			String dene = req.getParameter("Dene");
			logger.debug("GetDeneWordNames, anyTeleonomeName=" + anyTeleonomeName + " nucleus=" + nucleus + " deneChain=" + deneChain + " dene=" + dene);

			JSONArray data=null;
			if(teleonomeName.equals(anyTeleonomeName)) {
				JSONObject pulse = (JSONObject) getServletContext().getAttribute("LastPulse");
				data = DenomeUtils.getAllDeneWordsForDene(pulse, nucleus, deneChain, dene);
			}else {
				data = aDBManager.getDeneWordNamesForTeleonomeInOrganism(anyTeleonomeName, nucleus, deneChain, dene);
			}

			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(data.toString());
			out.flush();
			out.close();

		}else if(formName.equals("GetAutoCompleteValues")) {
			JSONObject autoCompleteValues = (JSONObject) getServletContext().getAttribute("AutoCompleteValues");
			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(autoCompleteValues.toString());
			out.flush();
			out.close();

		}else if(formName.equals("LookUpDeneWord")) {

			String identityPointer = req.getParameter("identity");
			Identity identity = new Identity(identityPointer);
			TimeZone timeZone = (TimeZone) getServletContext().getAttribute("TimeZone");
			long from = Long.parseLong(req.getParameter("from"));
			long until = Long.parseLong(req.getParameter("until"));

			String teleonomeName = (String) getServletContext().getAttribute("TeleonomeName");
			logger.debug("for search teleonomeName :" + teleonomeName + " identity.getTeleonomeName()=" + identity.getTeleonomeName());

			JSONArray values = null;
			if(identity.getTeleonomeName().equals(teleonomeName)) {
				values = aDBManager.getDeneWordTimeSeriesByIdentity( identity,  from,  until);
			}else {
				values = aDBManager.getOrganismDeneWordTimeSeriesByIdentity( identity,  from,  until);
			}

			logger.debug("After search for :" + identity + " values length=" + values.length());

			JSONObject toReturn = new JSONObject();
			toReturn.put("Value", values);
			//
			// to get the units and the minimum, get the last pulse
			org.postgresql.util.PGobject pg = (PGobject) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
			String units = "";
			if(pg!=null) {
				units = pg.toString();
			}
			//String units = (String) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
			//double minimum = (double) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE);
			pg = (PGobject) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE);
			double minimum = 0.0;
			if(pg!=null && pg.getValue()!=null) {
				minimum = Double.parseDouble(pg.getValue());
			}

			logger.debug("After search otherTelenomeLastPulse :" + units + " minimum=" + minimum);




			toReturn.put("Units", units);
			toReturn.put("Minimum", minimum);


			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(toReturn.toString());
			out.flush();
			out.close();

		}else if(formName.equals("RememberDeneWord")) {
			String identityPointer = req.getParameter("identity");
			TimeZone timeZone = (TimeZone) getServletContext().getAttribute("TimeZone");
			long from = Long.parseLong(req.getParameter("from"));
			long until = Long.parseLong(req.getParameter("until"));
			logger.debug("identityPointer=" + identityPointer);
			JSONArray values = aDBManager.getRemeberedDeneWord(timeZone, identityPointer, from, until);

			JSONObject toReturn = new JSONObject();
			toReturn.put("Value", values);

			JSONObject deneWordsToRemember = (JSONObject) getServletContext().getAttribute("DeneWordsToRemember");
			JSONObject deneWordToRemember = deneWordsToRemember.getJSONObject(identityPointer);
			String units="N.A.";
			if(deneWordToRemember.has(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE)) {
				units = deneWordToRemember.getString(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
			}
			double minimum=0.0;
			if(deneWordToRemember.has(TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE)) {
				minimum = deneWordToRemember.getDouble(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
			}

			toReturn.put("Units", units);
			toReturn.put("Minimum", minimum);
			res.setContentType("application/json;charset=UTF-8");
			PrintWriter out = res.getWriter();
			out.print(toReturn.toString());
			out.flush();
			out.close();
		}else if(formName.equals("RefreshCurrentView")) {
			JSONArray toReturn = new JSONArray();
			String rawData = req.getParameter("data");
			logger.debug("Refreshcurrent virew, received:" + rawData);
			JSONArray data = new JSONArray(rawData);
			for(int i =0;i<data.length();i++) {
				JSONObject dataElement = data.getJSONObject(i);
				logger.debug("Refreshcurrent virew, processing:" + dataElement.toString(4));
				String formName2 = dataElement.getString("formName");
				String chartTitle = dataElement.getString("chartTitle");
				String chartDivId = dataElement.getString("chartDivId");	
				String visualizationStyle = dataElement.getString("visualizationStyle");
				long fromMillis = dataElement.getLong("fromMillis");
				long untilMillis = dataElement.getLong("untilMillis");

				boolean liveUpdate = dataElement.getBoolean("liveUpdate");

				String identityPointer =  dataElement.getString("identity");
				Identity identity = new Identity(identityPointer);

				TimeZone timeZone = (TimeZone) getServletContext().getAttribute("TimeZone");


				if(formName2.equals("RememberDeneWord")) {


					logger.debug("identityPointer=" + identityPointer);
					JSONArray values = aDBManager.getRemeberedDeneWord(timeZone, identityPointer, fromMillis, untilMillis);

					JSONObject toReturnElement = new JSONObject();
					toReturnElement.put("Value", values);
					toReturnElement.put("liveUpdate", liveUpdate);
					JSONObject deneWordsToRemember = (JSONObject) getServletContext().getAttribute("DeneWordsToRemember");
					JSONObject deneWordToRemember = deneWordsToRemember.getJSONObject(identityPointer);
					String units="N.A.";
					if(deneWordToRemember.has(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE)) {
						units = deneWordToRemember.getString(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
					}
					double minimum=0.0;
					if(deneWordToRemember.has(TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE)) {
						minimum = deneWordToRemember.getDouble(TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
					}
					toReturnElement.put("TeleonomeName", identity.getTeleonomeName());
					toReturnElement.put("chartTitle", chartTitle);
					toReturnElement.put("Units", units);
					toReturnElement.put("chartDivId"	,chartDivId);
					toReturnElement.put("Minimum", minimum);
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
					org.postgresql.util.PGobject pg = (PGobject) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
					String units = "";
					if(pg!=null) {
						units = pg.toString();
					}
					//String units = (String) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_UNIT_ATTRIBUTE);
					//double minimum = (double) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE);
					pg = (PGobject) aDBManager.getOrganismDeneWordAttributeByIdentity( identity, TeleonomeConstants.DENEWORD_MINIMUM_ATTRIBUTE);
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


			PrintWriter out = res.getWriter();
			out.print(toReturn.toString());
			out.flush();
			out.close();
		}

	}

	
	public void sendCommand(String command,String commandCode, String payLoad){
		logger.debug("sending command to database =" + command);
		byte[] buffer = command.getBytes(StandardCharsets.UTF_8);
		PostgresqlPersistenceManager aDBManager = (PostgresqlPersistenceManager) getServletContext().getAttribute("DBManager");

		int id = aDBManager.requestCommandToExecute(command,commandCode, payLoad);
		logger.debug("TeleonomeServlet id=" + id);
		//
		// now keep waiiting until the command is executed
		//
		boolean waitForCommandToComplete=true;
		int counter=0;
		int numberOfTries=100;
		while(waitForCommandToComplete){
			counter++;
			waitForCommandToComplete= !aDBManager.isCommandCompleted(id);
			logger.debug("Wait for command to complete=" + waitForCommandToComplete + " counter=" + counter);

			try {
				Thread.sleep(500);
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			//
			// if we tried ten times and did nt respond
			// then blink red three times and get out the loop
			if(waitForCommandToComplete && counter>numberOfTries){
				logger.debug(command + "  Failed to be executed in the time alloted");
				waitForCommandToComplete=false;
			}
		}
	}
	
	



	public String getServletInfo() {
		return "Teleonome Servlet";
	}
}
