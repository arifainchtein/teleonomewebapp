package com.teleonome.webapp.servlet;



import java.io.File;
import java.io.IOException;
import java.lang.management.ManagementFactory;
import java.util.TimeZone;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;
import org.apache.log4j.PropertyConfigurator;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
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