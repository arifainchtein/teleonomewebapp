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
var rowPanelCounter=0;
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
var chartTimeStringHashMap = new HashMap();
var chartTitleHashMap = new HashMap();

var organismInfoJsonData;
var pulseCreationTime="";
var currentPathologyDeneCount=0;
var operationalMode="";
function monitorBetweenPulses() {

	timeSinceLastPulse = new Date().getTime()-pulseTimestampMilliseconds;
	timeStringSinceLastPulse = msToTime(timeSinceLastPulse);
	$("#TimeSinceLastPulse").html(timeStringSinceLastPulse);
	//// console.log("timeStringSinceLastPulse=" + timeStringSinceLastPulse);

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
		//// console.log("timeBeforeLate=" + timeBeforeLate + " timeSinceLastPulse=" + timeSinceLastPulse);
		if(timeSinceLastPulse>timeBeforeLate){
			//
			// set the status to blinking yellow
			//
			if ($(window).width() < 480) {
				$('#TeleonomeDataStatus').removeClass().addClass('label label-xs label-danger');
			}else{
				$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-danger');
			}
		}else if(timeSinceLastPulse>timeBeforeLate/2){ 
			if ($(window).width() < 480) {
				$('#TeleonomeDataStatus').removeClass().addClass('label label-xs label-warning');
			}else{
				$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-warning');
			}
		}else{
			//
			// set the status to blinking yellow
			//	
			if ($(window).width() < 480) {
				$('#TeleonomeDataStatus').removeClass().addClass('label label-xs label-success');
			}else{
				$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-success');
			}
		}
	}
} 

function renderCommandRequestTable(commandsInfo){
	var commandsPerPage=20;
	var total = commandsInfo.Total;
	var allCommands = commandsInfo.Values;
	var limit = commandsInfo.Limit;
	var offset = commandsInfo.Offset;
	var numberOfPagesToShow = 5;
	var numberOfPages = total/commandsPerPage;

	if ($(window).width() < 480) {
		commandsPerPage=5;
		var panelHTML = "<table class=\"table\"><tbody>";

		for (var i = 0; i < allCommands.length; i++) {
			var command = allCommands[i];

			var createdOnDate = new Date(command.Createdon);
			var createdOnDateFormated = getISOStringWithoutSecsAndMillisecs(createdOnDate);
			var executedOnDateFormated="";
			if(command.Executedon>0){
				var executedOnDate = new Date(command.Executedon);
				executedOnDateFormated = getISOStringWithoutSecsAndMillisecs(executedOnDate);
			}
			var rowStatus="info";
			if(command.Status ==COMMAND_REQUEST_EXECUTED){
				rowStatus="success";
			}else if(command.Status ==COMMAND_REQUEST_PENDING_EXECUTION){
				rowStatus="warning";
			}else if(command.Status ==COMMAND_REQUEST_SKIPPED_AT_INIT || command.Status ==COMMAND_REQUEST_INVALID_CODE){
				rowStatus="danger";
			}
			panelHTML += "<tr class=\""+ rowStatus+"\"><td>";
			panelHTML += "<table table-borderless>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Id</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+command.id+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Client Ip</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+command.ClientIp+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Created On</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+ createdOnDateFormated +"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Executed On</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+executedOnDateFormated+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Command</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + command.Command +"</td></tr>";
			if(command.Payload==undefined || command.Payload==""){
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Payload</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;No Payload</td></tr>";
			}else{
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Payload</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;<pre><code>" + command.Payload +"</code></pre></td></tr>";
			}
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Status</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + command.Status +"</td></tr>";
			panelHTML += "</table>";
			panelHTML += "</td></tr>";
		}
		panelHTML += "</tbody></table>";
	}else{
		var panelHTML = "<table class=\"table table-responsive\">";
		panelHTML += "<thead><tr><th>Id</th><th>Client Ip</th><th>Created On</th><th>ExecutedOn</th><th>Command</th><th>Payload</th><th>Status</th></tr></thead><tbody>";
		for (var i = 0; i < allCommands.length; i++) {
			var command = allCommands[i];

			var createdOnDate = new Date(command.Createdon);
			var createdOnDateFormated = getISOStringWithoutSecsAndMillisecs(createdOnDate);
			var executedOnDateFormated="";
			if(command.Executedon>0){
				var executedOnDate = new Date(command.Executedon);
				executedOnDateFormated = getISOStringWithoutSecsAndMillisecs(executedOnDate);
			}
			var rowStatus="info";
			if(command.Status ==COMMAND_REQUEST_EXECUTED){
				rowStatus="success";
			}else if(command.Status ==COMMAND_REQUEST_PENDING_EXECUTION){
				rowStatus="warning";
			}else if(command.Status ==COMMAND_REQUEST_SKIPPED_AT_INIT || command.Status ==COMMAND_REQUEST_INVALID_CODE){
				rowStatus="danger";
			}
			if(command.Payload==undefined || command.Payload==""){
				panelHTML += "<tr class=\""+ rowStatus+"\"><td>"+command.id+"</td><td>"+command.ClientIp+"</td><td>"+ createdOnDateFormated +"</td><td>"+executedOnDateFormated+"</td><td>" + command.Command +"</td><td>No Payload</td><td>" + command.Status +"</td></tr>";
			}else{
				panelHTML += "<tr class=\""+ rowStatus+"\"><td>"+command.id+"</td><td>"+command.ClientIp+"</td><td>"+ createdOnDateFormated +"</td><td>"+executedOnDateFormated+"</td><td>" + command.Command +"</td><td><pre><code>" + command.Payload +"</code></pre></td><td>" + command.Status +"</td></tr>";
			}
		}
		panelHTML += "</tbody></table>";
		//
		// do the pagination
		//
		var numberOfPages = (1 + total/limit)|0	;
		var paginationStart=1;
		if(offset>0){
			paginationStart= paginationStart + offset;
		}
		var paginationEnd = paginationStart + numberOfPagesToShow;

		panelHTML += "<ul class=\"pagination justify-content-center\">";
		panelHTML += "	<li class=\"page-item disabled\">";
		panelHTML += "		<a class=\"page-link\" href=\"#\" tabindex=\"-1\">Previous</a>";
		panelHTML += 	"</li>";
		for(var j=paginationStart; j<(paginationEnd-paginationStart); j++){
			panelHTML += "	<li data-offset=\""+j +"\" class=\"page-item\"><a class=\"page-link\" href=\"#\">"+j+"</a></li>";
		}
		panelHTML += "	<li class=\"page-item\"><a data-offset=\""+(offset + numberOfPagesToShow) +"\"  class=\"page-link\" href=\"#\"> ...</a></li>";
		panelHTML += "	<li class=\"page-item\"><a data-offset=\""+numberOfPages +"\" class=\"page-link\" href=\"#\"> " + numberOfPages +"</a></li>";

		panelHTML += "	<li class=\"page-item\">";
		panelHTML += "	<a class=\"page-link\" href=\"#\">Next</a>";
		panelHTML += "</li>";
		panelHTML += "</ul>";

		//
		//
	}
	return panelHTML;
}
function renderMnemosycons(mnemosyconProcessingAddressPointer){
	//
	// mnemosyconProcessingAddressPointer will contain the complete address
	// ie @Sento:Mnemosyne:Mnemosyne Current Week:Static Mnemosycon Processing
	// but because this is the mnemosyne, there will be many instances
	// of Static Mnemosycon Processing inside of Mnemosyne Current Week
	// as well as other denes that are not Static Mnemosycon Processing
	// so first separate the denes called Static Mnemosycon Processing
	// then sort them by Position
	var identity = identityFactory.createIdentityByPointer(mnemosyconProcessingAddressPointer);
	var teleonomeName = identity.teleonomeName;
	var nucleusName = identity.nucleusName;
	var deneChainName = identity.deneChainName;
	//
	// the deneName represents all the denes which will be part f the report
	var deneName = identity.deneName;

	//
	// now make an identity for the parent, ie @Sento:Mnemosyne:Mnemosyne Current Week:
	var parentMnemosyconProcessingAddressPointer =  "@" +teleonomeName + ":" + nucleusName + ":" +deneChainName;

	var parentMnemosyconProcessingDenesDeneChain = getDeneChainByIdentityPointer(parentMnemosyconProcessingAddressPointer);
	var denes = parentMnemosyconProcessingDenesDeneChain["Denes"];	
	//
	// now loop over all the denes and store the ones that match in  a hashmap to be sorted
	//
	var unsortedHashMap = new HashMap();

	for (var i = 0; i < denes.length; i++) {
		var dene = denes[i];
		//
		if(dene.Name == deneName){
			unsortedHashMap.put(dene.Position,dene);
		}
	}
	var sorted = sortHashMap(unsortedHashMap);
	if(sorted["_size"]==0) return "";

	var mnemosyneDataSortedArrayMap = sorted["_map"];
	var dataDene;
	var dataDeneWords, mnemosyconName;
	var deneWord;
	var rowStatus="text-center";
	var freeSpaceBefore, freeSpaceAfter, numberRules, totalTime, pulseTimestampString, pulseTimestampMillis, rulesDetailsLink;
	var pulseLink;


	if ($(window).width() < 480) {
		//
		// the get the name of the mnemosycon just get the codon of 
		// one of the denes 
		for(var property in mnemosyneDataSortedArrayMap) {
			dataDene = mnemosyneDataSortedArrayMap[property];  
			dataDeneWords = dataDene.DeneWords;
			for( l=0;l<dataDeneWords.length;l++){
				deneWord = dataDeneWords[l];
				if(deneWord["Name"]=== CODON){
					mnemosyconName=deneWord["Value"];
					break;
				}
			}
		} 
		var panelHTML = "<h4 class=\"text-center\">"+ mnemosyconName +"</h4><br><table class=\"table\"><tbody>";

		for(var property in mnemosyneDataSortedArrayMap) {
			//
			//after every three panels 
			dataDene = mnemosyneDataSortedArrayMap[property];  
			dataDeneWords = dataDene.DeneWords;
			for( l=0;l<dataDeneWords.length;l++){
				deneWord = dataDeneWords[l];
				if(deneWord["Name"]===DENEWORD_FREE_SPACE_BEFORE_MNEMOSYCON){
					freeSpaceBefore=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_FREE_SPACE_AFTER_MNEMOSYCON){
					freeSpaceAfter=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_MNEMOSYCON_EXECUTION_TIME){
					totalTime=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_MNEMOSYCON_RULES_PROCESSED){
					numberRules=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== PULSE_TIMESTAMP){
					pulseTimestampString=deneWord["Value"];
				}else if(deneWord["Name"]=== PULSE_TIMESTAMP_MILLISECONDS){
					pulseTimestampMillis=deneWord["Value"];
				}
			}
			rulesDetailsLink = '<a href=\"#bannerformmodal\" data-target=\"#bannerformmodal\"  data-toggle=\"modal\" class=\"MnemosyconRulesDetails\" data-time=\"' + pulseTimestampMillis + '\"  data-mnemosyconname=\"'+ mnemosyconName +'\">' + numberRules + '</a>';


			panelHTML += "<tr class=\""+ rowStatus+"\"><td>";
			panelHTML += "<table table-borderless>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Pulse Time</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+pulseTimestampString+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Free Space Before</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+freeSpaceBefore+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Free Space After</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+ freeSpaceAfter +"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Rules Processed</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+rulesDetailsLink+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Processing Time (<i> ms</i>)</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + totalTime +"</td></tr>";
			panelHTML += "</table>";
			panelHTML += "</td></tr>";
		}
		panelHTML += "</tbody></table>";
	}else{

		for(var property in mnemosyneDataSortedArrayMap) {
			dataDene = mnemosyneDataSortedArrayMap[property];  
			dataDeneWords = dataDene.DeneWords;
			for( l=0;l<dataDeneWords.length;l++){
				deneWord = dataDeneWords[l];
				if(deneWord["Name"]=== CODON){
					mnemosyconName=deneWord["Value"];
					break;
				}
			}
		} 
		var panelHTML = "<h4 class=\"text-center\">"+ mnemosyconName +"</h4><br><table class=\"table table-responsive\">";
		panelHTML += "<thead><tr><th class=\""+ rowStatus+"\">Pulse Timestamp</th><th class=\""+ rowStatus+"\">Free Space Before</th><th class=\""+ rowStatus+"\">Free Space After</th><th class=\""+ rowStatus+"\">Rules Processed</th><th class=\""+ rowStatus+"\">Processing Time</th></tr></thead><tbody>";
		for(var property in mnemosyneDataSortedArrayMap) {
			//
			//after every three panels 
			dataDene = mnemosyneDataSortedArrayMap[property];
			dataDeneWords = dataDene.DeneWords;
			for( l=0;l<dataDeneWords.length;l++){
				deneWord = dataDeneWords[l];
				if(deneWord["Name"]===DENEWORD_FREE_SPACE_BEFORE_MNEMOSYCON){
					freeSpaceBefore=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_FREE_SPACE_AFTER_MNEMOSYCON){
					freeSpaceAfter=deneWord["Value"] + "&nbsp;" + deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_MNEMOSYCON_EXECUTION_TIME){
					totalTime=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_MNEMOSYCON_RULES_PROCESSED){
					numberRules=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== PULSE_TIMESTAMP){
					pulseTimestampString=deneWord["Value"];
				}else if(deneWord["Name"]=== PULSE_TIMESTAMP_MILLISECONDS){
					pulseTimestampMillis=deneWord["Value"];
				}
			}
			pulseLink =        '<a href=\"#bannerformmodal\" data-target=\"#bannerformmodal\"  data-toggle=\"modal\" class=\"PulseTime\" data-time=\"' + pulseTimestampMillis + '\"  data-teleonomeName=\"'+ teleonomeName +'\">' + pulseTimestampString + '</a>';
			rulesDetailsLink = '<a href=\"#bannerformmodal\" data-target=\"#bannerformmodal\"  data-toggle=\"modal\" class=\"MnemosyconRulesDetails\" data-time=\"' + pulseTimestampMillis + '\"  data-mnemosyconname=\"'+ mnemosyconName +'\">' + numberRules + '</a>';
			panelHTML += "<tr class=\""+ rowStatus+"\"><td>"+pulseLink+"</td><td>"+freeSpaceBefore+"</td><td>"+ freeSpaceAfter +"</td><td>"+rulesDetailsLink+"</td><td>" + totalTime +"</td></tr>";
		}
		panelHTML += "</tbody></table>";
	}
	return panelHTML;
}

function renderMnemosyconsRules(mnemosyconName, rulesDetails){
	//
	// rulesDetailsis a json object that contains t
	// two properties, each with a value of jsonarray 
	// these jsonarrays contains the Mnemosycon Rule Processing Denes

	var dataDene;
	var dataDeneWords, mnemosyconName;
	var deneWord;
	var rowStatus="text-center";
	var mnemosyconRuleExecutionMillis, mnemosyconRuleUntilTimeValue, mnemosyconRuleUntilTimeUnit, mnemosyconRuleSource;
	var mnemosyconRuleLocation,deleteOlderThan, rowsDeleted, databaseField=""   ;
	var freeSpaceBeforeRule,freeSpaceAfterRule, deletedFileCounter, oldestFileNameDeleted,newestFileNameDeleted;

	var databaseRules = rulesDetails.DatabaseRules;
	var fileRules = rulesDetails.FileRules


	if ($(window).width() < 480) {

		var panelHTML = "<table class=\"table\"><tbody>";
		//public static final String MNEMOSYCON_RULE_FILE_PREFIX="Mnemosycon Rule File Prefix";
		for( l=0;l<rulesDetails.length;l++){
			//
			//after every three panels 
			dataDene = rulesDetails[l];  
			dataDeneWords = dataDene.DeneWords;

			for( m=0;m<dataDeneWords.length;m++){
				deneWord = dataDeneWords[m];
				if(deneWord["Name"]=== MNEMOSYCON_RULE_SOURCE){
					mnemosyconRuleSource=deneWord["Value"]
				}
			}

			if(mnemosyconRuleSource===MNEMOSYCON_DATA_SOURCE_DATABASE) {

				for( m=0;m<dataDeneWords.length;m++){
					deneWord = dataDeneWords[m];
					databaseField="";
					if(deneWord["Name"]===MNEMOSYCON_RULE_EXECUTION_MILLIS){
						mnemosyconRuleExecutionMillis=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_TIME_UNIT){
						mnemosyconRuleUntilTimeUnit=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_TIME_UNIT_VALUE){
						mnemosyconRuleUntilTimeValue=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_SOURCE){
						mnemosyconRuleSource=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_LOCATION){
						mnemosyconRuleLocation=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_DELETE_OLDER_THAN){
						deleteOlderThan=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_ROWS_DELETED){
						rowsDeleted=deneWord["Value"];
					}else if(deneWord["name"]=== DENEWORD_TYPE_MNEMOSYCON_DATABASE_FIELD){
						databaseField=deneWord["Value"];
					}
				}

				panelHTML += "<tr class=\""+ rowStatus+"\"><td>";
				panelHTML += "<table table-borderless>";
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Source</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+mnemosyconRuleSource+"</td></tr>";
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Location</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+mnemosyconRuleLocation+"</td></tr>";
				if(databaseField!==""){
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Field</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+databaseField+"</td></tr>";	
				}

				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Timeframe</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+ mnemosyconRuleUntilTimeValue +mnemosyconRuleUntilTimeUnit  +"</td></tr>";
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Delete Older Than Processed</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+deleteOlderThan+"</td></tr>";
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Rows Deleted</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" +rowsDeleted +"</td></tr>";
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Execution Millis</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + mnemosyconRuleExecutionMillis +"</td></tr>";
				panelHTML += "</table>";
				panelHTML += "</td></tr>";
			}else if(mnemosyconRuleSource=== MNEMOSYCON_DATA_SOURCE_FILE_SYSTEM) {


				for( m=0;m<dataDeneWords.length;m++){
					deneWord = dataDeneWords[m];
					if(deneWord["Name"]===DISK_SPACE_BEFORE_MNEMOSYCON_RULE){
						freeSpaceBeforeRule=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== DISK_SPACE_AFTER_MNEMOSYCON_RULE){
						freeSpaceAfterRule=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_FILES_DELETED){
						deletedFileCounter=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_SOURCE){
						mnemosyconRuleSource=deneWord["Value"] 
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_LOCATION){
						mnemosyconRuleLocation=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_OLDEST_FILE_DELETED){
						oldestFileNameDeleted=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_NEWEST_FILE_DELETED){
						newestFileNameDeleted=deneWord["Value"];
					}

					panelHTML += "<tr class=\""+ rowStatus+"\"><td>";
					panelHTML += "<table table-borderless>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Source</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+mnemosyconRuleSource+"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Location</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+mnemosyconRuleLocation+"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>>Space Before</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+ freeSpaceBeforeRule  +"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Space After</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+freeSpaceAfterRule+"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Files Deleted</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" +deletedFileCounter +"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Oldest File Deleted</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + oldestFileNameDeleted +"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Newest File Deleted</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + newestFileNameDeleted +"</td></tr>";

					panelHTML += "</table>";
					panelHTML += "</td></tr>";
				}

			}
		}
		panelHTML += "</tbody></table>";
	}else{
		if(databaseRules!=undefined && databaseRules.length>0){
			var panelHTML = "<h5>Database Rules</h5><table class=\"table table-responsive\">";
			panelHTML += "<thead><tr><th class=\""+ rowStatus+"\">Source</th><th class=\""+ rowStatus+"\">Location</th><th class=\""+ rowStatus+"\">Field</th><th class=\""+ rowStatus+"\">Timeframe</th><th class=\""+ rowStatus+"\">Delete Older Than</th><th class=\""+ rowStatus+"\">Rows Deleted</th><th class=\""+ rowStatus+"\">Execution Millis</th></tr></thead><tbody>";
			for( l=0;l<databaseRules.length;l++){ 
				dataDene = databaseRules[l];  
				dataDeneWords = dataDene.DeneWords;

				for(var m=0;m<dataDeneWords.length;m++){
					deneWord = dataDeneWords[m];
					databaseField=="";
					if(deneWord["Name"]===MNEMOSYCON_RULE_EXECUTION_MILLIS){
						mnemosyconRuleExecutionMillis=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_TIME_UNIT){
						mnemosyconRuleUntilTimeUnit=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_TIME_UNIT_VALUE){
						mnemosyconRuleUntilTimeValue=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_SOURCE){
						mnemosyconRuleSource=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_LOCATION){
						mnemosyconRuleLocation=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_DELETE_OLDER_THAN){
						deleteOlderThan=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_ROWS_DELETED){
						rowsDeleted=deneWord["Value"];
					}else if(deneWord["Name"]=== DENEWORD_TYPE_MNEMOSYCON_DATABASE_FIELD ){
						databaseField=deneWord["Value"];
					}
				}
				panelHTML += "<tr class=\""+ rowStatus+"\"><td>"+mnemosyconRuleSource+"</td><td>"+mnemosyconRuleLocation+"</td><td>"+databaseField+"</td><td>"+ mnemosyconRuleUntilTimeValue  + mnemosyconRuleUntilTimeUnit+"</td><td>"+deleteOlderThan+"</td><td>" + rowsDeleted +"</td><td>" + mnemosyconRuleExecutionMillis +"</td></tr>";

			}
			panelHTML += "</tbody></table>";
		}
		if(fileRules!=undefined && fileRules.length>0){
			panelHTML += "<h5>File Based Rules</h5><table class=\"table table-responsive\">";
			panelHTML += "<thead><tr><th class=\""+ rowStatus+"\">Source</th><th class=\""+ rowStatus+"\">Location</th><th class=\""+ rowStatus+"\">Space Before</th><th class=\""+ rowStatus+"\">Space After</th><th class=\""+ rowStatus+"\">Files Deleted</th><th class=\""+ rowStatus+"\">Oldest File</th><th class=\""+ rowStatus+"\">Newest File</th></tr></thead><tbody>";
			for( l=0;l<fileRules.length;l++){ 
				dataDene = fileRules[l];  
				for( m=0;m<dataDeneWords.length;m++){
					deneWord = dataDeneWords[m];
					if(deneWord["Name"]===DISK_SPACE_BEFORE_MNEMOSYCON_RULE){
						freeSpaceBeforeRule=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== DISK_SPACE_AFTER_MNEMOSYCON_RULE){
						freeSpaceAfterRule=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_FILES_DELETED){
						deletedFileCounter=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_SOURCE){
						mnemosyconRuleSource=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_LOCATION){
						mnemosyconRuleLocation=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_OLDEST_FILE_DELETED){
						oldestFileNameDeleted=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_NEWEST_FILE_DELETED){
						newestFileNameDeleted=deneWord["Value"];
					}
				}
				panelHTML += "<tr class=\""+ rowStatus+"\"><td>"+mnemosyconRuleSource+"</td><td>"+mnemosyconRuleLocation+"</td><td>"+ freeSpaceBeforeRule+"</td><td>"+freeSpaceAfterRule+"</td><td>" + deletedFileCounter +"</td><td>" + oldestFileNameDeleted +"</td><td>" + newestFileNameDeleted +"</td></tr>";
			}
			panelHTML += "</tbody></table>";
		}
	}

	return panelHTML;
}

function renderAsyncCommands(includeClient,includeInternal, limit, offset ){
	$.ajax({
		type: "POST",
		url: "/TeleonomeServlet",
		data: {formName:"GetAllCommandRequests", IncludeClient:includeClient, IncludeInternal:includeInternal,limit:limit,offset:offset },
		success: function (data) {
			// console.log("GetAllCommandRequests res," + data);
			var commandsInfo = JSON.parse(data);
			var allCommands = commandsInfo.Values;
			if(allCommands.length>0){
				$('#AynchronousLog').empty();
				var panelHTML = renderCommandRequestTable(commandsInfo);
				$('#AynchronousLog').append(panelHTML);
				$('#AynchronousLog').show();
			}

		},
		error: function(data){
			// console.log("error getting commanda data:" + data);
			alert("Error getting commanda data:" +  data);
			return false;
		}
	});
}

function receivedCommandResponse(cr){
	//
	// text contains the numerical id of the command
	// that was completed,
	// now ask for the server to send you a new version 
	// of the Teleonome.denome that would have been 
	// updated.  Note that this will come from tomcat
	// not the heart
	var commandResponse = JSON.parse(cr);
	$.ajax({
		type: "GET",
		url: "/TeleonomeServlet",
		data: {formName:"GetDenome", },
		success: function (data) {
			//// console.log("data=" + data);
			loadDenomeRefreshInterface(data);
			var result="info";
			var commandResultText="";
			var commandCode="";
			if(commandResponse.Command==COMMAND_REBOOT || 
					commandResponse.Command == COMMAND_REBOOT_TEXT ||
					commandResponse.Command == COMMAND_SHUTDOWN ||
					commandResponse.Command == COMMAND_SHUTDOWN_TEXT ){
				$('#WaitingWheel').hide();
				powerButtonDisabled=false;
				if(commandResponse.Status==COMMAND_REQUEST_EXECUTED){
					if(commandResponse.Command==COMMAND_REBOOT || 
							commandResponse.Command == COMMAND_REBOOT_TEXT){
						alert("Restarting ....");
					}else{
						alert("Shutting down ....");
					}
				}else if(commandResponse.Status==COMMAND_REQUEST_INVALID_CODE){
					alert("Invalid Code");
					$("#MainPowerButton").attr("disabled", false);
					$("#MainPowerButton").addClass('btn-success').removeClass('btn-warning');
				}


			}else{
				if(commandResponse.Status==COMMAND_REQUEST_EXECUTED){
					result="success";
					commandResultText=commandResponse.Command + " was executed succesfully";
					if(commandResponse.RestartRequired){
						$("#MainPowerButton").addClass('btn-danger').removeClass('btn-success');
					}
				}else if(commandResponse.Status==COMMAND_REQUEST_INVALID_CODE){
					result="danger";
					commandResultText=commandResponse.commandCode + " was not correct";
				}

				$('#CommandRequestStatus').removeClass().addClass('label label-sm label-' + result);
				$('#CommandRequestStatus').html(commandResultText);
				$('#CommandRequestStatus').show();
			}



		},
		error: function(data){
			var errorText = "error receiving updated Denome after command response, error was:" + JSON.stringify(data);
			console.log(data);
			alert(errorText);
			return false;
		}
	});	
}

function asyncUpdate(text){
	//
	// the format is a json object like
	//  {
//	pointer:value,
//	pointer,value
//	}
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
		if(refreshActive){
			RefreshInterface();
		}
	}

}


function updatePulseStatusInfo(text){
	$('#PulseStatusInfo').text(text);
}
function updatePulseStatusInfoSecundary(text){
	$('#PulseStatusInfoSecundary').text(text);
}

function setAvailableSSIDs(ssids){
	// console.log("Ssids=" + JSON.stringify(ssids));
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
	// console.log("pulse arrive at " + new Date() );
	if(betweenPulseInterval!= undefined)clearInterval(betweenPulseInterval);
	if ($(window).width() < 480) {
		$('#TeleonomeDataStatus').removeClass().addClass('label label-xs label-success');
	}else{
		$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-success');
	}

	$('#CommandRequestStatus').hide();
	pulseJSONObject= JSON.parse(denomeFileInString);
	if(!$('#bannerformmodal').hasClass('in') && refreshActive){

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
	chartTimeStringHashMap = new HashMap();
	chartTitleHashMap = new HashMap();

	var pathologyDenes = getPathologyDenes();
	var mnemosynePathologyDenes = getMnemosynePathologyDenes();

	currentPathologyDeneCount = pathologyDenes.length + mnemosynePathologyDenes.length;
	if(currentPathologyDeneCount>0){
		// $('#Pathology').show();

		// $('#ErrorText').html("See Pathology (" + pathologyDenes.length + ")");
		// // console.log("Pathology Denes:" + JSON.stringify(pathologyDenes));
		// // console.log("Mnemosyne Pathology Denes:" + JSON.stringify(mnemosynePathologyDenes));

	}else{
		$('#Pathology').hide();
		$('#ErrorText').html("");
	}

	//// console.log("humanInterfaceDeneChainArray=" + humanInterfaceDeneChainArray);
	var pointer;
	var humanInterfaceDeneChainJSONObject={};
	for( i=0;i<humanInterfaceDeneChainArray.length;i++){
		pointer = "@" + teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":"+ humanInterfaceDeneChainArray[i]["Name"];
		humanInterfaceDeneChainIndex.put(pointer, humanInterfaceDeneChainArray[i]);
		humanInterfaceDeneChainJSONObject[pointer]=humanInterfaceDeneChainArray[i];
	}
	localStorage.setItem("HumanInterfaceDeneChainIndex", JSON.stringify(humanInterfaceDeneChainJSONObject));

	var teleonomeStatusBootstrapValuePointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_OPERATIONAL_STATUS_BOOTSTRAP_EQUIVALENT;
	//// console.log("teleonomeStatusBootstrapValuePointer=" + teleonomeStatusBootstrapValuePointer);
	teleonomeStatusBootstrapValue = getDeneWordByIdentityPointer(teleonomeStatusBootstrapValuePointer, DENEWORD_VALUE_ATTRIBUTE);

	var currentPulseFrequencyPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_CURRENT_PULSE_FREQUENCY;
	//// console.log("currentPulseFrequencyPointer=" + currentPulseFrequencyPointer);
	currentPulseFrequency = getDeneWordByIdentityPointer(currentPulseFrequencyPointer, DENEWORD_VALUE_ATTRIBUTE);
	//// console.log("currentPulseFrequency=" + currentPulseFrequency);

	var currentPulseGenerationDurationPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_CURRENT_PULSE_GENERATION_DURATION;
	//// console.log("currentPulseGenerationDurationPointer=" + currentPulseGenerationDurationPointer);
	currentPulseGenerationDuration = getDeneWordByIdentityPointer(currentPulseGenerationDurationPointer, DENEWORD_VALUE_ATTRIBUTE);
	//// console.log("currentPulseGenerationDuration=" + currentPulseGenerationDuration);

	var numberOfPulsesBeforeLatePointer = "@" +teleonomeName + ":" + NUCLEI_INTERNAL + ":" +DENECHAIN_DESCRIPTIVE + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_NUMBER_PULSES_BEFORE_LATE;
	//// console.log("numberOfPulsesBeforeLatePointer=" + numberOfPulsesBeforeLatePointer);
	numberOfPulsesBeforeLate = getDeneWordByIdentityPointer(numberOfPulsesBeforeLatePointer, DENEWORD_VALUE_ATTRIBUTE);
	//// console.log("numberOfPulsesBeforeLate=" + numberOfPulsesBeforeLate);

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
	refreshActive=true;

	renderPageToDisplay();
}


function renderPageToDisplay(){
	var pagePosition, pageDefinintionPointer;
	var controlParameterDenes,controlParameterDene, deneWords, deneWord;
	// console.log("entering render page to display, with pageToDisplay=" + pageToDisplay );
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
							//// console.log("pageDefinintionPointer=" +pageDefinintionPointer);
							//
							// if this is not the first page, hide
							// the PulseInfo
							if(pageToDisplay==1){
								$('#PulseActivityPanel').show();
							}else{
								$('#PulseActivityPanel').hide();
							}	
							renderPageByPointer(pageDefinintionPointer, "EntryPoint");
						}
					}
				}
			}
		}
	}

}





function renderPageByPointer(pagePointer, locationId){
	var pageDeneChain = humanInterfaceDeneChainIndex.get(pagePointer);
	//// console.log("renderPageByPointer pageDeneChain=" +pageDeneChain);
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
	var panelVisibleHashMap = new HashMap();

	//
	// re initialize the charts data holders
	chartDataSourcePointerHashMap = new HashMap();
	chartStyleHashMap = new HashMap();
	chartTimeStringHashMap = new HashMap();
	chartTitleHashMap = new HashMap();


	var deneWord;
	var denePanel;
	var panelVisualizationStyle;
	var dataDene;
	var panelVisible;
	//// console.log("renderPageByPointer denePanelArray.length=" +denePanelArray.length);
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
		panelVisible=false;
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
			}else if(deneWord.Name===DENEWORD_VISIBLE){
				panelVisible = deneWord["Value"];
				
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
		if(panelDataSourcePointer!="" &&  panelDeneChainPointer!=""){
			panelVisibleHashMap.put(panelDeneChainPointer,panelVisible);
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
	$("#" + locationId).empty();
	$("#teleonomeName").html(teleonomeName);
	$("#PulseTimestamp").html(pulseTimestamp);


	$("#PulseCreationTime").html(pulseCreationTime);
	//if(operationalMode!=OPERATIONAL_MODE_NORMAL){
	$("#WPSInfo").html(operationalMode);
	//}
	$("#TimeSinceLastPulse").html(timeStringSinceLastPulse);

	if ($(window).width() < 480) {
		$('#TeleonomeStatus').removeClass().addClass('label label-xs label-' + teleonomeStatusBootstrapValue);

	}else{
		$('#TeleonomeStatus').removeClass().addClass('label label-lg label-' + teleonomeStatusBootstrapValue);

	}
	$('#TeleonomeStatus').show();
	$('#TeleonomeDataStatus').show();

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
		//// console.log("key=" + key + "value=" + obj);
		for(var property in obj) {
			deneChainPointer= obj[property];
			//// console.log("line 178 a property=" + deneChainPointer);
		}

	}

	panelHTML ="";

	var numberOfPanelsPerRow=2;
	var obj =  sorted["_map"];
	var obj2 = panelPointerVisualStyleHashMap["_map"];
	var obj3 = panelPointerExternalDataSourcePointerHashMap["_map"];
	var obj4 = panelPointerExternalTimestampDataSourcePointerHashMap["_map"];
	var obj5 = panelVisibleHashMap["_map"];
	//
	// after every two panels put a new row
	// open the first one
	//
	panelHTML += "<div class=\"row top-buffer\">";
	var panelCounter=0;
	var inSearch=false;
	for(var property in obj) {
		deneChainPointer= obj[property];
		panelCounter++;
		panelVisible = obj5[deneChainPointer];
		if(!panelVisible)continue;
		mainPanelVisualStyle= obj2[deneChainPointer];
		panelExternalDataSourcePointer = obj3[deneChainPointer];
		panelExternalTimestampDataSourcePointer = obj4[deneChainPointer];

		// console.log("line 197 deneChainPointer=" + deneChainPointer +" mainPanelVisualStyle=" + mainPanelVisualStyle);

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
			var title = panelDeneChain["Name"];
			var organismView = new OrganismView();
			panelHTML += organismView.process(title);
			refreshOrganismView();


		}else if( mainPanelVisualStyle === PANEL_VISUALIZATION_STYLE_SETTINGS_INFO){
			//
			// in this case, denes will contain one dene,
			// which in turn will contain 3 denewords
			// the value of each of these denewords is a pointer
			// to the denechain panel for the info, wifi and update parameteres
			// using the pointers, get the chains and store them in localStorage
			// since the classes will use them later.
			// Each of these three pointers point to a denechain that itself has
			// only one dene 
			var systemInfoPointers = denes[0]['DeneWords'];
			var pointer;
			var systemInfoChain;
			var systemInfoDeneChainPanelJSON={};

			for( var q=0;q<systemInfoPointers.length;q++){
				pointer = systemInfoPointers[q].Value;
				systemInfoChain = humanInterfaceDeneChainIndex["_map"][pointer];
				systemInfoDeneChainPanelJSON[pointer] = systemInfoChain;

			}

			localStorage.setItem("SystemInfo", JSON.stringify(systemInfoDeneChainPanelJSON));

			var settingsInfo = new SettingsInfo();
			panelHTML += settingsInfo.process();


		}else if( mainPanelVisualStyle === PANEL_VISUALIZATION_STYLE_DIAGNOSTICS_INFO){
			//
			// in this case, denes will contain one dene,
			// which in turn will contain 4 denewords
			// the value of each of these denewords is a pointer
			// to the denechain panel for the Synchronous, Asynchronous , System and Mnemosycons
			// using the pointers, get the chains and store them in localStorage
			// since the classes will use them later
			var systemInfoPointers = denes[0]['DeneWords'];
			var pointer;
			var systemInfoChain;
			var systemInfoDeneChainPanelJSON={};

			for( var q=0;q<systemInfoPointers.length;q++){
				pointer = systemInfoPointers[q].Value;
				systemInfoChain = humanInterfaceDeneChainIndex["_map"][pointer];
				systemInfoDeneChainPanelJSON[pointer] = systemInfoChain;

			}

			localStorage.setItem("DiagnosticInfo", JSON.stringify(systemInfoDeneChainPanelJSON));

			var diagnosticsInfo = new DiagnosticsInfo();
			panelHTML += diagnosticsInfo.process();


		}else if( mainPanelVisualStyle === PANEL_VISUALIZATION_STYLE_NETWORK_MODE_SELECTOR){

			var aNetworking = new Networking();
			panelHTML += aNetworking.process();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_ACTION_EVALUATION_REPORT){
			var sourceDataPointer = denes[0].DeneWords[0].Value;
			var anActionEvaluationReport = new ActionEvaluationReport();
			panelHTML += anActionEvaluationReport.process(sourceDataPointer);


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_COMPLETE_WIDTH){


			var title =  panelDeneChain["Name"]

			var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
			var object = panelPositionInPanelHashMap["_map"];


			var aSingleValuePanel = new SingleValuePanel();
			panelHTML += aSingleValuePanel.process(true, title, object);



		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SHORT_TERM_WEATHER_FORECAST){
			var sourceDataPointer = denes[0].DeneWords[0].Value;
			var title = panelDeneChain["Name"];
			var aShortTermWeatherForecast = new ShortTermWeatherForecast();
			panelHTML += aShortTermWeatherForecast.process(title, sourceDataPointer);


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_DAILY_WEATHER_FORECAST){
			var sourceDataPointer = denes[0].DeneWords[0].Value;
			var title = panelDeneChain["Name"];
			var aDailyWeatherForecast = new DailyWeatherForecast();
			panelHTML += aDailyWeatherForecast.process(title, sourceDataPointer);

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

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL){
			var title =  panelDeneChain["Name"]

			var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
			var object = panelPositionInPanelHashMap["_map"];


			var aSingleValuePanel = new SingleValuePanel();
			panelHTML += aSingleValuePanel.process(false, title, object);

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_COMPLETE_DENE_STYLE_SINGLE_VALUE_PANEL){
			var aCompleteDeneSingleValuePanel = new CompleteDeneSingleValuePanel();
			panelHTML += aCompleteDeneSingleValuePanel.process();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_WELL_SINGLE_VALUE_PANEL){
			var sourceDataPointer = denes[0].DeneWords[0].Value;
			var aWellSingleValuePanel = new WellSingleValuePanel();
			panelHTML += aWellSingleValuePanel.process(sourceDataPointer);


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_TIMESTAMP){
			var aSingleValuePanelExternalTimestamp = new SingleValuePanelExternalTimestamp();
			var title  = panelDeneChain["Name"];
			var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
			var object = panelPositionInPanelHashMap["_map"];

			panelHTML += aSingleValuePanelExternalTimestamp.process( title, panelExternalTimestampDataSourcePointer, object);



		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_DATA){
			var title  = panelDeneChain["Name"];
			var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
			var object = panelPositionInPanelHashMap["_map"];
			var aSingleValuePanelExternalData = new SingleValuePanelExternalData();
			panelHTML += aSingleValuePanelExternalData.process(title, false, panelExternalDataSourcePointer, object);

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_COMPLETE_WIDTH_EXTERNAL_DATA){
			var title  = panelDeneChain["Name"];
			var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
			var object = panelPositionInPanelHashMap["_map"];
			var aSingleValuePanelExternalData = new SingleValuePanelExternalData();
			panelHTML += aSingleValuePanelExternalData.process(title, true, panelExternalDataSourcePointer, object);

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_COMPLETE_DENE_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_DATA){

			var sourceDataPointer = denes[0].DeneWords[0].Value;

			var title = panelDeneChain["Name"];
			var aCompleteDeneSingleValuePanelExternalData = new CompleteDeneSingleValuePanelExternalData();
			panelHTML += aCompleteDeneSingleValuePanelExternalData.process(sourceDataPointer, title);

			
		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_NETWORK_SENSOR_DEVICE_STATUS_REPORT){

			var aNetworkSensorDeviceStatusReport = new NetworkSensorDeviceStatusReport();
			panelHTML += aNetworkSensorDeviceStatusReport.process();
			inSearch=true;


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_SEARCH_PANEL){

			var aSearchPanel = new SearchPanel();
			panelHTML += aSearchPanel.process();
			inSearch=true;


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MULTI_LINE_CHART ){
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
			
			// t add multiline support, need to get all denewords not just one
			// create an array of all the denewords
			// and store it in line 1246 chartDataSourcePointerHashMap.put(id,renderedDataSourceDeneWord);
			var allDataPointersArray = extractAllDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER);
			var renderedDataSourceDeneWordsArray = getAllDeneWordsByIdentityPointer(allDataPointersArray, COMPLETE);


			var timeScale = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, DENEWORD_TYPE_CHART_TIME_SCALE_STRING);
			if(timeScale==null || timeScale== undefined)timeScale="%H:%M";

			var title = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, PANEL_TITLE);
			if(title==null || title== undefined)title="";


			// console.log("before rendering chart");
			chartDataSourcePointerHashMap.put(id,getAllDeneWordsByIdentityPointer);
			chartStyleHashMap.put(id,mainPanelVisualStyle);
			chartTimeStringHashMap.put(id,timeScale);
			chartTitleHashMap.put(id,title);



		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_LINE_CHART ||
				mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_CSV_MULTI_LINE_CHART||
				mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_PIE_CHART ||
				mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_BAR_CHART
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
			
			// t add multiline support, need to get all denewords not just one
			// create an array of all the denewords
			// and store it in line 1246 chartDataSourcePointerHashMap.put(id,renderedDataSourceDeneWord);
			var panelDataSourcePointer = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER);
			renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);


			var timeScale = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, DENEWORD_TYPE_CHART_TIME_SCALE_STRING);
			if(timeScale==null || timeScale== undefined)timeScale="%H:%M";

			var title = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, PANEL_TITLE);
			if(title==null || title== undefined)title="";


			// console.log("before rendering chart");
			chartDataSourcePointerHashMap.put(id,renderedDataSourceDeneWord);
			chartStyleHashMap.put(id,mainPanelVisualStyle);
			chartTimeStringHashMap.put(id,timeScale);
			chartTitleHashMap.put(id,title);



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
			var panelDeneWords = denes[0].DeneWords;
			var aMnemosyneTable = new MnemosyneTable();
			panelHTML += aMnemosyneTable.process(panelDeneWords);



		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_PATHOLOGY){
			var aPathologyPanel = new PathologyPanel();
			panelHTML += aPathologyPanel.process();


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MANUAL_ACTION_WITH_TIMER){
		}else{

		}
		//// console.log("unidentified style, mainPanelVisualStyle=" + mainPanelVisualStyle)

		panelHTML += "</div>";    // closing <div class=\"panel-body text-center\"
		panelHTML += "</div>";    // closing <div class=\"panel-heading\"
		panelHTML += "</div>";    // closing <div class=\"panel panel-default\"
		panelHTML += "</div>";    // closing <div class=\"bs-component\"
		panelHTML += "</div>";    // closing <div class=\"col-lg-6\"

		// console.log("rowPanelCounter=" + rowPanelCounter + " numberOfPanelsPerRow=" + numberOfPanelsPerRow);
		if(rowPanelCounter===numberOfPanelsPerRow){

			//
			// close the current row of panels
			//
			panelHTML += "</div>";    // closing <div class=\"row top-buffer\"

			//
			// and start a new one
			//
			panelHTML += "<div class=\"row top-buffer\">";				
			rowPanelCounter=0;
			//// console.log("added new row to the panels");
		}
	}
	//
	//close the last row of the page panels
	panelHTML += "</div>";// clossing class=\"row top-buffer\">";
	//// console.log("finished rendering page " + panelHTML);
	$("#" + locationId).append(panelHTML);

	//
	// check to see if secundaryView is not empty,
	// if its not, then refresh it by invoking the function
	// in the ViewManager
	var currentViewObjectU = localStorageManager.getItem(LOCAL_STORAGE_CURRENT_VIEW_KEY);

	if(locationId=="EntryPoint" && currentViewObjectU != null && currentViewObjectU != undefined){
		var currentViewObject = JSON.parse(currentViewObjectU);
		var secundaryView = currentViewObject["SecundaryView"];


		if( secundaryView !=""){
			if(currentViewObject.hasOwnProperty("Data")){
				var data = currentViewObject.Data;
				if(data.hasOwnProperty("ViewManagerParam")){
					viewManager[secundaryView](data.ViewManagerParam);
				}else{
					viewManager[secundaryView]();
				}
			}else{
				viewManager[secundaryView]();
			}
		}


	}

	//
	// check to see if the user is waiting for response after sking for reboot or shutdown
	//
	if(powerButtonDisabled){
		$("#MainPowerButton").attr("disabled", true);
		$("#MainPowerButton").addClass('btn-warning').removeClass('btn-success');
	}
	if(powerButtonRed){
		$("#MainPowerButton").addClass('btn-danger').removeClass('btn-warning').removeClass('btn-success');
	}
	if(inSearch){
		searchFunctions.generateAllGraphs();
	}
	//
	// now loop over every chart
	//
	var obj3 = chartDataSourcePointerHashMap["_map"];
	var obj4 = chartStyleHashMap["_map"];
	var obj5 = chartTimeStringHashMap["_map"];
	var obj6 = chartTitleHashMap["_map"];

	for(var pId in obj3) {
		var renderedDataSourceDeneWord= obj3[pId];
		var mainPanelVisualStyle = obj4[pId];
		var timeString = obj5[pId];
		var title = obj6[pId];

		if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_LINE_CHART){
			drawTimeSeriesLineChart(pId, renderedDataSourceDeneWord, title, timeString);	
		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MULTI_LINE_CHART){
			drawTimeSeriesMultiLineChart(pId, renderedDataSourceDeneWord, title, timeString);	
		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_CSV_MULTI_LINE_CHART){
			var fileName = renderedDataSourceDeneWord.Value.replace('$Webserver_Root/','');
			var units = renderedDataSourceDeneWord.Units;
			drawTimeSeriesMultiLineChart(pId, fileName, units);
		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_PIE_CHART){
			drawPieChart(pId,renderedDataSourceDeneWord, title);
		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_BAR_CHART){
			drawTimeSeriesBartChart(pId,renderedDataSourceDeneWord, title, timeString)
		}
	}





	//
	// set up the available ssids
	//
	var availableSSIDs = [];//currentOperationalData["Available SSIDs"];
	var option = $('<option></option>').attr("value", "").text("Select SSID");
	$("#AvailableNetworks").empty().append(option);

	// console.log("availableSSIDs=" + availableSSIDs);
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




