"use strict";
var denomeJSONObject;
var pulseJSONObject;
var teleonomeName;
var nucleiJSONArray;
var pageToDisplay = -1;
var identityFactory;
var i,j,k,l;
var availableSSIDSArray;
var refreshInterfaceAfterModalNeeded=false;

//the humanInterfaceDeneChainIndex is a key value pair
//the key is the pointer and the value is the actual denechain
//the pointer is of the form @teleonomeName:Human Interface:Home Page
var humanInterfaceDeneChainIndex = new HashMap();
var humanInterfaceDeneChainArray;
var pulseTimestamp;
var pulseTimestampMilliseconds;
var timeStringSinceLastPulse;
var timeSinceLastPulse;
var currentPulseFrequency;
var currentPulseGenerationDuration;
var numberOfPulsesBeforeLate;
var betweenPulseInterval;
var teleonomeStatusBootstrapValue="info";
var chartDataSourcePointerHashMap = new HashMap();
var chartStyleHashMap = new HashMap();
var organismInfoJsonData;
var pulseCreationTime="";
var currentPathologyDeneCount=0;
var operationalMode="";
function monitorBetweenPulses() {

	timeSinceLastPulse = new Date().getTime()-pulseTimestampMilliseconds;
	timeStringSinceLastPulse = msToTime(timeSinceLastPulse);
	$("#TimeSinceLastPulse").html(timeStringSinceLastPulse);
	console.log("timeStringSinceLastPulse=" + timeStringSinceLastPulse);
	
	//
	// now calculate if we should change the color to indicate that is late
	// the logic is as follows:
	// currentPulseFrequency = how long to sleep between the end of a pulse cycle and the beginning of the next
	// currentPulseGenerationDuration = how long it took to generate the pulse
	//
	// under normal circunstance, you could have that it takes 5 seconds to execute a pulse
	// and the frequency is every 60 seconds.  however, if there are anylticons or mnemosycins involved
	// it could easily be that it takes 20 minutes to complete a pulse and then the pulse slee ps for 60 secnds
	//
	// because of this, the time to go to flasinh warning is when the last pulse
	// is half of what it the threshold and blinking red if its greater thant the 
	// algoritym

	if ( numberOfPulsesBeforeLate != undefined &&
			currentPulseGenerationDuration != undefined &&
			currentPulseFrequency != undefined){


		var timeBeforeLate = numberOfPulsesBeforeLate*(currentPulseGenerationDuration+currentPulseFrequency);

		//timeBeforeLate = 60000;
		console.log("timeBeforeLate=" + timeBeforeLate + " timeSinceLastPulse=" + timeSinceLastPulse);
		
			if(timeSinceLastPulse>timeBeforeLate){
				//
				// set the status to blinking yellow
				//
				
				
				$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-danger');
				
			
			}else if(timeSinceLastPulse>timeBeforeLate/2){
				
				$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-warning');
				 
			

			}else{
				//
				// set the status to blinking yellow
				//
				
				$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-success');
				
				

			}
		
	}

} 


function asyncUpdate(text){
	//
	// the format is a json object like
	//  {
//		pointer:value,
//		pointer,value
//		}
	// now loop over every element
	// update it in the denome
	// and call refreshInterface to update
	var myDate = new Date();
//	var theyear = myDate.getFullYear();
//	var themonth = myDate.getMonth() + 1;
//	var thetoday = myDate.getDate();
	var hours = "";
	var h = myDate.getHours();
	if(h<10)hours="0"+h;
	else hours=""+h;
	var min = myDate.getMinutes();
	var minutes="";
	if(min<10)minutes="0"+min;
	else minutes=""+min;
	var sec = myDate.getSeconds();
	var seconds="";
	if(sec<10)seconds="0"+sec;
	else seconds=""+sec;
	
	var timeString = hours + ":" + minutes + ":" + seconds;
	
	$('#PulseStatusInfo').text("Updated " + timeString);
	var updateJson = JSON.parse(text);
	var value;
	var identity;

	if(identityFactory!=null && nucleiJSONArray!=null){
		identityFactory = new IdentityFactory();
		for (var pointer in updateJson){
			value = updateJson[pointer];
			setDeneWordValueByIdentityPointer(pointer, value)
		}
		RefreshInterface();
	}
	
}
	

function updatePulseStatusInfo(text){
	$('#PulseStatusInfo').text(text);
}
function updatePulseStatusInfoSecundary(text){
	$('#PulseStatusInfoSecundary').text(text);
}

function setAvailableSSIDs(ssids){
	console.log("Ssids=" + JSON.stringify(ssids));
	availableSSIDSArray=ssids;
}


function updateOrganismView(text){
	 organismInfoJsonData = JSON.parse(text);
	 refreshOrganismView();
}
function refreshOrganismView(){
	if(organismInfoJsonData != undefined){
		var panelHTML="";
		$('#OrganismView').empty();
		for(var i in organismInfoJsonData){
			if(i != teleonomeName){
			panelHTML += "<div class=\"col-lg-2 col-md-2 col-sm-2 col-xs-6 text-center top-buffer\">";
			panelHTML += "<a href=\"http://"+i+".local\" class=\"btn btn-lg btn-"+ organismInfoJsonData[i] +"\">"+i+"</a>";
			panelHTML += "</div>";	
			}
		}
		//
		//
//		panelHTML += "<div id=\"OrganismDetail\" class=\"row hidden\">";
//		panelHTML += "<div class=\"col-lg-12 col-md-12 col-sm-12 col-sm-12 col-xs-12 text-center top-buffer\">";
//		panelHTML += "<div id=\"DetailText\"></div></div></div>";
		
		$('#OrganismView').append(panelHTML);
	}
	
}

function loadDenomeRefreshInterface(denomeFileInString) {
	console.log("pulse arrive at " + new Date() );
	if(betweenPulseInterval!= undefined)clearInterval(betweenPulseInterval);
	
	$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-success');
	pulseJSONObject= JSON.parse(denomeFileInString);
	if(!$('#bannerformmodal').hasClass('in')){
		RefreshInterface();
	}else{
		//
		// we are not refreshing the interface
		// because there is a modal window open,
		// set the flag so that closing it will refreshinterface
		refreshInterfaceAfterModalNeeded=true;
	}
}

function RefreshInterface(){
	
	identityFactory = new IdentityFactory();
	denomeJSONObject = pulseJSONObject.Denome;
	teleonomeName=denomeJSONObject.Name;
	humanInterfaceDeneChainArray = getHumanInterfaceDeneChainsForVisualizer();
	
	$('title').text(teleonomeName);
	pulseTimestamp = pulseJSONObject["Pulse Timestamp"];
	pulseTimestampMilliseconds = pulseJSONObject["Pulse Timestamp in Milliseconds"];
	var pulseCreationTimeMilliseconds = pulseJSONObject["Pulse Creation Duration Millis"];
	
	var operationalModePointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_OPERATIONAL_MODE;
	operationalMode = getDeneWordByIdentityPointer(operationalModePointer, DENEWORD_VALUE_ATTRIBUTE);
	pulseCreationTime = msToTime(pulseCreationTimeMilliseconds);
	timeSinceLastPulse = new Date().getTime()-pulseTimestampMilliseconds;
	timeStringSinceLastPulse = msToTime(timeSinceLastPulse);
	
	 chartDataSourcePointerHashMap = new HashMap();
	 chartStyleHashMap = new HashMap();
	 var pathologyDenes = getPathologyDenes();
	 var mnemosynePathologyDenes = getMnemosynePathologyDenes();
	 
	 currentPathologyDeneCount = pathologyDenes.length + mnemosynePathologyDenes.length;
	 if(currentPathologyDeneCount>0){
		// $('#Pathology').show();
		// $('#ErrorText').html("See Pathology (" + pathologyDenes.length + ")");
		// console.log("Pathology Denes:" + JSON.stringify(pathologyDenes));
		// console.log("Mnemosyne Pathology Denes:" + JSON.stringify(mnemosynePathologyDenes));
		 
	 }else{
		 $('#Pathology').hide();
		 $('#ErrorText').html("");
	 }
	
	//console.log("humanInterfaceDeneChainArray=" + humanInterfaceDeneChainArray);
	var pointer;
	for( i=0;i<humanInterfaceDeneChainArray.length;i++){
		pointer = "@" + teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":"+ humanInterfaceDeneChainArray[i]["Name"];
		humanInterfaceDeneChainIndex.put(pointer, humanInterfaceDeneChainArray[i]);
	}

	var teleonomeStatusBootstrapValuePointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_OPERATIONAL_STATUS_BOOTSTRAP_EQUIVALENT;
	//console.log("teleonomeStatusBootstrapValuePointer=" + teleonomeStatusBootstrapValuePointer);
	teleonomeStatusBootstrapValue = getDeneWordByIdentityPointer(teleonomeStatusBootstrapValuePointer, DENEWORD_VALUE_ATTRIBUTE);
	
	var currentPulseFrequencyPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_CURRENT_PULSE_FREQUENCY;
	//console.log("currentPulseFrequencyPointer=" + currentPulseFrequencyPointer);
	currentPulseFrequency = getDeneWordByIdentityPointer(currentPulseFrequencyPointer, DENEWORD_VALUE_ATTRIBUTE);
	//console.log("currentPulseFrequency=" + currentPulseFrequency);

	var currentPulseGenerationDurationPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_CURRENT_PULSE_GENERATION_DURATION;
	//console.log("currentPulseGenerationDurationPointer=" + currentPulseGenerationDurationPointer);
	currentPulseGenerationDuration = getDeneWordByIdentityPointer(currentPulseGenerationDurationPointer, DENEWORD_VALUE_ATTRIBUTE);
	//console.log("currentPulseGenerationDuration=" + currentPulseGenerationDuration);

	var numberOfPulsesBeforeLatePointer = "@" +teleonomeName + ":" + NUCLEI_INTERNAL + ":" +DENECHAIN_DESCRIPTIVE + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_NUMBER_PULSES_BEFORE_LATE;
	//console.log("numberOfPulsesBeforeLatePointer=" + numberOfPulsesBeforeLatePointer);
	numberOfPulsesBeforeLate = getDeneWordByIdentityPointer(numberOfPulsesBeforeLatePointer, DENEWORD_VALUE_ATTRIBUTE);
	//console.log("numberOfPulsesBeforeLate=" + numberOfPulsesBeforeLate);

	identityFactory.init(teleonomeName);
	if(pageToDisplay === -1){
		pageToDisplay = 1;
	}


	renderPageToDisplay();

	//
	// now generate the bottomname
	// <div class="col-xs-2 text-center">
	// <a href="javascript:setPageToDisplay(1)"><i class="glyphicon glyphicon-home"></i><br>Home</a>
	// </div>
	var deneChainControlParamPointer = "@" +teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":" +DENECHAIN_TYPE_HUMAN_INTERFACE_CONTROL_PARAMETERS;
	var  deneChainControlParam = getDeneChainByIdentityPointer(deneChainControlParamPointer);
	var bottomNavHTML = extraLowerNavInfo(deneChainControlParam);
	
	$("#bottomNav").empty();
	$("#bottomNav").append(bottomNavHTML);
	
	refreshOrganismView();
	betweenPulseInterval = setInterval(monitorBetweenPulses, 10 * 1000);

}	

function setPageToDisplay(p){
	pageToDisplay=p;
	renderPageToDisplay();
}


function renderPageToDisplay(){
	var pagePosition, pageDefinintionPointer;
	var controlParameterDenes,controlParameterDene, deneWords, deneWord;
	console.log("entering render page to display, with pageToDisplay=" + pageToDisplay );
	for( j=0;j<humanInterfaceDeneChainArray.length;j++){
		if( humanInterfaceDeneChainArray[j]["DeneChain Type"]===HUMAN_INTERFACE_CONTROL_PARAMETERS){
			controlParameterDenes = humanInterfaceDeneChainArray[j]["Denes"];
			for( k=0;k<controlParameterDenes.length;k++){
				controlParameterDene = controlParameterDenes[k];
				deneWords = controlParameterDene["DeneWords"];
				for( l=0;l<deneWords.length;l++){
					deneWord = deneWords[l];
					if(deneWord["Name"]===DENEWORD_HUMAN_INTERFACE_WEB_PAGE_PAGE_POSITION){
						pagePosition =  deneWord["Value"];
						if(pageToDisplay===pagePosition){
							pageDefinintionPointer = getDeneWordAttributeByDeneWordTypeFromDene(controlParameterDene, DENEWORD_TYPE_WEB_PAGE_VIEW_DEFINITION_POINTER,DENEWORD_VALUE_ATTRIBUTE);
							//console.log("pageDefinintionPointer=" +pageDefinintionPointer);
							renderPageByPointer(pageDefinintionPointer);
						}
					}
				}
			}
		}
	}
	
}





	function renderPageByPointer(pagePointer){
		var pageDeneChain = humanInterfaceDeneChainIndex.get(pagePointer);
		//console.log("renderPageByPointer pageDeneChain=" +pageDeneChain);
		//
		// get the denes, every dene is a panel in this page
		//
		var denePanelArray = pageDeneChain["Denes"];
		//
		// loop over every dene and get two denes
		// each of type Visualization Position and  Panel DeneChain Pointer
		var panelPositionInPageHashMap = new HashMap();
		//
		// also make another hashmap with the key beein the pointer and the value the panelVisualStyle;
		//
		var panelPointerVisualStyleHashMap = new HashMap();
		var deneWords;
		var panelInPagePosition=-1;
		var panelDeneChainPointer;
		var panelVisualStyle;
		var panelExternalDataSourcePointer, panelExternalTimestampDataSourcePointer;
		var panelPointerExternalDataSourcePointerHashMap = new HashMap();
		var panelPointerExternalTimestampDataSourcePointerHashMap = new HashMap();
		
		
		//
		// re initialize the charts data holders
		 chartDataSourcePointerHashMap = new HashMap();
		 chartStyleHashMap = new HashMap();

		
		
		var deneWord;
		var denePanel;
		var panelVisualizationStyle;
		var dataDene;
		//console.log("renderPageByPointer denePanelArray.length=" +denePanelArray.length);
		var i2=0, j2=0,k2=0;
		for(i2=0;i2<denePanelArray.length;i2++){
			denePanel = denePanelArray[i2];
			//
			// get the denewords
			deneWords = denePanel["DeneWords"];
			panelInPagePosition=-1;
			panelDeneChainPointer="";
			panelVisualStyle="";
			panelExternalDataSourcePointer="";
			panelExternalTimestampDataSourcePointer="";
			
			for(j2=0;j2<deneWords.length;j2++){
				deneWord = deneWords[j2];
				//
				// get the position and the type
				if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_IN_PAGE_POSITION){
					panelInPagePosition = deneWord["Value"];
				}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_DENECHAIN_POINTER){
					panelDeneChainPointer = deneWord["Value"];
				}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_VISUALIZATION_STYLE){
					panelVisualStyle = deneWord["Value"];
				}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_EXTERNAL_DATA_SOURCE_DENE){
					panelExternalDataSourcePointer = deneWord["Value"];
				}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_EXTERNAL_TIMESTAMP_DATA_SOURCE_DENE){
					panelExternalTimestampDataSourcePointer = deneWord["Value"];
				}
			}
			//
			// if the values were found store them in a hashmap
			//
			if(panelInPagePosition!=-1 &&  panelDeneChainPointer!=""){
				panelPositionInPageHashMap.put(panelInPagePosition,panelDeneChainPointer);
			}

			if(panelVisualStyle!="" &&  panelDeneChainPointer!=""){
				panelPointerVisualStyleHashMap.put(panelDeneChainPointer,panelVisualStyle);
			}
			
			if(panelExternalDataSourcePointer!="" &&  panelDeneChainPointer!=""){
				panelPointerExternalDataSourcePointerHashMap.put(panelDeneChainPointer,panelExternalDataSourcePointer);
			}
			
			if(panelDataSourcePointer!="" &&  panelExternalTimestampDataSourcePointer!=""){
				panelPointerExternalTimestampDataSourcePointerHashMap.put(panelDeneChainPointer,panelExternalTimestampDataSourcePointer);
			}
		}
		//
		// sort the hashmap by postion
		//
		var sorted= sortHashMap(panelPositionInPageHashMap);
		//
		// now start rendering each panel
		// therefore at this point empty the interface
		//
		$("#EntryPoint").empty();
		$("#teleonomeName").html(teleonomeName);
		$("#PulseTimestamp").html(pulseTimestamp);
		$("#PulseCreationTime").html(pulseCreationTime);
		//if(operationalMode!=OPERATIONAL_MODE_NORMAL){
			$("#WPSInfo").html(operationalMode);
		//}
		$("#TimeSinceLastPulse").html(timeStringSinceLastPulse);
		$('#TeleonomeStatus').removeClass().addClass('label label-lg label-' + teleonomeStatusBootstrapValue);
		if(currentPathologyDeneCount>0){
			$('#TeleonomeStatus').html("&nbsp;&nbsp;" + currentPathologyDeneCount + "&nbsp;&nbsp;");
		}else {
			$('#TeleonomeStatus').html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
		}
		var panelHTML =""; 
		var deneChainPointer , mainPanelVisualStyle,panelDeneChain , denes,panelPositionInPanelHashMap;
		var key,key2,renderedDataSourceDeneWord, panelDataSourcePointer;
		var visible=true;

		for(key in sorted){
			var obj = sorted[key];
			//console.log("key=" + key + "value=" + obj);
			for(var property in obj) {
				deneChainPointer= obj[property];
				//console.log("line 178 a property=" + deneChainPointer);
			}

		}

		panelHTML ="";
		var rowPanelCounter=1;
		var numberOfPanelsPerRow=2;
		var obj =  sorted["_map"];
		var obj2 = panelPointerVisualStyleHashMap["_map"];
		var obj3 = panelPointerExternalDataSourcePointerHashMap["_map"];
		var obj4 = panelPointerExternalTimestampDataSourcePointerHashMap["_map"];
		
		//
		// after every two panels put a new row
		// open the first one
		//
		panelHTML += "<div class=\"row top-buffer\">";
		var panelCounter=0;

		for(var property in obj) {
			deneChainPointer= obj[property];
			panelCounter++;
			mainPanelVisualStyle= obj2[deneChainPointer];
			panelExternalDataSourcePointer = obj3[deneChainPointer];
			panelExternalTimestampDataSourcePointer = obj4[deneChainPointer];
			
			console.log("line 197 deneChainPointer=" + deneChainPointer +" mainPanelVisualStyle=" + mainPanelVisualStyle);

			panelDeneChain = humanInterfaceDeneChainIndex["_map"][deneChainPointer];
			denes = panelDeneChain["Denes"];		
			//
			// the next step is to take the denes and in each one
			// get the the position of this panel inside of the main panel
			// and store them in hashmap sthat will be sorted
			// the sorted
			//

			
			// start rendering the html for this panel
			//
			if(mainPanelVisualStyle===PANEL_VISUALIZATION_ORGANISM_VIEW){
				
				panelHTML += "<div class=\"col-lg-12\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div id=\"OrganismView\" class=\"row\">";
				refreshOrganismView();
		

			}else if( mainPanelVisualStyle === PANEL_VISUALIZATION_STYLE_SETTINGS_INFO){
				 var settingsInfo = new SettingsInfo();
				 panelHTML += settingsInfo.process();
				    
			}else if( mainPanelVisualStyle === PANEL_VISUALIZATION_STYLE_NETWORK_MODE_SELECTOR){
				
				panelHTML += "<div class=\"col-lg-12\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";
				panelHTML += "<Form id=\"Resignal\" name=\"ReSignal\"  id=\"MainForm\" method=\"POST\" action=\"MonoNannyServlet\">";
				
				var currentIdentityModePointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_CURRENT_IDENTITY_MODE;
				var currentIdentityMode = getDeneWordByIdentityPointer(currentIdentityModePointer, DENEWORD_VALUE_ATTRIBUTE);
				if(currentIdentityMode == TELEONOME_IDENTITY_SELF){
					panelHTML += "<div id=\"NetworkMode\">";
					panelHTML += "<center>";
					panelHTML += "<div class=\"row\">";
					panelHTML += "<label class=\"RadioLabel\">Enable Network Mode</label><br>";
					panelHTML += "<input class=\"BSswitch\" id=\"EnableNetworkMode\" name=\"EnableNetworkMode\" type=\"checkbox\" data-on-text=\"Yes\" \"Enable Host Mode\"  data-off-text=\"No\" value=\"Yes\">"; 
					panelHTML += "</div>";
					panelHTML += "<div class=\"row\"><div class=\"col-xs-12\" style=\"height: 20px;\"></div></div>";
	
					panelHTML += "<div class=\"row\">";
					panelHTML += "<div id=\"AvailableNetworkSection\">";
					panelHTML += "<label>Available Networks:</label><br>";
					panelHTML += "<select id=\"AvailableNetworks\" name=\"AvailableNetworks\"></select>";
					panelHTML += "<option value=\"\">Select SSID</option>";
					//
					// set up the available ssids
					//
					var availableSSIDs = [];//currentOperationalData["Available SSIDs"];
					for(var i = 0; i < availableSSIDs.length; i++) {
					    var item = availableSSIDs[i];
					    var security="";
				    	if(item["Authentication"]!=null && item["Authentication"].indexOf("PSK")>-1)security="Password";
				    	var key = item["SSID"]+ "-" + item["Signal"] + " " + security;
				    	var value=item["SSID"] ;
				    	panelHTML += "<option value=\""+ value+"\">"+ key +"</option>";
					}	
					panelHTML += "</select>";
					panelHTML += "</div>";
					panelHTML += "</div>";
					panelHTML += "<div class=\"row\"><div class=\"col-xs-12\" style=\"height: 30px;\"></div></div>";
					panelHTML += "<div class=\"row\">";
					panelHTML += "<div id=\"ssidPassword\">";
					
					panelHTML += "<label>Input Password:</label><br>";
					panelHTML += "<input type=\"password\" id=\"password\" name=\"password\"></select>";
					panelHTML += "</div>";
					panelHTML += "</div>";
					panelHTML += "<div class=\"row\">";
					panelHTML += "<div class=\"col-xs-12\" style=\"height: 30px;\"></div>";
					panelHTML += "</div>";
					panelHTML += "</center>";
					panelHTML += "</div>";
				}else{
					panelHTML += "<div id=\"SelfMode\">";
					panelHTML += "<center>";
					panelHTML += "<div class=\"row\">";
					panelHTML += "<label id=\"CurrentESSID\"></label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
					panelHTML += "<label id=\"CurrentIPAddress\"></label>";
					panelHTML += "</div>";
					panelHTML += "<div class=\"row\">";
					panelHTML += "<div class=\"col-xs-12\" style=\"height: 20px;\"></div>";
					panelHTML += "</div>";
					panelHTML += "<div class=\"row\">";
					panelHTML += "<label class=\"RadioLabel\">Enable Host Mode</label><br>";
					panelHTML += "<input class=\"BSswitch\" id=\"EnableHostMode\" name=\"EnableHostMode\" type=\"checkbox\" data-on-text=\"Yes\" \"Enable Host Mode\"  data-off-text=\"No\" value=\"Yes\"> ";
					panelHTML += "</div>";
					panelHTML += "<div class=\"row\">";
					panelHTML += "<div class=\"col-xs-12\" style=\"height: 20px;\"></div>";
					panelHTML += "</div>";
					panelHTML += "</center>";
					panelHTML += "</div>";
				}
				
				
				panelHTML += "<input type=\"Hidden\" name=\"formName\" value=\"ReSignal\">";
				panelHTML += "<div class=\"row\"><div class=\"col-xs-12\" style=\"height: 100px;\"></div></div>";
				panelHTML += "<div class=\"row\">";
				panelHTML += "<center>";
				panelHTML += "<input class=\"btn btn-primary  btn-lg\" type=\"Submit\" onclick=\"return confirmMessage('Are you sure you want to reboot the Teleonome?')\" name=\"action\" id=\"RebootButton\" value=\"Reboot\">";
				panelHTML += "<input class=\"btn btn-primary  btn-lg\" type=\"Submit\" onclick=\"return confirmMessage('Are you sure you want to shutdown the Teleonome?')\"  name=\"action\" id=\"ShutdownButton\" value=\"Shutdown\">";
				panelHTML += "</center>";
				panelHTML += "</div>";
				panelHTML += "</form>";	
				
				if(currentIdentityMode == TELEONOME_IDENTITY_SELF){
					//
					// layout the connected clients
					//
					panelHTML += "<div class=\"row\">";
					panelHTML += "<div id=\"ConnectedClients\">";
					
					panelHTML += "<label>Connected Clients:</label><br>";
					panelHTML += "	<table id=\"ClientsTable\" class=\"table table-striped\">";
					panelHTML += "<thead>";
					panelHTML += "<tr> <th>Name</th> <th>IPAddress</th></tr>";
					panelHTML += "</thead>";
					panelHTML += "<tbody>";
					
					var connectedClients = [];//currentOperationalData["Connected Clients"];
					for(var i = 0; i < connectedClients.length; i++) {
					    var obj = connectedClients[i];
					    panelHTML += "<tr><td>" + obj.name + "</td><td>"+obj.ipaddress+"</td></tr>";
					}					
					panelHTML += "</tbody>";
					panelHTML += "</table>";
					panelHTML += "</div>";
					panelHTML += "</div>";
					
				}
				
				
				
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_ACTION_EVALUATION_REPORT){
				
				
				var sourceDataPointer = denes[0].DeneWords[0].Value;
				//var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(sourceDataPointer);
				var actionDene = getDeneByIdentityPointer(sourceDataPointer);
				var actionName = actionDene.Name;
				
				// the sourceDataPointerIdentity contains something like: @Sento:Internal:Actuators:Turn Pump On 
				// note that this points to a dene,
				var actionCodonPointer = sourceDataPointer + ":" + "Codon";
				//var actionCodonPointerIdentity = identityFactory.createIdentityByPointer(actionCodonPointer);
				var codonName = getDeneWordByIdentityPointer(actionCodonPointer, DENEWORD_VALUE_ATTRIBUTE);
				
				// we need to construct the address of the processing dene based on the convention:
				// teleonomeName:Purpose:Actuator Logic Processing:CodonName + ActionName + Processing
				var processingDataPointer = "@" + teleonomeName + ":Purpose:Actuator Logic Processing:" + codonName + " " + actionName + " Processing" 
				console.log("processingDataPointer=" + processingDataPointer);
				//
				// the dene words in this dene have fixed names so get the values directly
				var actionProcessingResultPointer = processingDataPointer + ":" + DENEWORD_ACTION_PROCESSING_RESULT;
				//var actionProcessingResultIdentity = identityFactory.createIdentityByPointer(actionProcessingResultPointer);
				var actionProcessingResult = getDeneWordByIdentityPointer(actionProcessingResultPointer, DENEWORD_VALUE_ATTRIBUTE);
				
				var actionExpressionIdentityPointer = processingDataPointer + ":" + DENEWORD_ACTION_EXPRESSION;
				//var actionExpressionIdentity = identityFactory.createIdentityByPointer(actionExpressionIdentityPointer);
				var actionExpression = getDeneWordByIdentityPointer(actionExpressionIdentityPointer, DENEWORD_VALUE_ATTRIBUTE);
				
				
				panelHTML += "<div class=\"col-lg-12 hidden-xs\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>Action Evaluation -" + actionName +"</h4></div>";
				panelHTML += "<div class=\"panel-body\">";
				panelHTML += "<h4>Result: <strong>" + actionProcessingResult +"</strong></h4>";
				panelHTML += "<h6>Expression: " + actionExpression+ "</h6><br>";
				panelHTML += "<table class=\"table table-stripped\">";
				panelHTML += "<tr><th>Condition</th><th>Result</th><th>Expression</th><th>Variables</th></tr>";
				//
				// now process the conditions data, to get this data, the logic is as follows
				// all the conditions denes are in the chain 
				//  "@" + teleonomeName + ":Purpose:Actuator Logic Processing:" + codonName + " " + actionName + " Processing" 
				//
				// and are of type Actuator Condition Processing
				// so loop over all the denes in the chain and get the type, if the type of a dene is Actuator Condition Processing
				// and the name of the dene begins with 
				var	processingDeneChainPointer = "@" + teleonomeName + ":Purpose:Actuator Logic Processing:";
				//var processingDeneChainIdentity = identityFactory.createIdentityByPointer(processingDeneChainPointer);
				var  processingDeneChain = getDeneChainByIdentityPointer(processingDeneChainPointer);
				
				var denePanelArray = processingDeneChain["Denes"];
				var processingDene;
				var processingDeneName="";
				var actuatorConditionDeneWords;
				var actuatorConditionDeneWord;
				var conditionExpression;
				var conditionName;
				var conditionResult;
				var variableData;
				var i32=0;
				var t1=false;
				var t2=false;
				var t3=false;
				for(i32=0;i32<denePanelArray.length;i32++){
					processingDene = denePanelArray[i32];
					processingDeneName = processingDene.Name;
					
					t1= processingDene.hasOwnProperty("Dene Type");
					t2= processingDene["Dene Type"]===DENE_TYPE_ACTUATOR_CONDITION_PROCESSING;
					t3=processingDeneName.startsWith(codonName + " " + actionName);
					
					if(t1 && t2 && t3){
						actuatorConditionDeneWords = processingDene["DeneWords"];
						variableData="";
						for(j2=0;j2<actuatorConditionDeneWords.length;j2++){
							actuatorConditionDeneWord = actuatorConditionDeneWords[j2];
							if(actuatorConditionDeneWord.Name ==DENEWORD_CONDITION_EXPRESSION){
								conditionExpression = actuatorConditionDeneWord.Value;
							}else if(actuatorConditionDeneWord.Name ==CONDITION_NAME){
								conditionName = actuatorConditionDeneWord.Value;
							}else if(actuatorConditionDeneWord.Name ==DENEWORD_CONDITION_PROCESSING_RESULT){
								conditionResult = actuatorConditionDeneWord.Value;
							}else if(actuatorConditionDeneWord.hasOwnProperty("DeneWord Type") && actuatorConditionDeneWord["DeneWord Type"]===DENEWORD_TYPE_EVALUATED_VARIABLE){
								variableData = variableData.concat(actuatorConditionDeneWord.Name + "=" + actuatorConditionDeneWord.Value + "<br>");
								
							}	
						}
					
						panelHTML += "<tr><th>"+conditionName +"</th><th>"+ conditionResult +"</th><th>"+conditionExpression+"</th><th>"+variableData +"</th></tr>";				
					}
				}
				
				panelHTML += "</table>";
				
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_COMPLETE_WIDTH){
				
				panelHTML += "<div class=\"col-lg-12\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";

				
				
				var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
				var object = panelPositionInPanelHashMap["_map"];
				var nameToDisplay;
				var renderedDataSourceDene;
				//console.log("about to start going ver the rpoerties, object=" + object);
				
				
				for(var property in object) {
					//
					//after every three panels 
					dataDene = object[property];   
					panelDataSourcePointer =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER, DENEWORD_VALUE_ATTRIBUTE)
					
					
					var hasVisible=deneHasDeneWordProperty(dataDene, "Visible");
					//
					// if there is no deneword, then show it
					visible=true;
					if(hasVisible){
						//
						// visible could be false, that way you could hide the value by actuator
						visible=getDeneWordAttributeByDeneWordNameFromDene(dataDene, "Visible", DENEWORD_VALUE_ATTRIBUTE);
					}
					if(visible){

						nameToDisplay =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME, DENEWORD_VALUE_ATTRIBUTE)
						console.log(" going over the rpoerties,panelDataSourcePointer=" + panelDataSourcePointer);
						renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
						var unitsText=renderedDataSourceDeneWord["Units"];
						if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

						panelHTML += "<div class=\"col-lg-2 col-md-2 col-sm-4 col-xs-4\">";
						panelHTML += "<div class=\"panel panel-default\">";
						panelHTML += "<div class=\"panel-heading\"><h6>"+nameToDisplay+"</h6></div>";
						var valueData = renderedDataSourceDeneWord["Value"];
						panelHTML += "<div class=\"panel-body text-center\">";
						if(valueData.length>10){
							panelHTML += "<h4>"+valueData +"</h4>";
						}else{
							panelHTML += "<h3>"+valueData +"</h3>";
						}

						panelHTML += "</div>";
						panelHTML += "<div class=\"panel-footer\">";
						panelHTML += "<h5>"+ unitsText  +"</h5>";
						panelHTML += "</div>";    
						panelHTML += "</div>";// closing <div class="panel panel-default">
						panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
					}// if visible

				}
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SHORT_TERM_WEATHER_FORECAST){
				panelHTML += "<div class=\"col-lg-6\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";

				var sourceDataPointer = denes[0].DeneWords[0].Value;
				
				//console.log("in complete dene sourceDataPointer=" + sourceDataPointer)
				renderedDataSourceDene = getDeneByIdentityPointer(sourceDataPointer);
				//console.log("in complete dene renderedDataSourceDene=" + renderedDataSourceDene.toString(4))
				
				var deneWordMap = getDeneWordMapByDeneWordName(renderedDataSourceDene);
				var shortTermTime, shortTermTemp,shortTermHumidity,shortTermdescription,shortTermCloudiness;
				var shortTermRain,shortTermWindSpeed, shortTermWindDirection;
				
				
				for(k2=1;k2<9;k2++){
					//
					// get all the values for each term 
					
					shortTermTime = deneWordMap.get("Short Term Forecast Period " + k2 +" TimeZoneTimestamp")["Value"];
					shortTermTemp = Math.ceil(deneWordMap.get("Short Term Forecast Period " + k2 +" Temperature")["Value"]);
					shortTermHumidity = deneWordMap.get("Short Term Forecast Period " + k2 +" Humidity")["Value"];
					shortTermdescription = deneWordMap.get("Short Term Forecast Period " + k2 +" Description")["Value"].split(" ");
					shortTermCloudiness = deneWordMap.get("Short Term Forecast Period " + k2 +" Cloudiness")["Value"];
					shortTermRain = deneWordMap.get("Short Term Forecast Period " + k2 +" Rain")["Value"];
					shortTermWindSpeed = deneWordMap.get("Short Term Forecast Period " + k2 +" Wind Speed")["Value"];
					shortTermWindDirection = deneWordMap.get("Short Term Forecast Period " + k2 +" Wind Direction")["Value"];
					
					
					panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm6 col-xs-6\">";
					panelHTML += "<div class=\"panel panel-default\">";
					panelHTML += "<div class=\"panel-heading\"><h6>"+shortTermTime+"</h6></div>";
					panelHTML += "<div class=\"panel-body text-center\">";
					panelHTML += "<h3>"+shortTermTemp +"&deg;C</h3><br><h4>"+shortTermdescription[0] +"<br>"+ shortTermdescription[1] +"</h4>";
					
					panelHTML += "</div>";
					panelHTML += "<div class=\"panel-footer\">";
					panelHTML += "<h5>Rain:"+ shortTermRain +"mm<br> Humidity:"+ shortTermHumidity+"%<br>Cloudiness:"+ shortTermCloudiness +"%<br>Wind:"+ shortTermWindSpeed +"m/s "+ shortTermWindDirection +" &deg;</h5>";
					panelHTML += "</div>";
					panelHTML += "</div>";// closing <div class="panel panel-default">
					panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
				}
				panelHTML += "</div>";    // closing row
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_DAILY_WEATHER_FORECAST){
				panelHTML += "<div class=\"col-lg-6\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";

				var sourceDataPointer = denes[0].DeneWords[0].Value;
				
				//console.log("in complete dene sourceDataPointer=" + sourceDataPointer)
				renderedDataSourceDene = getDeneByIdentityPointer(sourceDataPointer);
				//console.log("in complete dene renderedDataSourceDene=" + renderedDataSourceDene.toString(4))
				
				var deneWordMap = getDeneWordMapByDeneWordName(renderedDataSourceDene);
				var dailyTermTime, dailyTermMinTemp, dailyTermMaxTemp,dailyTermHumidity,dailyTermdescription,dailyTermCloudiness;
				var dailyTermRain,dailyTermWindSpeed, dailyTermWindDirection;
				
				
				for(k2=1;k2<5;k2++){
					//
					// get all the values for each term 
					
					dailyTermTime = deneWordMap.get("Daily Forecast Day " + k2 +" TimeZoneTimestamp")["Value"];
					dailyTermMaxTemp = Math.ceil(deneWordMap.get("Daily Forecast Day " + k2 +" Maximum Temperature")["Value"]);
					dailyTermMinTemp = Math.ceil(deneWordMap.get("Daily Forecast Day " + k2 +" Minimum Temperature")["Value"]);
					dailyTermHumidity = deneWordMap.get("Daily Forecast Day " + k2 +" Humidity")["Value"];
					dailyTermdescription = deneWordMap.get("Daily Forecast Day " + k2 +" Description")["Value"].split(" ");
					
					dailyTermCloudiness = deneWordMap.get("Daily Forecast Day " + k2 +" Cloudiness")["Value"];
					dailyTermRain = deneWordMap.get("Daily Forecast Day " + k2 +" Rain")["Value"];
					dailyTermWindSpeed = deneWordMap.get("Daily Forecast Day " + k2 +" Wind Speed")["Value"];
					dailyTermWindDirection = deneWordMap.get("Daily Forecast Day " + k2 +" Wind Direction")["Value"];
					
					
					panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm6 col-xs-6\">";
					panelHTML += "<div class=\"panel panel-default\">";
					panelHTML += "<div class=\"panel-heading\"><h6>"+dailyTermTime+"</h6></div>";
					panelHTML += "<div class=\"panel-body text-center\">";
					panelHTML += "<h4>"+dailyTermMinTemp +"&deg;C - "+dailyTermMaxTemp +"&deg;C<br>"+dailyTermdescription[0]+"<br>"+ dailyTermdescription[1] +"</h4>";
					
					panelHTML += "</div>";
					panelHTML += "<div class=\"panel-footer\">";
					panelHTML += "<h5>Rain:"+ dailyTermRain +"mm<br> Humidity:"+ dailyTermHumidity+"%<br>Cloudiness:"+ dailyTermCloudiness +"%<br>Wind:"+ dailyTermWindSpeed +"m/s "+ dailyTermWindDirection +" &deg;</h5>";
					panelHTML += "</div>";
					panelHTML += "</div>";// closing <div class="panel panel-default">
					panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
				}
				panelHTML += "</div>";    // closing row
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_DENEWORD_TABLE){
				
				var panelDeneWords = denes[0].DeneWords;
				for(var i34=0;i34<panelDeneWords.length;i34++){
					processingDeneWord = panelDeneWords[i34];
					processingDeneWordName = processingDeneWord.Name;
					if(processingDeneWordName === PANEL_TITLE){
						panelTitle = processingDeneWord.Value;
					}
				}
				var deneWordTable = new DeneWordTable();
				panelHTML += deneWordTable.process(panelTitle, denes);
				
//				panelHTML += "<div class=\"col-lg-6\">";
//				panelHTML += "<div class=\"bs-component\">";
//				panelHTML += "<div class=\"panel panel-default\">";
//				//panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
//				panelHTML += " <div class=\"panel-heading\"><h4>"+panelTitle+"</h4></div>";
//				panelHTML += "<div class=\"panel-body text-center\">";
//				panelHTML += "<div class=\"row\">";
//				panelHTML += "<table class=\"table table-stripped text-center\"><tbody>";
//				
//				//
//				// the denechain that has this  panel  style always has two denes, one that describes the panel 
//				// and one that has the denewords that will go into the table.  Because of that, all we need to do
//				// to discover the dene that has the denewords is to pass  each dene to the function below
//				var dene;
//				var deneWordRows;
//				var deneWordRowPointer;
//				var renderedDeneWordRow;
//				for(k2=0;k2<denes.length;k2++){
//					dene = denes[k2];
//					deneWordRows = getAllDeneWordAttributeByDeneWordTypeFromDene(dene,DENEWORD_TYPE_DISPLAY_TABLE_DENEWORD_POINTER,DENEWORD_VALUE_ATTRIBUTE);				panelHTML += "<table class=\"table table-stripped\">";
//					if(deneWordRows.length>0){
//						
//						for(var l2=0; l2<deneWordRows.length;l2++) {
//							deneWordRowPointer = deneWordRows[l2];
//							renderedDeneWordRow = getDeneWordByIdentityPointer(deneWordRowPointer, COMPLETE);
//							console.log("deneWordRowPointer=" + deneWordRowPointer +  " renderedDeneWordRow=" + renderedDeneWordRow)
//							panelHTML += "<tr><td>"+ renderedDeneWordRow.Name +"</td><td>" + renderedDeneWordRow.Value +"</td></tr>";
//						}
//					}
//				}
//							
//				panelHTML += "</tbody></table>";
//				panelHTML += "</div>";    // closing row
				
				
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL){
				
				panelHTML += "<div class=\"col-lg-6\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";

				
				
				var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
				var object = panelPositionInPanelHashMap["_map"];
				var nameToDisplay;
				var renderedDataSourceDene;
				//console.log("about to start going ver the rpoerties, object=" + object);
				
				for(var property in object) {
					//
					//after every three panels 
					dataDene = object[property];
					if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===deneWordType){
						panelDataSourcePointer = deneWord["Value"];
					}
					
					
					var hasVisible=deneHasDeneWordProperty(dataDene, "Visible");
					//
					// if there is no deneword, then show it
					visible=true;
					if(hasVisible){
						//
						// visible could be false, that way you could hide the value by actuator
						visible=getDeneWordAttributeByDeneWordNameFromDene(dataDene, "Visible", DENEWORD_VALUE_ATTRIBUTE);
					}
					if(visible){
						panelDataSourcePointer =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER, DENEWORD_VALUE_ATTRIBUTE);
						nameToDisplay =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME, DENEWORD_VALUE_ATTRIBUTE);
						renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
						var unitsText=renderedDataSourceDeneWord["Units"];
						if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

						panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm4 col-xs-4\">";
						panelHTML += "<div class=\"panel panel-default\">";
						panelHTML += "<div class=\"panel-heading\"><h6>"+nameToDisplay+"</h6></div>";
						var valueData = renderedDataSourceDeneWord["Value"];
						panelHTML += "<div class=\"panel-body text-center\">";
						if(valueData.length>10){
							panelHTML += "<h4>"+valueData +"</h4>";
						}else{
							panelHTML += "<h3>"+valueData +"</h3>";
						}

						panelHTML += "</div>";
						panelHTML += "<div class=\"panel-footer\">";
						panelHTML += "<h5>"+ unitsText  +"</h5>";
						panelHTML += "</div>";    
						panelHTML += "</div>";// closing <div class="panel panel-default">
						panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
					}
					
				} //if(visible)
				panelHTML += "</div>";    // closing row
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_COMPLETE_DENE_STYLE_SINGLE_VALUE_PANEL){
				panelHTML += "<div class=\"col-lg-6\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";

				//
				// if we are here, then the Panel Dene Chain only has one dene
				//  in the case of PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL
				// every dene in the chain represents one value like the Humidity
				// and the pointer points to a specific deneword
				// in this case there is only one dene, and the pointer points to a dene
				// rather than a deneword.  this is so that for example  you are in the sunflower
				// and the sunflower  have some external data in purpose, then you would paint the entire
				// external data dene (ie singlower:purpose:external data:Ra) onto a panel,
				// in this case the for loop for(var property in object) { only iterates once
				// which brings us here.  its in here where we will take the pointer and get a dene
				// and then get the denewords for that dene and iterate over those
				// the variable denes[0] contains something like:

//				{
//				"Denes": [{
//				"Type": "Reporting",
//				"DeneWords": [{
//				"Required": "true",
//				"DeneWord Type": "Panel Data Source Pointer",
//				"Value": "@Sunflower:Purpose:External Data:Ra",
//				"Name": "Ambient Temperature",
//				"Value Type": "Dene Pointer"
//				}],
//				"Name": "Dene Data Source"
//				}],
//				"Name": "Ra"
//				}

//

				var sourceDataPointer = denes[0].DeneWords[0].Value;

				//console.log("in complete dene sourceDataPointer=" + sourceDataPointer)
				renderedDataSourceDene = getDeneByIdentityPointer(sourceDataPointer);
				//console.log("in complete dene renderedDataSourceDene=" + renderedDataSourceDene.toString(4))
				deneWords = renderedDataSourceDene.DeneWords;
				for(k2=0;k2<deneWords.length;k2++){
					deneWord = deneWords[k2];
					////console.log("in complete dene deneWord=" + deneWord.toString(4))
					var unitsText=deneWord["Units"];
					if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

					nameToDisplay = deneWord["Name"];
					nameToDisplay = deneWord["Name"].trim().replace( /([A-Z])/g, ' $1' );
					if(nameToDisplay.length>14){
						nameToDisplay="<span style=\"font-size:1em;\">"+nameToDisplay+"</span>"
					}
					//
					// nw see if you can break them into space
//					var words=nameToDisplay.split(" ");
//					if(words.length>1){
//						//
//						// there are more than one word
//						// make sure that each word does not have more than 7
//						nameToDisplay="";
//						var l8=0;
//						for( l8=0;l8<words.length;l8++){
//							if(words[l8]<9)nameToDisplay+=words[l8];
//							else nameToDisplay+=words[l8].substring(0,9);
//							nameToDisplay+=" ";
//						}
//
//					}
					panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm3 col-xs-4\">";
					panelHTML += "<div class=\"panel panel-default\">";
					panelHTML += "<div class=\"panel-heading\"><h6>"+nameToDisplay+"</h6></div>";
					panelHTML += "<div class=\"panel-body text-center\">";
					var valueData = deneWord["Value"];
					if(valueData.length>10){
						panelHTML += "<h4>"+valueData +"</h4>";
					}else{
						panelHTML += "<h3>"+valueData +"</h3>";
					}
					panelHTML += "</div>";
					panelHTML += "<div class=\"panel-footer\">";
					panelHTML += "<h5>"+ unitsText  +"</h5>";
					panelHTML += "</div>";
					panelHTML += "</div>";// closing <div class="panel panel-default">
					panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
				}
				panelHTML += "</div>";    // closing row
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_WELL_SINGLE_VALUE_PANEL){
				
				var sourceDataPointer = denes[0].DeneWords[0].Value;
				//var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(sourceDataPointer);
				var valueToDisplay = getDeneWordByIdentityPointer(sourceDataPointer, DENEWORD_VALUE_ATTRIBUTE);
				var nameToDisplay = getDeneWordByIdentityPointer(sourceDataPointer, DENEWORD_NAME_ATTRIBUTE);
				panelHTML += "<div class=\"col-lg-12\">";
				panelHTML += "<div  class=\"well well-sm\">";
				panelHTML += "<h5>"+nameToDisplay+":<strong>"+valueToDisplay +"</strong></h5>";
				panelHTML += "</div>";
				panelHTML += "</div>";
				
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_TIMESTAMP){
				var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(panelExternalTimestampDataSourcePointer);

				
				//
			    // 2)statusMessage - A string description of the status
				var dataTimestampPointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +DENEWORD_RECORD_TIMESTAMP;
				//console.log("statusMessagePointer=" + statusMessagePointer);
				var dataTimestamp = getDeneWordByIdentityPointer(dataTimestampPointer, DENEWORD_VALUE_ATTRIBUTE);
				//console.log("statusMessage=" + statusMessage);
				
				panelHTML += "<div class=\"col-lg-6\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading row\">";
				
				panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm-4 col-xs-4\">";
				panelHTML += "<h4>" + panelDeneChain["Name"] + "</h4>"; 
				panelHTML +="</div>";// close col lg-4
				
				panelHTML += "<div class=\"col-lg-8 col-md-8 col-sm-8 col-xs-8\">";
				panelHTML += "<h4>" + dataTimestamp+ "</h4>"; 
				panelHTML +="</div>";// close col lg-4
				panelHTML +="</div>"
				
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";

				
				
				var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
				var object = panelPositionInPanelHashMap["_map"];
				var nameToDisplay;
				var renderedDataSourceDene;
				//console.log("about to start going ver the rpoerties, object=" + object);
				
				
				for(var property in object) {
					//
					//after every three panels 
					dataDene = object[property];   
					panelDataSourcePointer =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER, DENEWORD_VALUE_ATTRIBUTE)
					
					//
					// dont render the timestamp again
					//
					if(dataTimestampPointer!=panelDataSourcePointer){
						nameToDisplay =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME, DENEWORD_VALUE_ATTRIBUTE)
						//console.log(" going over the rpoerties,panelDataSourcePointer=" + panelDataSourcePointer);
						renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
						if(nameToDisplay.startsWith("@")){
							//
							// this is a pointer, so render it
							nameToDisplay = getDeneWordByIdentityPointer(nameToDisplay, DENEWORD_VALUE_ATTRIBUTE);
						}
						
						var unitsText=renderedDataSourceDeneWord["Units"];
						if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

						panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm-4 col-xs-4\">";
						panelHTML += "<div class=\"panel panel-default\">";
						panelHTML += "<div class=\"panel-heading\"><h6>"+nameToDisplay+"</h6></div>";
						var valueData = renderedDataSourceDeneWord["Value"];
						panelHTML += "<div class=\"panel-body text-center\">";
						if(valueData.length>10){
							panelHTML += "<h4>"+valueData +"</h4>";
						}else{
							panelHTML += "<h3>"+valueData +"</h3>";
						}

						panelHTML += "</div>";
						panelHTML += "<div class=\"panel-footer\">";
						panelHTML += "<h5>"+ unitsText  +"</h5>";
						panelHTML += "</div>";    
						panelHTML += "</div>";// closing <div class="panel panel-default">
						panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
					}
				}
				panelHTML += "</div>";    // closing row
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_DATA){
				var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(panelExternalDataSourcePointer);

				var externalDataStatusPointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +EXTERNAL_DATA_STATUS;
				//console.log("externalDataStatusPointer=" + externalDataStatusPointer);
				var externalDataStatus = getDeneWordByIdentityPointer(externalDataStatusPointer, DENEWORD_VALUE_ATTRIBUTE);
			//	console.log("externalDataStatus=" + externalDataStatus);

				//
			    // 2)statusMessage - A string description of the status
				var statusMessagePointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +DENEWORD_STATUS;
				//console.log("statusMessagePointer=" + statusMessagePointer);
				var statusMessage = getDeneWordByIdentityPointer(statusMessagePointer, DENEWORD_VALUE_ATTRIBUTE);
				//console.log("statusMessage=" + statusMessage);
				
				panelHTML += "<div class=\"col-lg-6\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading row\">";
				
				panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm-4 col-xs-4\">";
				panelHTML += "<h4>" + panelDeneChain["Name"] + "</h4>"; 
				panelHTML +="</div>";// close col lg-4
				
				panelHTML += "<div class=\"col-lg-5 col-md-5 col-sm-5 col-xs-5\">";
				panelHTML += "<h4>" + statusMessage+ "</h4>"; 
				panelHTML +="</div>";// close col lg-4
				
				panelHTML += "<div class=\"col-lg-3 col-md-3 col-sm-3 col-xs-3\">";	
				panelHTML +="<h3   class=\"label label-lg label-"+ externalDataStatus +"\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h3>";
				panelHTML +="</div>";// close col lg-4
				panelHTML +="</div>";
				
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";

				
				
				var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
				var object = panelPositionInPanelHashMap["_map"];
				var nameToDisplay;
				var renderedDataSourceDene;
				//console.log("about to start going ver the rpoerties, object=" + object);
				
				
				for(var property in object) {
					//
					//after every three panels 
					dataDene = object[property];   
					panelDataSourcePointer =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER, DENEWORD_VALUE_ATTRIBUTE)
					nameToDisplay =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME, DENEWORD_VALUE_ATTRIBUTE)
					//console.log(" going over the rpoerties,panelDataSourcePointer=" + panelDataSourcePointer);
					renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
					if(nameToDisplay.startsWith("@")){
						//
						// this is a pointer, so render it
						nameToDisplay = getDeneWordByIdentityPointer(nameToDisplay, DENEWORD_VALUE_ATTRIBUTE);
					}
					
					var unitsText=renderedDataSourceDeneWord["Units"];
					if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

					panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm-4 col-xs-4\">";
					panelHTML += "<div class=\"panel panel-default\">";
					panelHTML += "<div class=\"panel-heading\"><h6>"+nameToDisplay+"</h6></div>";
					var valueData = renderedDataSourceDeneWord["Value"];
					panelHTML += "<div class=\"panel-body text-center\">";
					if(valueData.length>10){
						panelHTML += "<h4>"+valueData +"</h4>";
					}else{
						panelHTML += "<h3>"+valueData +"</h3>";
					}

					panelHTML += "</div>";
					panelHTML += "<div class=\"panel-footer\">";
					panelHTML += "<h5>"+ unitsText  +"</h5>";
					panelHTML += "</div>";    
					panelHTML += "</div>";// closing <div class="panel panel-default">
					panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
				}
				panelHTML += "</div>";    // closing row
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_COMPLETE_WIDTH_EXTERNAL_DATA){
				
				var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(panelExternalDataSourcePointer);
				
				
				var externalDataStatusPointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +EXTERNAL_DATA_STATUS;
				//console.log("externalDataStatusPointer=" + externalDataStatusPointer);
				var externalDataStatus = getDeneWordByIdentityPointer(externalDataStatusPointer, DENEWORD_VALUE_ATTRIBUTE);
			//	console.log("externalDataStatus=" + externalDataStatus);

				//
			    // 2)statusMessage - A string description of the status
				var statusMessagePointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +DENEWORD_STATUS;
				//console.log("statusMessagePointer=" + statusMessagePointer);
				var statusMessage = getDeneWordByIdentityPointer(statusMessagePointer, DENEWORD_VALUE_ATTRIBUTE);
				//console.log("statusMessage=" + statusMessage);
				
				panelHTML += "<div class=\"col-lg-12\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading row\">";
				
				panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm-4 col-xs-4\">";
				panelHTML += "<h4>" + panelDeneChain["Name"] + "</h4>"; 
				panelHTML +="</div>";// close col lg-4
				
				panelHTML += "<div class=\"col-lg-5 col-md-5 col-sm-5 col-xs-5\">";
				panelHTML += "<h4>" + statusMessage+ "</h4>"; 
				panelHTML +="</div>";// close col lg-4
				
				panelHTML += "<div class=\"col-lg-3 col-md-3 col-sm-3 col-xs-3\">";	
				panelHTML +="<h3   class=\"label label-lg label-"+ externalDataStatus +"\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h3>";
				panelHTML +="</div>";// close col lg-4
				panelHTML +="</div>";
				
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";

				
				
				var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
				var object = panelPositionInPanelHashMap["_map"];
				var nameToDisplay;
				var renderedDataSourceDene;
				//console.log("about to start going ver the rpoerties, object=" + object);
				
				
				for(var property in object) {
					//
					//after every three panels 
					dataDene = object[property];   
					panelDataSourcePointer =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER, DENEWORD_VALUE_ATTRIBUTE)
					nameToDisplay =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME, DENEWORD_VALUE_ATTRIBUTE)
					//console.log(" going over the rpoerties,panelDataSourcePointer=" + panelDataSourcePointer);
					renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
					if(nameToDisplay.startsWith("@")){
						//
						// this is a pointer, so render it
						nameToDisplay = getDeneWordByIdentityPointer(nameToDisplay, DENEWORD_VALUE_ATTRIBUTE);
					}
					
					var unitsText=renderedDataSourceDeneWord["Units"];
					if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

					panelHTML += "<div class=\"col-lg-2 col-md-2 col-sm-4 col-xs-4\">";
					panelHTML += "<div class=\"panel panel-default\">";
					panelHTML += "<div class=\"panel-heading\"><h6>"+nameToDisplay+"</h6></div>";
					var valueData = renderedDataSourceDeneWord["Value"];
					panelHTML += "<div class=\"panel-body text-center\">";
					if(valueData.length>10){
						panelHTML += "<h4>"+valueData +"</h4>";
					}else{
						panelHTML += "<h3>"+valueData +"</h3>";
					}

					panelHTML += "</div>";
					panelHTML += "<div class=\"panel-footer\">";
					panelHTML += "<h5>"+ unitsText  +"</h5>";
					panelHTML += "</div>";    
					panelHTML += "</div>";// closing <div class="panel panel-default">
					panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
				}
				panelHTML += "</div>";    // closing row
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_COMPLETE_DENE_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_DATA){
			
				
				var sourceDataPointer = denes[0].DeneWords[0].Value;
				var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(sourceDataPointer);

	
				
				//
				// the logic here is the same as in the PANEL_VISUALIZATION_COMPLETE_DENE_STYLE_SINGLE_VALUE_PANEL
				//
				// the nly difference is that since we know is a dene from external data, there  are two variables
				// that are used to display status, so dont paint them as data but out it in the title
				// the two variables are:
				//
				// 1)externalDataStatusPointer- this variable has a bootstrap level value like warning or danger or success
				// that signify that the pacemaker processed all the denewords of this external source and everything was ok
				//
				var externalDataStatusPointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +EXTERNAL_DATA_STATUS;
				//console.log("externalDataStatusPointer=" + externalDataStatusPointer);
				var externalDataStatus = getDeneWordByIdentityPointer(externalDataStatusPointer, DENEWORD_VALUE_ATTRIBUTE);
				//console.log("externalDataStatus=" + externalDataStatus);

				//
			    // 2)statusMessage - A string description of the status
				var statusMessagePointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +DENEWORD_STATUS;
			//	console.log("statusMessagePointer=" + statusMessagePointer);
				var statusMessage = getDeneWordByIdentityPointer(statusMessagePointer, DENEWORD_VALUE_ATTRIBUTE);
			//	console.log("statusMessage=" + statusMessage);

				panelHTML += "<div class=\"col-lg-6\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading row\">"
					
				
				panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm-4 col-xs-4\">";
				panelHTML += "<h4>" + panelDeneChain["Name"] + "</h4>"; 
				panelHTML +="</div>";// close col lg-4
				
				panelHTML += "<div class=\"col-lg-5 col-md-5 col-sm-5 col-xs-5\">";
				panelHTML += "<h4>" + statusMessage+ "</h4>"; 
				panelHTML +="</div>";// close col lg-4
				
				panelHTML += "<div class=\"col-lg-3 col-md-3 col-sm-3 col-xs-3\">";	
				panelHTML +="<h3   class=\"label label-lg label-"+ externalDataStatus +"\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h3>";
				panelHTML +="</div>";// close col lg-4
				
				
				
				panelHTML +="</div>";
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";

				
				
				

				//console.log("in complete dene sourceDataPointer=" + sourceDataPointer)
				renderedDataSourceDene = getDeneByIdentityPointer(sourceDataPointer);
				//console.log("in complete dene renderedDataSourceDene=" + renderedDataSourceDene.toString(4))
				deneWords = renderedDataSourceDene.DeneWords;
				for(k2=0;k2<deneWords.length;k2++){
					deneWord = deneWords[k2];
					if(deneWord.Name === EXTERNAL_DATA_STATUS || deneWord.Name===DENEWORD_STATUS){continue;}
					////console.log("in complete dene deneWord=" + deneWord.toString(4))
					var unitsText=deneWord["Units"];
					if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

					// set the name to replace camel case with spaces
					nameToDisplay = deneWord["Name"].trim().replace( /([A-Z])/g, ' $1' );
					if(nameToDisplay.length>14){
						nameToDisplay="<span style=\"font-size:1em;\">"+nameToDisplay+"</span>"
					}
					
					
					//
					// nw see if you can break them into space
//					var words=nameToDisplay.split(" ");
//					if(words.length>1){
//						//
//						// there are more than one word
//						// make sure that each word does not have more than 7
//						nameToDisplay="";
//						var l2=0;
//						for( l2=0;l2<words.length;l2++){
//							if(words[l2]<7)nameToDisplay+=words[l2];
//							else nameToDisplay+=words[l2].substring(0,7);
//							nameToDisplay+=" ";
//						}
//
//					}
					panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm3 col-xs-4\">";
					panelHTML += "<div class=\"panel panel-default\">";
					panelHTML += "<div class=\"panel-heading\"><h6>" + nameToDisplay +"</h6></div>";
					panelHTML += "<div class=\"panel-body text-center\">";
					var valueData = deneWord["Value"];
					if(valueData.length>10){
						panelHTML += "<h4>"+valueData +"</h4>";
					}else{
						panelHTML += "<h3>"+valueData +"</h3>";
					}
					panelHTML += "</div>";
					panelHTML += "<div class=\"panel-footer\">";
					panelHTML += "<h5>"+ unitsText  +"</h5>";
					panelHTML += "</div>";
					panelHTML += "</div>";// closing <div class="panel panel-default">
					panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
				}
				panelHTML += "</div>";    // closing row
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_LINE_CHART ||
					mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_CSV_MULTI_LINE_CHART||
					mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_PIE_CHART
					){
				//
				// decide what type of chart
				// and invoke the function
				
				panelHTML += "<div class=\"col-lg-6\">";   
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
				panelHTML += "<div class=\"panel-body text-center\">";
				panelHTML += "<div class=\"row\">";
				var id = "Chart" + panelCounter;
				panelHTML += "<div id=\""+ id +"\" class=\"col-lg-12 col-md-12 col-sm12 col-xs-12\">";
				panelHTML += "</div>";
				panelHTML += "</div>";
				
				var panelDataSourcePointer = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER);
				renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
				
		
				console.log("before rendering chart");
				chartDataSourcePointerHashMap.put(id,renderedDataSourceDeneWord);
				chartStyleHashMap.put(id,mainPanelVisualStyle);
			}else if(mainPanelVisualStyle == PANEL_VISUALIZATION_STYLE_IMAGE){
				
				var sourceDataPointer = denes[0].DeneWords[0].Value;
				var imageFileName = getDeneWordByIdentityPointer(sourceDataPointer, DENEWORD_VALUE_ATTRIBUTE);
				
				panelHTML += "<div class=\"col-lg-12\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>Status</h4></div>";
				panelHTML += "<div class=\"panel-body\">";
				panelHTML += "<img class=\"img-responsive\" src=\"images/"+imageFileName+"\" >";
				
				
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MNEMOSYNE_TABLE){
			
				//
				// the info for this panel is stored in a denechain that contains one dene, that dene
				// has the following denewords
				//
				var processingDeneWord;
				var processingDeneWordName;

				var panelDeneWords = denes[0].DeneWords;
				var i34=0;
				var sortingOrder="Descending";
				var dataSourcePointer="";
				var tDClassInfo="";
				var columnDefinitionPointer;
				var columnDefinitionDene;
				var sortingParameter;
				var columnDefinitions=[];
				var panelTitle="";
				var columnInTablePosition;
				var columnHeader;
				var k6;
				var denewWords;
				var deneWord;
				var columnDefinitionHeaderDenesHashMap = new HashMap();
				var columnDefinitionDataSourcePointerHashMap = new HashMap();
				var columnDefinitionTDClassInfoHashMap = new HashMap();
				
				var columnDefinitionDenesHashMap = new HashMap();
				for(i34=0;i34<panelDeneWords.length;i34++){
					processingDeneWord = panelDeneWords[i34];
					processingDeneWordName = processingDeneWord.Name;
					if(processingDeneWordName === SORTING_ORDER){
						sortingOrder = processingDeneWord.Value;
					}else if(processingDeneWordName === SORTING_PARAMETER){
						sortingParameter = processingDeneWord.Value;
					}else if(processingDeneWordName === PANEL_TITLE){
						panelTitle = processingDeneWord.Value;
					}else{
						if(processingDeneWord.hasOwnProperty(DENEWORD_DENEWORD_TYPE_ATTRIBUTE)){
							if(processingDeneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER){
								dataSourcePointer=processingDeneWord.Value;
							}else if(processingDeneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_DISPLAY_TABLE_COLUMN_DEFINITION_POINTER){
								columnDefinitionPointer=processingDeneWord.Value;
								columnDefinitionDene = getDeneByIdentityPointer(columnDefinitionPointer);
								deneWords = columnDefinitionDene["DeneWords"];
								columnInTablePosition=-1;
								
								for(k6=0;k6<deneWords.length;k6++){
									deneWord = deneWords[k6];
									if(deneWord.hasOwnProperty(DENEWORD_DENEWORD_TYPE_ATTRIBUTE) && deneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_TYPE_COLUMN_IN_TABLE_POSITION){
										columnInTablePosition = deneWord["Value"];
									}else if(deneWord.hasOwnProperty(DENEWORD_DENEWORD_TYPE_ATTRIBUTE) && deneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_TYPE_COLUMN_HEADER){
										columnHeader = deneWord["Value"];
									}else if(deneWord.hasOwnProperty(DENEWORD_DENEWORD_TYPE_ATTRIBUTE) && deneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_TYPE_COLUMN_DATA_SOURCE_POINTER){
										dataSourcePointer = deneWord["Value"];
									}else if(deneWord.hasOwnProperty(DENEWORD_DENEWORD_TYPE_ATTRIBUTE) && deneWord[DENEWORD_DENEWORD_TYPE_ATTRIBUTE]===DENEWORD_TYPE_COLUMN_TD_CLASS_INFO){
										tDClassInfo  = deneWord["Value"];
									}
								}
								
								if(columnInTablePosition!=-1 ){
									columnDefinitionHeaderDenesHashMap.put(columnInTablePosition,columnHeader);
									columnDefinitionDataSourcePointerHashMap.put(columnInTablePosition,dataSourcePointer);
									columnDefinitionTDClassInfoHashMap.put(columnInTablePosition,tDClassInfo);
								}
								
							}
						}
					}
				}
				
								
				//
				// sortedColumnDefinitionDenesHashMap is an array that will contain the information for every column in the table
				// the dene looks like:
//				 {
//                     "DeneWords": [
//                     {
//                         "Required": "true",
//                         "DeneWord Type": "Column Data Source Pointer",
//                         "Value": "@Sento:Mnemosyine:Mnemosyne Today:Run Completed:Last Run Pump Start Time",
//                         "Name": "Turn Pump Off",
//                         "Value Type": "Dene Pointer"
//                     },
//                     {
//                         "Required": "true",
//                         "Value": 1,
//                         "Name": "Column Position",
//                         "Value Type": "int"
//                     },
//                     {
//                         "Required": "true",
//                         "Value": "Start",
//                         "Name": "Column Header",
//                         "Value Type": "String"
//                     },
//					   {
//              			"Required": "true",
//                          "Value": "visible-md visible-lg",
//                          "Name": "TDClassInfo",
//                          "Value Type": "String"
//                     }
				
				
				
//						],
//                     "Name": "Today Pumping History Col 1"
//                  }
				
				
				
	
				
				panelHTML += "<div class=\"col-lg-12\">";
				panelHTML += "<div class=\"bs-component\">";
				panelHTML += "<div class=\"panel panel-default\">";
				panelHTML += " <div class=\"panel-heading\"><h4>" + panelTitle +"</h4></div>";
				panelHTML += "<div class=\"panel-body\">";
				panelHTML += "<table class=\"table table-stripped\">";
				var sortedColumnDefinitionHeaderDenesHashMap= sortHashMap(columnDefinitionHeaderDenesHashMap);
				var sortedColumnDefinitionDataSourcePointerHashMap= sortHashMap(columnDefinitionDataSourcePointerHashMap);
				var sortedColumnDefinitionTDClassInfoHashMap= sortHashMap(columnDefinitionTDClassInfoHashMap);
				
				var object2 = sortedColumnDefinitionHeaderDenesHashMap["_map"];
				var sortedColumnDefinitionTDClassInfoMap = sortedColumnDefinitionTDClassInfoHashMap["_map"];
				
				panelHTML += "<tr>";
				for(var property in object2) {
					panelHTML += "<th class=\"text-center  "+ sortedColumnDefinitionTDClassInfoMap[property] +" \">"+ object2[property]+"</th>";
				}
				panelHTML += "</tr><tbody>";
				//
				// at this point we know the source of data, and how it is expected to be sorted
				// first get the data
				var mnemosyneDataSortedArray = getMnemosyneTableData(dataSourcePointer, sortingParameter, sortingOrder);
				
				var mnemosyneDataSortedArrayMap = mnemosyneDataSortedArray["_map"];
				var dataDene;
				var dataDeneWords;
				var dataDeneWord;
				var columnDefinitionDataSourcePointer;
				for(var property in mnemosyneDataSortedArrayMap) {
					//
					//after every three panels 
					dataDene = mnemosyneDataSortedArrayMap[property];   
					dataDeneWords = dataDene.DeneWords;
					//
					// now get the column data sorce pointer in the right order
					 object2 = sortedColumnDefinitionDataSourcePointerHashMap["_map"];
					panelHTML += "<tr>";
					for(var property in object2) {
						columnDefinitionDataSourcePointer = object2[property]; 
						tDClassInfo=sortedColumnDefinitionTDClassInfoMap[property];
						//
						// from here we just want the deneword part of the pointer, because it is the same to the name of the denewrd where the data is
						//
						var identity = identityFactory.createIdentityByPointer(columnDefinitionDataSourcePointer);
						for(k6=0;k6<dataDeneWords.length;k6++){
							dataDeneWord = dataDeneWords[k6];
							if(dataDeneWord.Name===identity.deneWordName){
								panelHTML += "<td class=\"text-center "+ tDClassInfo +" \">"+ dataDeneWord.Value+"</td>";
							}
						}
					}
					panelHTML += "</tr>";
					
				}
				
				panelHTML += "</tbody></table>";
				
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_UPDATE_MULTIPLE_DENEWORDS_FORM){
	
//				panelHTML += "<div class=\"col-lg-12 col-xs-12\">";
//				panelHTML += "<div class=\"bs-component\">";
//				panelHTML += "<div class=\"panel panel-default\">";
//				panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
//				panelHTML += "<div class=\"panel-body\">";
//				
				
//				var prettyNamesList = getFormPrettyNameOrdered(panelDeneChain);
//				var prettyNamesListObject = prettyNamesList["_map"];
//				var prettyNameListCounter=0;
//				var prettyName;
//				var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
//				var object = panelPositionInPanelHashMap["_map"];
//				var nameToDisplay;
//				var renderedDataSourceDene;
//				//console.log("about to start going ver the rpoerties, object=" + object);
//
//				for(var property in object) {
//					//
//					//after every three panels 
//					dataDene = object[property];   
//					panelDataSourcePointer =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER, DENEWORD_VALUE_ATTRIBUTE)
//					nameToDisplay =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME, DENEWORD_VALUE_ATTRIBUTE)
//					
//					//panelDataSourcePointer = object[property];    
//					//console.log(" going over the rpoerties,panelDataSourcePointer=" + panelDataSourcePointer);
//					
//					prettyName = prettyNamesList[prettyNameListCounter];
//					prettyNameListCounter++;
//					
//					renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
//					nameToDisplay = renderedDataSourceDeneWord["Name"];
//					
//					var unitsText=renderedDataSourceDeneWord["Units"];
//					var valueData = renderedDataSourceDeneWord["Value"];
//					var valueType = renderedDataSourceDeneWord["Value Type"];
//					var fieldType	="";
//					var minValueText="";
//					var maxValueText="";
//					panelHTML += "<form class=\"form-inline\" id=\"" + nameToDisplay + "UpdateForm\">";
//					panelHTML += "<div class=\"form-group\">";
//				
//					if(valueType==="int" || valueType==="double"){
//						fieldType="number";
//						
//						if(renderedDataSourceDeneWord.hasOwnProperty("Maximum")){
//							maxValueText = "max=\""+ renderedDataSourceDeneWord["Maximum"] + "\"";
//						}
//						if(renderedDataSourceDeneWord.hasOwnProperty("Minimum")){
//							minValueText = "min=\""+ renderedDataSourceDeneWord["Minimum"] + "\"";
//						}
//						
//						panelHTML += "<label class=\"control-label\"  for=\""+ nameToDisplay +"\"><h5><span id=\""+ nameToDisplay+"Label\">"+ prettyName +"&nbsp;("+ valueData +" " + unitsText +") &nbsp;&nbsp;</span></h5></label>";
//						panelHTML += "<input style=\"font-size:20px;\" class=\"form-control\" type=\""+ fieldType +"\" "+ maxValueText +" "+ minValueText +" id=\""+ nameToDisplay +"\" placeholder=\"\" value=\""+ valueData +"\"  required>";
//						
//					}else if(valueType==="boolean" ){
//						
//						panelHTML += "<label  for=\""+ nameToDisplay +"\"><h5><span id=\""+ nameToDisplay+"Label\">"+ prettyName +"&nbsp;&nbsp;</span></h5></label>";
//						panelHTML += "<div class=\"input-group\">";
//						panelHTML += "<div id=\""+ nameToDisplay +"\" class=\"btn-group\">";
//						panelHTML += "<a class=\"btn btn-primary btn-sm active\" id=\""+ nameToDisplay +"_true\" data-toggle=\""+nameToDisplay+"\" data-title=\"Y\">YES</a>";
//						panelHTML += "<a class=\"btn btn-primary btn-sm notActive\" id=\""+nameToDisplay+"_false\" data-toggle=\""+nameToDisplay+"\" data-title=\"N\">NO</a>";
//						panelHTML += "</div>";
//						panelHTML += "<input style=\"font-size:20px;\" type=\"hidden\" name=\""+ nameToDisplay+"\" id=\""+ nameToDisplay +"\">";
//						panelHTML += "</div>"
//					}
//					
//				panelHTML += "</div>";
//					panelHTML += "<div class=\"form-group\"> ";
//					panelHTML += "<button type=\"submit\" data-form='{\"field\":\"" + nameToDisplay + "\", \"identity\":\""+panelDataSourcePointer+"\"}'class=\"btn btn-primary col-sm-offset-5\">Submit</button>";
//					panelHTML += "</div>";		
//					panelHTML += "</form>";	
//
//					
//				}
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_PATHOLOGY){
				var	pathologyDeneChainPointer = "@" + teleonomeName + ":Purpose:Pathology:";
				var  pathologyDeneChain = getDeneChainByIdentityPointer(pathologyDeneChainPointer);
				//
				// get the pointer to where the exogenous events are stored
				// these exogenous events are problems related to network, ie i am supposed to be
				// part of an organism but could not find the network so i switched to
				// host mode
				//
				var identitySwitchDeneChainPointer = "@" + teleonomeName +":Internal:Descriptive:Identity Switch Control Parameters:Identity Switch Events Mnemosyne Destination";
				var allExogenousMethamorphosisEvents = getMnemosyneExogenousEventsByPointer(identitySwitchDeneChainPointer, DENE_TYPE_EXOGENUS_METAMORPHOSIS_EVENT);
				var mnemosynePathologyDenes  = getMnemosynePathologyDenes();
				
				
				var denePanelArray = pathologyDeneChain["Denes"];
				var processingDene;
				var deneName="";
				var deneWords;
				var actuatorConditionDeneWord;
				var conditionExpression;
				var pathologyCause;
				var pathologyLocation;
				var conditionResult;
				var variableData;
				var i32=0;
				var j2=0;
				
				if(denePanelArray.length>0 || mnemosynePathologyDenes.length>0 || allExogenousMethamorphosisEvents.length>0){
					panelHTML += "<div class=\"col-lg-12\">";
					panelHTML += "<div class=\"bs-component\">";
					panelHTML += "<div class=\"panel panel-default\">";
					panelHTML += " <div class=\"panel-heading\"><h4>Pathology</h4></div>";
					panelHTML += "<div class=\"panel-body\">";
					panelHTML += "<h4></h4>";
					panelHTML += "<h6></h6><br>";
					panelHTML += "<table class=\"table table-stripped\">";
					panelHTML += "<tr><th>Type</th><th>Location</th><th>Cause</th><th>Details</th></tr>";
					
					if(denePanelArray.length){
						for(i32=0;i32<denePanelArray.length;i32++){
							processingDene = denePanelArray[i32];
							processingDeneName = processingDene.Name;
							deneWords = processingDene["DeneWords"];
							variableData="";
							for(j2=0;j2<deneWords.length;j2++){
								deneWord = deneWords[j2];
								if(deneWord.Name ==PATHOLOGY_CAUSE){
									pathologyCause = deneWord.Value;
								}else if(deneWord.Name ==PATHOLOGY_LOCATION){
									pathologyLocation = deneWord.Value;
								}else {
									variableData = variableData.concat(deneWord.Name + "=" + deneWord.Value + "<br>");		
									
								}	
							}
							panelHTML += "<tr><td>"+processingDeneName +"</td><td>"+ pathologyCause +"</td><td>"+pathologyLocation+"</td><td>"+variableData +"</td></tr>";				
						}
					}
					
					
					
					if(mnemosynePathologyDenes.length){
						for(i32=0;i32<mnemosynePathologyDenes.length;i32++){
							processingDene = mnemosynePathologyDenes[i32];
							processingDeneName = processingDene.Name;
							deneWords = processingDene["DeneWords"];
							variableData="";
							for(j2=0;j2<deneWords.length;j2++){
								deneWord = deneWords[j2];
								if(deneWord.Name ==PATHOLOGY_CAUSE){
									pathologyCause = deneWord.Value;
								}else if(deneWord.Name ==PATHOLOGY_LOCATION){
									pathologyLocation = deneWord.Value;
								}else {
									if( $(window).width() > 960 && deneWord.Name == PATHOLOGY_EVENT_MILLISECONDS){
										var deneWordValueText = "<a href=\"#bannerformmodal\" data-toggle=\"modal\" data-dirname=\""+deneWord.Value+"\" class=\"pathology-showLogsLink\" data-target=\"#bannerformmodal\">"+deneWord.Value+"</a>"; 
										variableData = variableData.concat(deneWord.Name + "=" + deneWordValueText + "<br>");
									}else{
										variableData = variableData.concat(deneWord.Name + "=" + deneWord.Value + "<br>");		
									}
								}	
							}
							panelHTML += "<tr><th>"+processingDeneName +"</th><th>"+ pathologyLocation +"</th><th>"+pathologyCause+"</th><th>"+variableData +"</th></tr>";				
						}
					}
					
					panelHTML += "</table>";
				}
				
				//
				// now add the div which represents the model
				// it will be hidden first
				//
				panelHTML += "<div class=\"modal fade bannerformmodal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"bannerformmodal\" aria-hidden=\"true\" id=\"bannerformmodal\">";
				panelHTML += "<div class=\"modal-dialog modal-xl\">";
				panelHTML += "<div class=\"modal-content\">";
				panelHTML += "<div class=\"modal-content\">";
				panelHTML += "<div class=\"modal-header \">";
				panelHTML += "<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" id=\"dismissbannerformmodal\">&times;</button>";
				panelHTML += "<h4 class=\"modal-title\" id=\"myModalLabel\">";
				
				panelHTML += "<ul class=\"nav nav-pills pathology-file-list\">";
				panelHTML += "</ul>";
				panelHTML += "</h4>";
				panelHTML += "</div>";
				panelHTML += "<div class=\"modal-body pathology-modal-body\">";
				panelHTML += "</div>";
				panelHTML += "<div class=\"modal-footer\">";
				panelHTML += "</div>  ";      
				panelHTML += "</div>";
				panelHTML += "</div>";
				panelHTML += "</div>";
				panelHTML += " </div>";
				//
				// ends the code for modal widnow
				
				var eventTimestamp;
				if(allExogenousMethamorphosisEvents.length>0){
					
					panelHTML += "<h6></h6><br>";
					panelHTML += "<table class=\"table table-stripped\">";
					panelHTML += "<tr><th>Type</th><th>Time</th><th>Cause</th><th>Details</th></tr>";
					
					for(i32=0;i32<allExogenousMethamorphosisEvents.length;i32++){
						processingDene = allExogenousMethamorphosisEvents[i32];
						processingDeneName = processingDene.Name;
						deneWords = processingDene["DeneWords"];
						variableData="";
						for(j2=0;j2<deneWords.length;j2++){
							deneWord = deneWords[j2];
							if(deneWord.Name ==METAMORPHOSIS_EVENT_TIMESTAMP){
								eventTimestamp = deneWord.Value;
							}	
						}
						panelHTML += "<tr><td>Identity Switch</td><td>"+ eventTimestamp +"</td></tr>";				
					}
					panelHTML += "</table>";
				}
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MANUAL_ACTION_WITH_TIMER){
			}else{
			
			}
				//console.log("unidentified style, mainPanelVisualStyle=" + mainPanelVisualStyle)
			
			panelHTML += "</div>";    // closing <div class=\"panel-body text-center\"
			panelHTML += "</div>";    // closing <div class=\"panel-heading\"
			panelHTML += "</div>";    // closing <div class=\"panel panel-default\"
			panelHTML += "</div>";    // closing <div class=\"bs-component\"
			//panelHTML += "</div>";    // closing <div class=\"col-lg-6\"


//			//console.log("rowPanelCounter=" + rowPanelCounter + " numberOfPanelsPerRow=" + numberOfPanelsPerRow);
//			if(rowPanelCounter===numberOfPanelsPerRow){
//
//				//
//				// close the current row of panels
//				//
//				panelHTML += "</div>";    // closing <div class=\"row top-buffer\"
//
//				//
//				// and start a new one
//				//
//				panelHTML += "<div class=\"row top-buffer\">";				
//				rowPanelCounter=1;
//				//console.log("added new row to the panels");
//			}else{
//				rowPanelCounter+=1;
//				//console.log("increased panel counter");
//			}
		}
		//
		//close the last row of the page panels
		panelHTML += "</div>";// clossing class=\"row top-buffer\">";
		//console.log("finished rendering page " + panelHTML);
		$("#EntryPoint").append(panelHTML);
		
		//
		// now loop over every chart
		//
		var obj3 = chartDataSourcePointerHashMap["_map"];
		var obj4 = chartStyleHashMap["_map"];
		for(var pId in obj3) {
			var renderedDataSourceDeneWord= obj3[pId];
			var mainPanelVisualStyle = obj4[pId];
			
			if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_LINE_CHART){
				drawTimeSeriesLineChart(pId, renderedDataSourceDeneWord);	
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_CSV_MULTI_LINE_CHART){
				var fileName = renderedDataSourceDeneWord.Value.replace('$Webserver_Root/','');
				var units = renderedDataSourceDeneWord.Units;
				drawTimeSeriesMultiLineChart(pId, fileName, units);
			}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_PIE_CHART){
				drawPieChart(pId,renderedDataSourceDeneWord)
			}
		}
		
		
		
		
		
		//
		// set up the available ssids
		//
		var availableSSIDs = [];//currentOperationalData["Available SSIDs"];
		var option = $('<option></option>').attr("value", "").text("Select SSID");
		$("#AvailableNetworks").empty().append(option);

		console.log("availableSSIDs=" + availableSSIDs);
		var $el = $("#AvailableNetworks");
		$(function() {
		    $.each(availableSSIDs, function(i, item) {
		    	var security="";
		    	if(item["Authentication"]!=null && item["Authentication"].indexOf("PSK")>-1)security="Password";
		    	var key = item["SSID"]+ "-" + item["Signal"] + " " + security;
		    	var value=item["SSID"] ;
		    	 $el.append($("<option></option>").attr("value", value).text(key)); 
		    });
		});
		//
		// end of network identity
		//
		
		
		
	}

	


