package com.teleonome.webapp.servlet;

import java.io.File;
import java.io.IOException;
import java.nio.file.FileSystems;
import java.nio.file.Path;
import java.nio.file.StandardWatchEventKinds;
import java.nio.file.WatchEvent;
import java.nio.file.WatchKey;
import java.nio.file.WatchService;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.TimeZone;

import javax.servlet.ServletContext;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.FilenameUtils;
import org.apache.log4j.Logger;
import org.json.JSONException;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.denome.Identity;
import com.teleonome.framework.exception.InvalidDenomeException;
import com.teleonome.framework.utils.Utils;

public class FileWatcherThread extends Thread{
	//  AsyncContext anAsyncContext;
	String denomeFileName="";
	Logger logger;
	private ServletContext servletContext;
	public FileWatcherThread(ServletContext s){
		servletContext=s;
		logger = Logger.getLogger(getClass());

	}
	
	public void run(){

		final Path path = FileSystems.getDefault().getPath(Utils.getLocalDirectory());
		//	// System.out.println(path);
		try (final WatchService watchService = FileSystems.getDefault().newWatchService()) {
			final WatchKey watchKey = path.register(watchService, StandardWatchEventKinds.ENTRY_MODIFY);
			boolean keepRunning=true;
			while (keepRunning) {
				final WatchKey wk = watchService.take();
				for (WatchEvent<?> event : wk.pollEvents()) {
					//we only register "ENTRY_MODIFY" so the context is always a Path.
					final Path changed = (Path) event.context();
					File selectedFile = changed.toFile();

					String extension = FilenameUtils.getExtension(selectedFile.getAbsolutePath());
					String fileName = FilenameUtils.getName(selectedFile.getAbsolutePath());
					logger.debug("File  changed:" + changed + " extension:" + extension);
					if (extension.equals("denome")) {
						
						
						JSONObject operationalDataDeneChain=null,sensorDataDeneChain=null;
						logger.debug("Reading denome from " +selectedFile.getName());

						String denomeFileInString = FileUtils.readFileToString(selectedFile);
						

						if(denomeFileInString!=null && denomeFileInString.length()>10){
							try {
								JSONObject denomeJSONObject = new JSONObject(denomeFileInString);
								
								String pulseTimestamp = denomeJSONObject.getString("Pulse Timestamp");
								long pulseTimestampInMilliseconds = denomeJSONObject.getLong("Pulse Timestamp in Milliseconds");
								long pulseDuration = denomeJSONObject.getLong("Pulse Creation Duration Millis");
								//
								// get the operational data chain in the purpose nucleus
								//
								JSONObject internalVitalDene=null, internalDescriptiveDeneChain=null;
								String timeZoneId = "UTC";
								int basePulseFrequency=60;
								String currentIdentityMode="";
								try {
									internalDescriptiveDeneChain = DenomeUtils.getDeneChainByName(denomeJSONObject,TeleonomeConstants.NUCLEI_INTERNAL,  TeleonomeConstants.DENECHAIN_DESCRIPTIVE);
									internalVitalDene = DenomeUtils.getDeneByName(internalDescriptiveDeneChain, "Vital");
									timeZoneId = (String) DenomeUtils.getDeneWordAttributeByDeneWordNameFromDene(internalVitalDene, "Timezone", TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE);
									
									basePulseFrequency = ((int) DenomeUtils.getDeneWordAttributeByDeneWordNameFromDene(internalVitalDene, "Base Pulse Frequency", TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE))/1000;
									operationalDataDeneChain = DenomeUtils.getDeneChainByName(denomeJSONObject,TeleonomeConstants.NUCLEI_PURPOSE,  TeleonomeConstants.DENECHAIN_OPERATIONAL_DATA);
									sensorDataDeneChain = DenomeUtils.getDeneChainByName(denomeJSONObject,TeleonomeConstants.NUCLEI_PURPOSE,  TeleonomeConstants.DENECHAIN_SENSOR_DATA);
								} catch (InvalidDenomeException e1) {
									// TODO Auto-generated catch block
									e1.printStackTrace();
								}

								//// System.out.println("AsyncServlet, timeZoneId=" + timeZoneId);
								TimeZone currentTimeZone = null;
								if(timeZoneId!=null && !timeZoneId.equals("")){
									currentTimeZone = TimeZone.getTimeZone(timeZoneId);
								}else{
									currentTimeZone = TimeZone.getDefault();
								}

							

								JSONObject vitalDene = DenomeUtils.getDeneByName(operationalDataDeneChain, "Vital");
								
								currentIdentityMode = (String) DenomeUtils.getDeneWordAttributeByDeneWordNameFromDene(vitalDene, TeleonomeConstants.DENEWORD_TYPE_CURRENT_IDENTITY_MODE, TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE);
								
								int currentPulseFrequency = ((Integer) DenomeUtils.getDeneWordAttributeByDeneWordNameFromDene(vitalDene, TeleonomeConstants.DENEWORD_TYPE_CURRENT_PULSE_FREQUENCY, TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE))/1000;
								//// System.out.println("AsyncServlet, currentPulse=" + currentPulse);
							
								servletContext.setAttribute("CurrentPulse", denomeJSONObject);
								servletContext.setAttribute("CurrentTimeZone", currentTimeZone);
								servletContext.setAttribute("CurrentIdentityMode", currentIdentityMode);
								logger.debug("CurrentIdentityMode="+ currentIdentityMode);
								servletContext.setAttribute("CurrentPulseFrequency", currentPulseFrequency);

							}catch (JSONException e) {
								// TODO Auto-generated catch block
								keepRunning=false;
								// System.out.println("Async  A pulse was not formated properluy, text=" + denomeFileInString);
							}
						} 
					}
				}
				// reset the key
				boolean valid = wk.reset();
				if (!valid) {
					// System.out.println("Async  Key has been unregisterede");
				}
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			String s = Utils.getStringException(e);
			// System.out.println("s=" + s);

		} catch (InterruptedException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			String s = Utils.getStringException(e);
			// System.out.println("s=" + s);

		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			String s = Utils.getStringException(e);
			//ystem.out.println("s=" + s);

		}
		//// System.out.println("Async  Existin FileWatcherThread");
	}
}