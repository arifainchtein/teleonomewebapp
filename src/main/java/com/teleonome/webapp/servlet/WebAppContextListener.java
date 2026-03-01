package com.teleonome.webapp.servlet;



import java.io.File;
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.lang.reflect.Field;
import java.security.GeneralSecurityException;
import java.util.ArrayList;
import java.util.Hashtable;
import java.util.TimeZone;
import java.util.TreeMap;

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
import com.teleonome.framework.persistence.PostgresqlPersistenceManager;
import com.teleonome.framework.utils.Utils;




   
public class WebAppContextListener implements ServletContextListener {
	Logger logger ;
	ServletContext servletContext=null;
	public final static String BUILD_NUMBER="01/03/2026 12:24";
	private PostgresqlPersistenceManager aDBManager=null;
	
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
		aDBManager = PostgresqlPersistenceManager.instance();
		servletContext.setAttribute("DBManager", aDBManager);
		try {
			timeZone = getTimeZone();
			servletContext.setAttribute("TimeZone", timeZone);
			JSONObject deneWordsToRemember =  getDeneWordsToRemember();
			servletContext.setAttribute("DeneWordsToRemember", deneWordsToRemember);
			servletContext.setAttribute("TeleonomeName", getTeleonomeName());
			logger.warn("Refreshing, autocompleteValues");
        	long now = System.currentTimeMillis();
        	//JSONObject autoCompleteValues =  getAutoCompleteValues();
        	//logger.warn("it took " + ((System.currentTimeMillis()-now)/1000)+ " seconds to generate the autocomplete values");
        	//servletContext.setAttribute("AutoCompleteValues", autoCompleteValues);
        	
        	
			
			
		} catch (IOException e) {
			// TODO Auto-generated catch block
			logger.warn(Utils.getStringException(e));
		}
		logger.warn("timeZone:" + timeZone );
		
		
		logger.warn("Teleonome ContextListener Starting PingThread");
		PingThread aPingThread = new PingThread();
		aPingThread.start();
		logger.warn("Teleonome ContextListener initialized");
		FileWatcherThread aFileWatcherThread = new FileWatcherThread(servletContext);
		aFileWatcherThread.start();
	}

	
	class PingThread extends Thread{
	     
	    public PingThread(){
	        setDaemon(true);
	    }
	    public void run(){
	        while(true) {
	        	JSONObject deneWordsToRemember =  getDeneWordsToRemember();
				servletContext.setAttribute("DeneWordsToRemember", deneWordsToRemember);
				
	        	logger.debug("Hello from WebServer, executing PingThread refreshing ");
	        	try {
	        		double webserverAvailableMemory = Runtime.getRuntime().freeMemory()/1024000;
					double webserverMaxMemory = Runtime.getRuntime().maxMemory()/1024000;
					JSONObject pingInfo = new JSONObject();
					pingInfo.put(TeleonomeConstants.WEBSERVER_PROCESS_AVAILABLE_MEMORY, webserverAvailableMemory);
					pingInfo.put(TeleonomeConstants.WEBSERVER_PROCESS_MAXIMUM_MEMORY, webserverMaxMemory);
					pingInfo.put(TeleonomeConstants.DATATYPE_TIMESTAMP_MILLISECONDS, System.currentTimeMillis());
					
	    			FileUtils.writeStringToFile(new File("WebServerPing.info"), pingInfo.toString());
	    		//	String webPid = Integer.parseInt(processName.split("@")[0]);
	    			
	    		} catch (IOException e1) {
	    			// TODO Auto-generated catch block
	    			e1.printStackTrace();
	    		}
	        	String teleonomeInString;
	        	JSONObject denomeJSONObject=null;
	        	boolean keepGoing=true;
	        	int counter=0;
	        	int max=3;
	        	do {
	    			try {
	    				teleonomeInString = FileUtils.readFileToString(new File("Teleonome.denome"));
	    				denomeJSONObject = new JSONObject(FileUtils.readFileToString(new File("Teleonome.denome")));
	    				servletContext.setAttribute("CurrentPulse", denomeJSONObject);
	    				Identity identity = new Identity(getTeleonomeName(), TeleonomeConstants.NUCLEI_PURPOSE, TeleonomeConstants.DENECHAIN_OPERATIONAL_DATA, TeleonomeConstants.DENE_VITAL,TeleonomeConstants.DENEWORD_TYPE_CURRENT_IDENTITY_MODE);
						String currentIdentityMode = (String) DenomeUtils.getDeneWordByIdentity(denomeJSONObject, identity, TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE);
						servletContext.setAttribute("CurrentIdentityMode", currentIdentityMode);
	    				keepGoing=false;
	    			} catch (JSONException | IOException  | InvalidDenomeException e) {
	    				// TODO Auto-generated catch block
	    				
	    				logger.warn("line 133 Error reading the denome, waiting one second, counter=" + counter);
	    				try {
	    					Thread.sleep(1000);
	    				} catch (InterruptedException e1) {
	    					// TODO Auto-generated catch block
	    					e1.printStackTrace();
	    				}
	    				counter++;
	    				if(counter>max) {
	    					keepGoing=false;
	    				}
	    			} 
	    		}while(keepGoing);
	        	
				logger.debug("Refreshing, autocompleteValues");
				long now = System.currentTimeMillis();
	        //	JSONObject autoCompleteValues =  getAutoCompleteValues();
	        	
	        	logger.debug("it took " + ((System.currentTimeMillis()-now)/1000)+ " seconds to generate the autocomplete values");
	        	
		        try {
					Thread.sleep(1000*10);
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

	private JSONObject getAutoCompleteValues1() {
		JSONObject toReturn = new JSONObject();
		
		JSONArray teleonomeNames = aDBManager.getTeleonomeNamesInOrganism();
		String teleonomeName, nucleusName, deneChainName, deneName, deneWordName;
		JSONArray level0 = new JSONArray();
		JSONObject level1 = new JSONObject();
		JSONObject level2 = new JSONObject();
		JSONObject level3 = new JSONObject();
		JSONObject level4 = new JSONObject();
		JSONArray ar;
		JSONArray nucleiNames, deneChainNames, deneNames,deneWordNames;
		String SEP=":";
		for(int i=0;i<teleonomeNames.length();i++) {
			teleonomeName = (String) teleonomeNames.get(i);
			//logger.debug(teleonomeName);
			level0.put(teleonomeName);
			nucleiNames = aDBManager.getNucleiNamesForTeleonomeInOrganism( teleonomeName);
			for(int j=0;j<nucleiNames.length();j++) {
				nucleusName = (String) nucleiNames.get(j);
				if(!level1.has(teleonomeName)) {
					ar = new JSONArray();
				}else {
					ar = level1.getJSONArray(teleonomeName);
				}
				ar.put(nucleusName);
				level1.put(teleonomeName,ar);
				//logger.debug(teleonomeName + SEP + nucleusName);
				deneChainNames = aDBManager.getDeneChainNamesForTeleonomeInOrganism( teleonomeName, nucleusName);
				for(int k=0;k<deneChainNames.length();k++) {
					deneChainName = (String) deneChainNames.get(k);
					
					if(!level2.has(teleonomeName+SEP+nucleusName)) {
						ar = new JSONArray();
					}else {
						ar = level2.getJSONArray(teleonomeName+SEP+nucleusName);
					}
					ar.put(deneChainName);
					level2.put(teleonomeName+SEP+nucleusName,ar);
					
					deneNames = aDBManager.getDeneNamesForTeleonomeInOrganism( teleonomeName, nucleusName, deneChainName);
					//logger.debug(teleonomeName + SEP + nucleusName+ SEP + deneChainName + " deneNames=" + deneNames.toString(4));
					for(int l=0;l<deneNames.length();l++) {
						deneName = (String) deneNames.get(l);
						
						if(!level3.has(teleonomeName+SEP+nucleusName+SEP+deneChainName)) {
							ar = new JSONArray();
						}else {
							ar = level3.getJSONArray(teleonomeName+SEP+nucleusName+SEP+deneChainName);
						}
						ar.put(deneName);
						level3.put(teleonomeName+SEP+nucleusName+SEP+deneChainName,ar);
						deneWordNames = aDBManager.getDeneWordNamesForTeleonomeInOrganism( teleonomeName, nucleusName, deneChainName, deneName);
						//logger.debug(teleonomeName + SEP + nucleusName+ SEP + deneChainName+ SEP + deneName);
						for(int m=0;m<deneWordNames.length();m++) {
							deneWordName = (String) deneWordNames.get(m);
							if(!level4.has(teleonomeName+SEP+nucleusName+SEP+deneChainName +SEP +deneName)) {
								ar = new JSONArray();
							}else {
								ar = level4.getJSONArray(teleonomeName+SEP+nucleusName+SEP+deneChainName +SEP +deneName);
							}
							ar.put(deneWordName);
							level4.put(teleonomeName+SEP+nucleusName+SEP+deneChainName+SEP+deneName,ar);
							//logger.debug(teleonomeName + SEP + nucleusName+ SEP + deneChainName+ SEP + deneName+ SEP + deneWordName);
						}
					}
				}
			}
		}
		toReturn.put("Level0", level0);
		toReturn.put("Level1", level1);
		toReturn.put("Level2", level2);
		toReturn.put("Level3", level3);
		toReturn.put("Level4", level4);
		
		//
		
		return toReturn;
	}
	
	public String getTeleonomeName() {
		String teleonomeName="";
		String teleonomeInString="";
		//
		// there is always a posibility
		// that this call is made at the time
		// when the hypothalamus is writing the file to disk
		// in this case, the file read is not the complete denome
		// and an exception will be thrown, to mitigate this, allow for up tp
		// three times to repeat the operation
		boolean keepGoing=true;
		int counter=0;
		int max=3;
		do {
			try {
				teleonomeInString = FileUtils.readFileToString(new File("Teleonome.denome"));
				teleonomeName = new JSONObject(teleonomeInString).getJSONObject("Denome").getString("Name");
				keepGoing=false;
			} catch (JSONException | IOException e) {
				// TODO Auto-generated catch block
				
				logger.warn("Error reading the denome, waiting one second, counter=" + counter);
				try {
					Thread.sleep(1000);
				} catch (InterruptedException e1) {
					// TODO Auto-generated catch block
					e1.printStackTrace();
				}
				counter++;
				if(counter>max) {
					keepGoing=false;
				}
			}
		}while(keepGoing);
		
		return teleonomeName;
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
			String rememberedDeneWordTeleonomeName,rememberedDeneWordPointer,rememberedDeneWordSourceDeneWordPointer ;
			Identity rememberedDeneWordIdentity;
			//ArrayList teleonomeRememeberedWordsArrayList;
			JSONArray mnemosyconDenesJSONArray;
			//logger.debug("in denomemagager anMnemosyconsDeneChainJSONObject= " + anMnemosyconsDeneChainJSONObject);
			if(anMnemosyconsDeneChainJSONObject!=null){
				
				JSONArray denes = anMnemosyconsDeneChainJSONObject.getJSONArray("Denes");
				JSONObject rememberedDeneWordJSONObject, clonedRememberedDeneWordJSONObject;
				
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
								//
								// clone the remembereddenenword and add an attribute that will store the identity
								// of the deneword (which is a mnemosycon) that actually contains the data to be stored
								//
								rememberedDeneWordSourceDeneWordPointer = (new Identity(getTeleonomeName(), TeleonomeConstants.NUCLEI_INTERNAL,  TeleonomeConstants.DENECHAIN_MNEMOSYCONS, rememberedWordsMnemosyconJSONObject.getString(TeleonomeConstants.DENE_DENE_NAME_ATTRIBUTE),rememberedDeneWordJSONObject.getString(TeleonomeConstants.DENEWORD_NAME_ATTRIBUTE))).toString();
								logger.debug( " rememberedDeneWordPointer= " + rememberedDeneWordPointer + " rememberedDeneWordSourceDeneWordPointer=" + rememberedDeneWordSourceDeneWordPointer );
								
								clonedRememberedDeneWordJSONObject = new JSONObject(rememberedDeneWordJSONObject, JSONObject.getNames(rememberedDeneWordJSONObject));
								clonedRememberedDeneWordJSONObject.put(TeleonomeConstants.DENEWORD_IDENTITY_ATTRIBUTE ,rememberedDeneWordSourceDeneWordPointer);
								logger.debug("Storing a rememberedword as key=" + rememberedDeneWordPointer + " clonedRememberedDeneWordJSONObject=" + clonedRememberedDeneWordJSONObject.toString(4));
								toReturn.put(rememberedDeneWordPointer, clonedRememberedDeneWordJSONObject);
							}
						}
			
					}
				}
				toReturn = getSorted(toReturn);
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
		
		
	private  JSONObject getSorted(final JSONObject obj) {
		final JSONObject json = new JSONObject();
		try {
			final Field map = json.getClass().getDeclaredField("map");
			map.setAccessible(true);
			map.set(json, new TreeMap<>());
			map.setAccessible(false);
		} catch (final Exception e) {
			throw new RuntimeException(e);
		}

		for (final String key : obj.keySet()) {
			json.put(key, obj.get(key));
		}

		return json;
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