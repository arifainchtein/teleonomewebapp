package com.teleonome.webapp.servlet;



import java.io.File;
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.TimeZone;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.denome.Identity;
import com.teleonome.framework.exception.InvalidDenomeException;
import com.teleonome.framework.utils.Utils;



   
public class WebAppContextListener implements ServletContextListener {
	Logger logger ;
	ServletContext servletContext=null;
	public final static String BUILD_NUMBER="14/05/2018 08:27";
	
	public void contextInitialized(ServletContextEvent sce) {
		String fileName =  Utils.getLocalDirectory() + "lib/Log4J.properties";
		PropertyConfigurator.configure(fileName);
		logger = Logger.getLogger(getClass());
		
		String processName = ManagementFactory.getRuntimeMXBean().getName();
		logger.warn("WebServerProcess:" + processName +  " BUILD_NUMBER=" + BUILD_NUMBER);
		System.out.println("WebServerProcess:" + processName +  " BUILD_NUMBER=" + BUILD_NUMBER);
		try {
			FileUtils.writeStringToFile(new File("WebServerProcess.info"), processName);
		//	String webPid = Integer.parseInt(processName.split("@")[0]);
			
		} catch (IOException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		
		// start the thread
		servletContext = sce.getServletContext();
		TimeZone timeZone=null;
		try {
			timeZone = getTimeZone();
			servletContext.setAttribute("TimeZone", timeZone);
			JSONObject deneWordsToRemember =  getDeneWordsToRemember();
			servletContext.setAttribute("DeneWordsToRemember", deneWordsToRemember);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			logger.warn(Utils.getStringException(e));
		}
		logger.warn("timeZone:" + timeZone );
		
		logger.warn("Teleonome ContextListener Starting PingThread");
		
		PingThread aPingThread = new PingThread();
		aPingThread.start();
		logger.warn("Teleonome ContextListener initialized");
		
	}

	
	class PingThread extends Thread{
	     
	    public PingThread(){
	        setDaemon(true);
	    }
	    public void run(){
	        while(true) {
	        	logger.warn("Hello from WebServer ");
	        	try {
	    			FileUtils.writeStringToFile(new File("WebServerPing.info"), ""+System.currentTimeMillis());
	    		//	String webPid = Integer.parseInt(processName.split("@")[0]);
	    			
	    		} catch (IOException e1) {
	    			// TODO Auto-generated catch block
	    			e1.printStackTrace();
	    		}
	        	
	        	logger.warn("Refreshing, deneWordsToRemember");
	        	JSONObject deneWordsToRemember =  getDeneWordsToRemember();
				servletContext.setAttribute("DeneWordsToRemember", deneWordsToRemember);
				
		        try {
					Thread.sleep(1000*60);
				} catch (InterruptedException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
	        }
	    	
	    }
	    
	}
	
	public void contextDestroyed(ServletContextEvent sce) {
		// stop the thread
	}

	/**
	 * Generates a JSONObject that will contain as key the pointer to the remembered deneword and as a value the actual complete deneword
	 *  this is used o get units and minimums (if avaliable) for each deneword
	 * @return
	 */
	private JSONObject getDeneWordsToRemember() {
		JSONObject toReturn = new JSONObject();
		
		//*************************
		// first get all the denes of type DENE_TYPE_MNEMOSYCON_DENEWORDS_TO_REMEMBER 
		//
		// Hashtable<String,ArrayList> deneWordsToRememberByTeleonome
		
		
		try {
			JSONObject denomeJSONObject = new JSONObject(FileUtils.readFileToString(new File("Teleonome.denome")));
			JSONObject dataForBrowser = new JSONObject();
			JSONObject internalVitalDene=null, internalDescriptiveDeneChain=null;
			String timeZoneId = "UTC";
			int basePulseFrequency=60;
			JSONObject anMnemosyconsDeneChainJSONObject;
			
			anMnemosyconsDeneChainJSONObject = DenomeUtils.getDeneChainByName(denomeJSONObject,TeleonomeConstants.NUCLEI_INTERNAL,  TeleonomeConstants.DENECHAIN_MNEMOSYCONS);
			Hashtable deneWordsToRememberByTeleonome = new Hashtable();
			JSONObject rememberedWordsMnemosyconJSONObject;
			boolean active=false;
			JSONArray rememberedDeneWordsJSONArray;
			String rememberedDeneWordTeleonomeName,rememberedDeneWordPointer;
			Identity rememberedDeneWordIdentity;
			//ArrayList teleonomeRememeberedWordsArrayList;
			JSONArray mnemosyconDenesJSONArray;
			logger.debug("in denomemagager anMnemosyconsDeneChainJSONObject= " + anMnemosyconsDeneChainJSONObject);
			if(anMnemosyconsDeneChainJSONObject!=null){
				
				JSONArray denes = anMnemosyconsDeneChainJSONObject.getJSONArray("Denes");
				JSONObject rememberedDeneWordJSONObject;
				
				//String rememberedDeneWordUnit;
				
				for(int i=0;i<denes.length();i++){
					if(denes.getJSONObject(i).has(TeleonomeConstants.DENE_DENE_TYPE_ATTRIBUTE) && denes.getJSONObject(i).getString(TeleonomeConstants.DENE_DENE_TYPE_ATTRIBUTE).equals(TeleonomeConstants.DENE_TYPE_MNEMOSYCON_DENEWORDS_TO_REMEMBER)){
						rememberedWordsMnemosyconJSONObject = denes.getJSONObject(i);
						active = (boolean)  DenomeUtils.getDeneWordAttributeByDeneWordNameFromDene( rememberedWordsMnemosyconJSONObject , TeleonomeConstants.DENEWORD_ACTIVE, TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE);
						if(active) {
							rememberedDeneWordsJSONArray = getAllDeneWordAttributeByDeneWordTypeFromDene(rememberedWordsMnemosyconJSONObject, TeleonomeConstants.DENEWORD_TYPE_MNEMOSYCON_REMEMBERED_DENEWORD, TeleonomeConstants.COMPLETE);
							logger.debug("rememberedDeneWordsJSONArray= " + rememberedDeneWordsJSONArray);
							for(int j=0;j<rememberedDeneWordsJSONArray.length();j++) {
								rememberedDeneWordJSONObject = rememberedDeneWordsJSONArray.getJSONObject(j);
								rememberedDeneWordPointer= rememberedDeneWordJSONObject.getString(TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE);
								logger.debug( " rememberedDeneWordPointer= " + rememberedDeneWordPointer + " rememberedDeneWordJSONObject=" + rememberedDeneWordJSONObject.toString(4) );
								toReturn.put(rememberedDeneWordPointer, rememberedDeneWordJSONObject);
							}
						}
			
					}
				}
			}
		} catch (InvalidDenomeException e) {
			// TODO Auto-generated catch block
			logger.warn(Utils.getStringException(e));
		} catch (JSONException e) {
			// TODO Auto-generated catch block
			logger.warn(Utils.getStringException(e));
		} catch (IOException e) {
			// TODO Auto-generated catch block
			logger.warn(Utils.getStringException(e));
		}
		return toReturn;
	}
		
		


	
	
	public JSONArray getAllDeneWordAttributeByDeneWordTypeFromDene(JSONObject deneJSONObject , String type, String whatToBring) throws JSONException{
		JSONArray deneWords = deneJSONObject.getJSONArray("DeneWords");
		JSONArray toReturn = new JSONArray();
		for(int i=0;i<deneWords.length();i++){
			JSONObject deneWord = deneWords.getJSONObject(i); 
			if(!deneWord.has("DeneWord Type"))continue;
			String deneWordValueType = deneWord.getString(TeleonomeConstants.DENEWORD_DENEWORD_TYPE_ATTRIBUTE);
			if(deneWordValueType.equals(type)){
				if(whatToBring.equals(TeleonomeConstants.COMPLETE)){
					toReturn.put(deneWord);
				}else{
					toReturn.put(deneWord.get(whatToBring));
				}
			}
		}
		return toReturn;
	}
	
	
	
	
	
	private TimeZone getTimeZone() throws IOException{

		JSONObject denomeJSONObject = new JSONObject(FileUtils.readFileToString(new File("Teleonome.denome")));
		JSONObject dataForBrowser = new JSONObject();
		JSONObject internalVitalDene=null, internalDescriptiveDeneChain=null;
		String timeZoneId = "UTC";
		int basePulseFrequency=60;
		try {

			internalDescriptiveDeneChain = DenomeUtils.getDeneChainByName(denomeJSONObject,TeleonomeConstants.NUCLEI_INTERNAL,  TeleonomeConstants.DENECHAIN_DESCRIPTIVE);
			internalVitalDene = DenomeUtils.getDeneByName(internalDescriptiveDeneChain, "Vital");
			timeZoneId = (String) DenomeUtils.getDeneWordAttributeByDeneWordNameFromDene(internalVitalDene, "Timezone", TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE);
		} catch (InvalidDenomeException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}


		//System.out.println("MonoNannyServlet, timeZoneId=" + timeZoneId);
		TimeZone currentTimeZone = null;
		if(timeZoneId!=null && !timeZoneId.equals("")){
			currentTimeZone = TimeZone.getTimeZone(timeZoneId);
		}else{
			currentTimeZone = TimeZone.getDefault();
		}
		return currentTimeZone;
	}
	


}