"use strict";
var denomeJSONObject;
var pulseJSONObject;

// Heart message log — ring buffer, newest first
var heartMessageLog = [];
var HEART_LOG_MAX = 150;

var heartLogTopics = [];

function heartLogMessage(topic, payload) {
	var now = new Date();
	var ts = now.toTimeString().slice(0, 8);
	var full = String(payload);
	var preview = full.length > 120 ? full.slice(0, 120) + '…' : full;
	var entry = { time: ts, topic: topic, preview: preview, full: full };
	heartMessageLog.unshift(entry);
	if (heartMessageLog.length > HEART_LOG_MAX) heartMessageLog.pop();
	// Track unique topics and update dropdown if new one seen
	if (heartLogTopics.indexOf(topic) === -1) {
		heartLogTopics.push(topic);
		heartLogTopics.sort();
		heartLogUpdateFilterOptions();
	}
	// Only add to visible log if it matches the current filter
	var $log = $('#heart-log-view');
	if ($log.length) {
		var filter = $('#heart-log-filter').val() || '';
		if (!filter || filter === topic) {
			$log.prepend(heartLogEntryHtml(entry));
			var rows = $log.children();
			if (rows.length > HEART_LOG_MAX) rows.last().remove();
		}
	}
}
function heartLogEntryHtml(entry) {
	return '<div style="padding:2px 0 2px 0;border-bottom:1px solid #1e2a3a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
		+ '<span style="color:#569cd6;flex-shrink:0;">' + entry.time + '</span>'
		+ '&nbsp;<span style="color:#dcdcaa;font-weight:bold;">' + entry.topic + '</span>'
		+ '&nbsp;<span style="color:#9cdcfe;font-size:10px;">' + entry.preview + '</span>'
		+ '</div>';
}
function heartLogBuildHtml() {
	return heartMessageLog.map(heartLogEntryHtml).join('');
}
function heartLogUpdateFilterOptions() {
	var $sel = $('#heart-log-filter');
	if (!$sel.length) return;
	var current = $sel.val();
	$sel.empty().append('<option value="">Show All</option>');
	heartLogTopics.forEach(function(t) {
		$sel.append('<option value="' + t + '"' + (t === current ? ' selected' : '') + '>' + t + '</option>');
	});
}
function heartLogApplyFilter() {
	var filter = $('#heart-log-filter').val() || '';
	var entries = filter ? heartMessageLog.filter(function(e) { return e.topic === filter; }) : heartMessageLog;
	$('#heart-log-view').html(entries.map(heartLogEntryHtml).join(''));
}
function heartLogDownload() {
	var lines = heartMessageLog.map(function(e) {
		return e.time + '\t' + e.topic + '\t' + (e.full || e.preview);
	});
	var text = 'Time\tTopic\tPayload\n' + lines.join('\n');
	var blob = new Blob([text], { type: 'text/plain' });
	var url = URL.createObjectURL(blob);
	var a = document.createElement('a');
	a.href = url;
	a.download = 'heart-log-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.txt';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
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
var telepathonCardDataCache = {};
var lastKnownCerebellumValues = {};
var telepathonDeviceTypeCache = {}; // keyed by device name, populated only from live TelepathonStatus packets
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
var organsRenderedThisCycle = false;

function teleonomeShowTab(paneId, clickedLi) {
	$(clickedLi).addClass('active').siblings('li').removeClass('active');
	$('#' + paneId).addClass('active').siblings('.tab-pane').removeClass('active');
	return false;
}

function openModal(id) {
	$('#' + id).modal('show');
}

function closeModal(id) {
	$('#' + id).modal('hide');
}

var organismInfoJsonData;
var telepathonsJsonData;

var organismIPInfoJsonData;
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
			 console.log("error getting commanda data:" + data.responseText);
			//alert("Error getting commanda data:" +  data.responseText);
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
			console.log(errorText);
		//	alert(errorText);
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

function displayHippocampusResponse(payload){

	var response = JSON.parse(payload);
	var data=response.Data;
	var telepathonName = response.telepathonName;
	var deneWordName= response.deneWordName;

	var results = analyzeTransmissionIntervals(data);

	var statsPanel='';
	statsPanel +='<div style="margin-right:10px;font-size:16px">Average Interval Between transmissions:' +Math.trunc(results.totalAverage) + " seconds</div>";
	statsPanel +='<table class="table table-striped text-center">';
	statsPanel +='<tr><th>Hour</th><th>Count</th><th>Avg(m:ss)</th><th>Std Dev</th><th>Min(m:ss)</th><th>Max(m:ss)</th></tr>';
	Object.entries(results.hours)
		.filter(([_, data]) => data.count > 0)
		.forEach(([hour, data]) => {
			if (data.min !== Infinity) {
				statsPanel +='<tr><td>'+hour.padStart(2, '0')+':00</td><td>'+data.count+'</td><td>' + formatTimeInterval(data.average)+'</td><td>' + data.stdDev.toFixed(2)+'</td><td>' + formatTimeInterval(data.min)+'</td><td>' + formatTimeInterval(data.max)+'</td></tr>';
			}
		});
	statsPanel +='<table>';

	var dataPanel = '';
	dataPanel += '<div style="font-size:13px;margin-bottom:6px;color:#555;">There are ' + data.length + ' samples</div>';
	dataPanel += '<table class="table table-striped table-condensed text-center" style="font-size:12px;">';
	dataPanel += '<tr><th>Time</th><th>Value</th><th>Time</th><th>Value</th></tr>';
	for (var dpi = 0; dpi < data.length; dpi += 2) {
		var left = data[dpi];
		var right = data[dpi + 1];
		dataPanel += '<tr><td>' + left.timeString + '</td><td>' + left.Value + '</td>';
		if (right) {
			dataPanel += '<td>' + right.timeString + '</td><td>' + right.Value + '</td>';
		} else {
			dataPanel += '<td></td><td></td>';
		}
		dataPanel += '</tr>';
	}
	dataPanel += '</table>';
	$('#telepathon-graph-modal .nav-link').on('click', function (e) {
		e.preventDefault()
		$(this).tab('show')
	})
	$('#telepathon-graph-modal').find('.nav-tabs .nav-link:first').tab('show')
	
	$('#telepathon-graph-title').html(telepathonName + "-"+deneWordName);
	$('#telepathon-graph').empty();
	showTelepathonGraph(data, window.lastTelepathonGraphRangeMs);
	$('#telepathon-stats').empty();
	$('#telepathon-stats').append(statsPanel);

	$('#telepathon-data').empty();
	$('#telepathon-data').append(dataPanel);
	$('#telepathon-graph-modal').modal('show');
	setTimeout(function() {
		$('#telepathon-graph-modal').css('z-index', 1060);
		$('.modal-backdrop').last().css('z-index', 1055);
	}, 0);

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

function updateOrganismIP(text){
	organismIPInfoJsonData = JSON.parse(text);
	refreshOrganismView();
}

function updateOrganismView(text){
	organismInfoJsonData = JSON.parse(text);
	refreshOrganismView();
}

var daffodilFunctionNames = {
	"1": "1 Flow Sensor", "2": "2 Flow Sensors", "3": "1 Flow + 1 Tank",
	"4": "1 Tank", "5": "2 Tanks", "6": "Septic Tank",
	"7": "Water Trough", "8": "Temp & Soil Moisture", "9": "Light Detector"
};
var daffodilOperatingStatusNames = {"0": "Unknown", "1": "Pulse Sleep", "2": "No LED", "3": "Full", "4": "Cloudy", "5": "Comma"};

function buildDaffodilContent(telepathon) {
	var denes = telepathon["Denes"] || [];
	var purposeDene = null, configDene = null, sensorsDene = null;
	for (var i = 0; i < denes.length; i++) {
		if (denes[i]["Name"] === "Purpose") purposeDene = denes[i];
		else if (denes[i]["Name"] === "Configuration") configDene = denes[i];
		else if (denes[i]["Name"] === "Sensors") sensorsDene = denes[i];
	}
	function getDW(dene, name) {
		if (!dene) return null;
		var dws = dene["DeneWords"] || [];
		for (var di = 0; di < dws.length; di++) {
			if (dws[di]["Name"] === name) return { value: dws[di]["Value"], units: dws[di]["Units"] || "" };
		}
		return null;
	}
	function getVal(dene, name, fallbackDene) {
		var r = getDW(dene, name);
		var dn = r ? dene["Name"] : null;
		if (!r && fallbackDene) { r = getDW(fallbackDene, name); dn = r ? fallbackDene["Name"] : null; }
		return r ? { value: r.value, units: r.units, deneName: dn } : null;
	}
	function mkGraphBtns(tpName, deneName, dwName, nucleus) {
		var nucleusAttr = nucleus ? ' data-nucleus="' + nucleus + '"' : '';
		var d = 'data-telepathonname="' + tpName + '" data-denename="' + deneName + '" data-denewordname="' + dwName + '"' + nucleusAttr;
		var btnCls = 'btn btn-xs btn-default telepathon-history-value';
		return '<button class="' + btnCls + '" ' + d + ' data-range="3600000">1h</button> ' +
			'<button class="' + btnCls + '" ' + d + ' data-range="86400000">24h</button> ' +
			'<button class="' + btnCls + ' hidden-xs" ' + d + ' data-range="604800000">7d</button>';
	}

	// ── LED snapshot helpers ──────────────────────────────────────────────────
	function ledSvg(onMap) {
		var W = 310, H = 190, R = 18, c = '';
		for (var i = 0; i < 15; i++) {
			var col = i % 5, row = Math.floor(i / 5);
			var x = 31 + col * 50, y = 35 + row * 58;
			var clr = onMap[i] || null;
			if (clr) {
				c += '<circle cx="'+x+'" cy="'+y+'" r="'+(R+8)+'" fill="'+clr+'" opacity="0.18"/>';
				c += '<circle cx="'+x+'" cy="'+y+'" r="'+(R+3)+'" fill="'+clr+'" opacity="0.30"/>';
				c += '<circle cx="'+x+'" cy="'+y+'" r="'+R+'" fill="'+clr+'"/>';
			} else {
				c += '<circle cx="'+x+'" cy="'+y+'" r="'+R+'" fill="#1a1a2e" stroke="#2d2d4a" stroke-width="1.5"/>';
			}
		}
		return '<svg viewBox="0 0 '+W+' '+H+'" style="width:90px;height:auto;border-radius:6px;display:block;margin:0 auto;">'
			+ '<rect width="'+W+'" height="'+H+'" rx="10" fill="#0c0c1a"/>' + c + '</svg>';
	}
	function snapPanel(title, svgHtml, subtitle) {
		return '<div style="text-align:center;padding:4px 6px;">' + svgHtml
			+ '<div style="color:#aaa;font-size:10px;margin-top:5px;text-transform:uppercase;letter-spacing:0.5px;">' + title + '</div>'
			+ (subtitle ? '<div style="color:#fff;font-size:11px;font-weight:bold;margin-top:2px;">' + subtitle + '</div>' : '')
			+ '</div>';
	}
	function computeBatLeds() {
		var m = {};
		var bv = getDW(purposeDene, 'Battery Voltage');
		var bc = getDW(purposeDene, 'Battery Current');
		var wf = getDW(purposeDene, 'Weather Fresh');
		var os = getDW(purposeDene, 'Operating Status');
		var voltage = bv ? parseFloat(bv.value) : 0;
		var current = bc ? parseFloat(bc.value) : 0;
		var fresh   = wf ? String(wf.value).toLowerCase() === 'true' : false;
		var opNum   = os ? parseInt(os.value) : 0;
		var batClr  = voltage >= 3.28 ? '#2060ff' : voltage >= 3.18 ? '#00e050' : voltage >= 3.10 ? '#ffc800' : '#ff2020';
		var srcClr  = current < -1.0 ? '#00e050' : current > 1.0 ? '#ff2020' : '#2060ff';
		m[1]=batClr; m[6]=batClr; m[7]=batClr; m[11]=batClr; m[12]=batClr;
		m[4] = srcClr;
		if (opNum === 3) m[9] = '#00e050';
		else if (opNum === 4) m[9] = '#ffc800';
		m[14] = fresh ? '#00e050' : '#ff2020';
		m[3] = '#00e050';
		return m;
	}
	function computeTempLeds() {
		var m = {};
		var tw = getDW(purposeDene, 'Outdoor Temperature') || getDW(sensorsDene, 'Outdoor Temperature');
		if (!tw) return m;
		var t = parseFloat(tw.value);
		if (isNaN(t) || t === -99) { [1,2,3,7,12].forEach(function(i){ m[i]='#ff2020'; }); return m; }
		var clr = t > 0 ? '#00e050' : t < 0 ? '#2080ff' : '#ffff20';
		var abs_t = Math.abs(t);
		var hd = Math.min(Math.floor(abs_t / 10), 4);
		var ld = Math.floor(abs_t % 10);
		var hdMap = [[],[0],[0,5],[0,5,10],[0,1,5,10]];
		hdMap[hd].forEach(function(i){ m[i]=clr; });
		var ldMap = [[],[4],[4,9],[4,9,14],[4,9,14,3],[4,9,14,3,8],[4,9,14,3,8,13],[4,9,14,3,8,13,2],[4,9,14,3,8,13,2,7],[4,9,14,3,8,13,2,7,12]];
		if (ldMap[ld]) ldMap[ld].forEach(function(i){ m[i]=clr; });
		return m;
	}
	function computeLevelLeds() {
		var m = {};
		var sw = getDW(purposeDene, 'Sceptic Available') || getDW(sensorsDene, 'Sceptic Available');
		if (!sw) return m;
		var pct = parseFloat(sw.value);
		if (isNaN(pct)) return m;
		var clr = pct <= 25 ? '#ff2020' : pct <= 50 ? '#ffdd00' : pct <= 75 ? '#00e050' : '#2080ff';
		[1,2,3,6,7,8,11,12,13].forEach(function(i){ m[i]=clr; });
		return m;
	}
	function computeWifiLeds() {
		var m = {};
		var ws = getDW(purposeDene, 'Wifi Status');
		var status = ws ? parseInt(ws.value) : 0;
		var ant = [1,2,3,5,9,11,12,13];
		if (status === 1) {
			// AP mode — green antenna
			ant.forEach(function(i){ m[i]='#00e050'; });
		} else if (status === 2) {
			// Station, no internet — blue antenna, red centre
			ant.forEach(function(i){ m[i]='#2080ff'; });
			m[7] = '#ff2020';
		} else if (status === 3) {
			// Station + internet — blue antenna, blue centre
			ant.forEach(function(i){ m[i]='#2080ff'; });
			m[7] = '#2080ff';
		}
		// status 0 or unknown — red antenna (WiFi off)
		if (status === 0 || !ws) ant.forEach(function(i){ m[i]='#ff2020'; });
		return m;
	}
	function computeLoraLeds() {
		var m = {};
		var lw = getDW(purposeDene, 'Lora Active');
		var clr = (lw && (String(lw.value).toLowerCase() === 'true' || String(lw.value) === '1')) ? '#00e050' : '#ff2020';
		[1,6,11,12].forEach(function(i){ m[i]=clr; });
		return m;
	}

	// Subheader values
	var secsDW = getDW(purposeDene, "Seconds Time");
	var funcDW = getDW(configDene, "Current Function");
	var funcNum = funcDW ? String(parseInt(funcDW.value)) : "";
	var functionLabel = daffodilFunctionNames[funcNum] || ("Function " + funcNum);
	var timestampStr = "";
	if (secsDW) {
		var ts = new Date(parseInt(secsDW.value) * 1000);
		timestampStr = ts.toLocaleString();
	}

	var tpName = telepathon["Name"];
	var safeId = tpName.replace(/[^a-zA-Z0-9]/g, '_');
	var html = '<div style="display:flex;flex-wrap:wrap;gap:20px;padding:2px 0 10px 0;margin-top:-8px;border-bottom:1px solid #eee;margin-bottom:10px;font-size:13px;">';
	html += '<span><strong>Time:</strong> ' + (timestampStr || (secsDW ? secsDW.value : '—')) + '</span>';
	html += '<span><strong>Function:</strong> ' + functionLabel + '</span>';
	html += '</div>';

	html += '<ul class="nav nav-pills" style="margin-bottom:10px;">';
	html += '<li class="active" onclick="return teleonomeShowTab(\'daff-results-' + safeId + '\', this)"><a href="#">Status</a></li>';
	html += '<li onclick="return teleonomeShowTab(\'daff-config-' + safeId + '\', this)"><a href="#">Config</a></li>';
	html += '</ul><div class="tab-content">';

	// Status tab — LED snapshot + sub-pills for data sections
	var ledSnapshot = '<div style="background:#0c0c1a;border-radius:10px;padding:10px 4px 8px;margin-bottom:14px;display:flex;flex-wrap:wrap;justify-content:space-around;gap:4px;">';
	var socSnap = getCerebellumDeneWordValue(tpName, DENEWORD_PULSE_TASK_BATTERY_SOC_LIVE);
	var socLabel = socSnap !== null ? 'SOC: ' + parseFloat(socSnap).toFixed(1) + '%' : null;
	ledSnapshot += snapPanel('Battery', ledSvg(computeBatLeds()), socLabel);
	ledSnapshot += snapPanel('Temperature', ledSvg(computeTempLeds()));
	ledSnapshot += snapPanel('Level',       ledSvg(computeLevelLeds()));
	ledSnapshot += snapPanel('WiFi',        ledSvg(computeWifiLeds()));
	ledSnapshot += snapPanel('LoRa',        ledSvg(computeLoraLeds()));
	ledSnapshot += '</div>';

	html += '<div class="tab-pane active" id="daff-results-' + safeId + '">';
	html += ledSnapshot;

	// Sub-pills (smaller than top-level pills)
	var subPillStyle = 'font-size:12px;padding:3px 9px;';
	html += '<ul class="nav nav-pills" style="margin-bottom:8px;flex-wrap:wrap;">';
	html += '<li class="active" onclick="return teleonomeShowTab(\'daff-sensors-' + safeId + '\', this)"><a href="#" style="' + subPillStyle + '">Sensors</a></li>';
	html += '<li onclick="return teleonomeShowTab(\'daff-power-' + safeId + '\', this)"><a href="#" style="' + subPillStyle + '">Power</a></li>';
	html += '<li onclick="return teleonomeShowTab(\'daff-comms-' + safeId + '\', this)"><a href="#" style="' + subPillStyle + '">Comms</a></li>';
	html += '<li onclick="return teleonomeShowTab(\'daff-diag-' + safeId + '\', this)"><a href="#" style="' + subPillStyle + '">Diagnostics</a></li>';
	html += '<li onclick="return teleonomeShowTab(\'daff-help-' + safeId + '\', this)"><a href="#" style="' + subPillStyle + '">Help</a></li>';
	html += '</ul>';
	html += '<div class="tab-content">';

	var noGraphFields = {"Op Mode":1,"Weather Fresh":1,"INA219 Found":1,"BH1750 Found":1,"ADS1115 Found":1,"RTC Found":1,"DS18B20 Found":1,"SHT Found":1,"Invalid Time":1,"Using Solar Power":1,"Local Time":1,"Source Original Time":1,"Operating Status":1};
	var cardGroups = [
		{ id: 'daff-sensors-' + safeId, title: "Sensors", fields: ["Measured Height", "Sceptic Available", "Light Level", "Outdoor Temperature", "Outdoor Humidity", "Internal Temperature"] },
		{ id: 'daff-power-' + safeId,   title: "Power",   fields: ["Led Brightness", "Battery Voltage", "Operating Status", "Async Data", "Wake Time Sec", "Sleep Time", "Estimated Runtime", "Battery Current"] },
		{ id: 'daff-comms-' + safeId,   title: "Comms",   fields: ["rssi", "snr", "Digital Stables Upload", "Lora Active", "ds Last Upload"] },
		{ id: 'daff-diag-' + safeId,    title: "Diagnostics", fields: ["RTC Battery Volt", "Op Mode", "Weather Fresh", "INA219 Found", "BH1750 Found", "ADS1115 Found", "RTC Found", "DS18B20 Found", "SHT Found", "Invalid Time", "Using Solar Power", "Source Original Time", "Local Time"] }
	];
	for (var ci = 0; ci < cardGroups.length; ci++) {
		var card = cardGroups[ci];
		html += '<div class="tab-pane' + (ci === 0 ? ' active' : '') + '" id="' + card.id + '">';
		html += '<table class="table table-condensed table-striped" style="margin-bottom:0;font-size:12px;">';
		for (var fi = 0; fi < card.fields.length; fi++) {
			var fieldName = card.fields[fi];
			var r = getVal(purposeDene, fieldName, sensorsDene);
			if (!r) continue;
			var displayVal = r.value;
			var displayUnits = r.units;
			if (fieldName === "Operating Status") {
				displayVal = daffodilOperatingStatusNames[String(parseInt(r.value))] || r.value;
			}
			if (fieldName === "Light Level" && displayUnits && displayUnits.toLowerCase() === 'meter') {
				displayUnits = 'Lux';
			}
			var valCell = '<strong>' + displayVal + (displayUnits ? ' ' + displayUnits : '') + '</strong>';
			var btnCell = noGraphFields[fieldName] ? '' : '<td style="text-align:right;white-space:nowrap;padding:2px 4px;">' + mkGraphBtns(tpName, r.deneName, fieldName) + '</td>';
			html += '<tr><td style="width:40%;">' + fieldName + '</td><td>' + valCell + '</td>' + btnCell + '</tr>';
		}
		if (card.title === "Power") {
			var socVal = getCerebellumDeneWordValue(tpName, DENEWORD_PULSE_TASK_BATTERY_SOC_LIVE);
			if (socVal !== null) {
				html += '<tr><td style="width:40%;">Battery SOC</td><td><strong>' + parseFloat(socVal).toFixed(1) + '%</strong></td>'
					+ '<td style="text-align:right;white-space:nowrap;padding:2px 4px;">' + mkGraphBtns(tpName, "Purpose", DENEWORD_PULSE_TASK_BATTERY_SOC_LIVE) + '</td></tr>';
			}
		}
		html += '</table></div>';
	}

	// Help sub-tab — LED panel descriptions
	html += '<div class="tab-pane" id="daff-help-' + safeId + '">';
	html += '<div style="font-size:12px;line-height:1.6;">';

	function helpSection(title, color, rows) {
		var s = '<div style="margin-bottom:14px;">';
		s += '<div style="font-weight:bold;font-size:13px;color:' + color + ';border-bottom:1px solid #eee;padding-bottom:3px;margin-bottom:6px;">' + title + '</div>';
		s += '<table style="width:100%;border-collapse:collapse;">';
		for (var hi = 0; hi < rows.length; hi++) {
			s += '<tr><td style="width:36%;padding:2px 6px 2px 0;color:#555;vertical-align:top;">' + rows[hi][0] + '</td>'
				+ '<td style="padding:2px 0;vertical-align:top;">' + rows[hi][1] + '</td></tr>';
		}
		s += '</table></div>';
		return s;
	}

	html += helpSection('Battery', '#2060ff', [
		['Voltage color', '<span style="color:#2060ff;font-weight:bold;">Blue</span> ≥3.28 V (excellent) &nbsp; <span style="color:#00b040;font-weight:bold;">Green</span> ≥3.18 V (good) &nbsp; <span style="color:#cc8800;font-weight:bold;">Yellow</span> ≥3.10 V (low) &nbsp; <span style="color:#cc2020;font-weight:bold;">Red</span> &lt;3.10 V (critical)'],
		['Source (LED 5)',  '<span style="color:#00b040;font-weight:bold;">Green</span> = charging/solar &nbsp; <span style="color:#cc2020;font-weight:bold;">Red</span> = discharging &nbsp; <span style="color:#2060ff;font-weight:bold;">Blue</span> = stable/idle'],
		['Op mode (LED 10)', '<span style="color:#00b040;font-weight:bold;">Green</span> = Full operation &nbsp; <span style="color:#cc8800;font-weight:bold;">Yellow</span> = Cloudy (reduced)'],
		['Weather Forecast (LED 15)', '<span style="color:#00b040;font-weight:bold;">Green</span> = weather data fresh &nbsp; <span style="color:#cc2020;font-weight:bold;">Red</span> = weather data stale'],
		['Comma Records (LED 4)', '<span style="color:#00b040;font-weight:bold;">Green</span> = no comma records pending &nbsp; <span style="color:#2060ff;font-weight:bold;">Blue</span> = transmitting &nbsp; <span style="color:#cc8800;font-weight:bold;">Yellow</span> = comma records queued']
	]);

	html += helpSection('Temperature', '#00b040', [
		['Sign color', '<span style="color:#00b040;font-weight:bold;">Green</span> = above 0 °C &nbsp; <span style="color:#2060ff;font-weight:bold;">Blue</span> = below 0 °C &nbsp; <span style="color:#cccc00;font-weight:bold;">Yellow</span> = exactly 0 °C'],
		['Tens digit', 'Left-column LEDs (0,5,10,1,6) — number of lit LEDs encodes the tens value (0–4)'],
		['Units digit', 'Right-column LEDs (4,9,14,3,8,13,2,7,12) — LEDs light progressively for 1–9'],
		['Error', '<span style="color:#cc2020;font-weight:bold;">Red</span> on a fixed pattern = sensor read failure or invalid value']
	]);

	html += helpSection('Level (Sceptic)', '#27ae60', [
		['Reading', 'Nine LEDs in a 3×3 grid, all the same color, showing tank capacity %'],
		['Colors', '<span style="color:#2060ff;font-weight:bold;">Blue</span> &gt;75% (full) &nbsp; <span style="color:#00b040;font-weight:bold;">Green</span> 26–75% (normal) &nbsp; <span style="color:#cc8800;font-weight:bold;">Yellow</span> 11–25% (low) &nbsp; <span style="color:#cc2020;font-weight:bold;">Red</span> ≤10% (critical)'],
		['No LEDs', 'Sensor not fitted or no reading available']
	]);

	html += helpSection('WiFi', '#2080ff', [
		['All red', 'WiFi is disabled or turned off'],
		['All green', 'AP mode — the Daffodil is broadcasting its own hotspot'],
		['Blue + red center', 'Connected to WiFi network but no internet access'],
		['Blue + blue center', 'Connected to WiFi with full internet access']
	]);

	html += helpSection('LoRa', '#9b59b6', [
		['Green', 'LoRa radio is active and transmitting data to the gateway'],
		['Red', 'LoRa radio is inactive or not connected']
	]);

	html += '</div></div>'; // help content + tab-pane

	html += '</div>'; // inner tab-content
	html += '</div>'; // daff-results tab-pane

	// Config tab
	html += '<div class="tab-pane" id="daff-config-' + safeId + '">';
	html += '<table class="table table-condensed table-striped" style="font-size:13px;">';
	var configFields = configDene ? (configDene["DeneWords"] || []) : [];
	for (var cfi = 0; cfi < configFields.length; cfi++) {
		var cfName = configFields[cfi]["Name"];
		var cfVal = configFields[cfi]["Value"];
		if (cfName === "Current Function") cfVal = functionLabel;
		html += '<tr><td style="width:50%;">' + cfName + '</td><td><strong>' + cfVal + '</strong></td></tr>';
	}
	var sensFields = sensorsDene ? (sensorsDene["DeneWords"] || []) : [];
	for (var sfi = 0; sfi < sensFields.length; sfi++) {
		html += '<tr><td style="width:50%;">' + sensFields[sfi]["Name"] + '</td><td><strong>' + sensFields[sfi]["Value"] + (sensFields[sfi]["Units"] ? ' ' + sensFields[sfi]["Units"] : '') + '</strong></td></tr>';
	}
	html += '</table></div>';

	html += '</div>'; // outer tab-content
	return html;
}

// Field names below come from LangleyDataDeserializer.java (com.teleonome.framework
// .microcontroller.annabellemicrocontroller) — the "Purpose" DeneWords it emits for a
// Langley electric-fence monitor. Operating Status shares the same 1-5 taxonomy as
// Daffodil (see LangleyData.h), so daffodilOperatingStatusNames is reused for its label.
function buildLangleyContent(telepathon) {
	var denes = telepathon["Denes"] || [];
	var purposeDene = null, configDene = null;
	for (var i = 0; i < denes.length; i++) {
		if (denes[i]["Name"] === "Purpose") purposeDene = denes[i];
		else if (denes[i]["Name"] === "Configuration") configDene = denes[i];
	}
	var pw = purposeDene ? (purposeDene["DeneWords"] || []) : [];
	var cw = configDene ? (configDene["DeneWords"] || []) : [];

	function findDW(words, name) {
		for (var fi = 0; fi < words.length; fi++) if (words[fi]["Name"] === name) return words[fi];
		return null;
	}
	function mkGraphBtns(tpName, deneName, dwName) {
		var d = 'data-telepathonname="' + tpName + '" data-denename="' + deneName + '" data-denewordname="' + dwName + '"';
		var btnCls = 'btn btn-xs btn-default telepathon-history-value';
		return '<button class="' + btnCls + '" ' + d + ' data-range="3600000">1h</button> ' +
			'<button class="' + btnCls + '" ' + d + ' data-range="86400000">24h</button> ' +
			'<button class="' + btnCls + ' hidden-xs" ' + d + ' data-range="604800000">7d</button>';
	}
	function vitalCard(label, val, unit, color) {
		return '<div class="col-xs-4 col-sm-2" style="margin-bottom:8px;padding:2px;">' +
			'<div style="border-radius:10px;overflow:hidden;">' +
			'<div style="padding:8px 4px;color:white;text-align:center;background:' + color + ';">' +
			'<div style="font-size:9px;text-transform:uppercase;font-weight:bold;opacity:0.9;">' + label + '</div>' +
			'<div style="font-size:16px;font-weight:800;">' + val + unit + '</div>' +
			'</div></div></div>';
	}
	function row(label, dw, tpName, deneName) {
		if (!dw) return '';
		return '<tr><td style="width:40%;">' + label + '</td><td><strong>' + dw["Value"] + (dw["Units"] ? ' ' + dw["Units"] : '') + '</strong></td>' +
			'<td style="text-align:right;white-space:nowrap;padding:2px 4px;">' + mkGraphBtns(tpName, deneName, dw["Name"]) + '</td></tr>';
	}

	var tpName = telepathon["Name"];
	var safeId = tpName.replace(/[^a-zA-Z0-9]/g, '_');

	var localTimeDW = findDW(pw, "Local Time");
	var fenceAvgDW = findDW(pw, "Fence Voltage Avg");
	var opStatusDW = findDW(pw, "Operating Status");
	var opNum = opStatusDW ? String(parseInt(opStatusDW["Value"])) : null;
	var opLabel = opNum !== null ? (daffodilOperatingStatusNames[opNum] || ('Mode ' + opNum)) : '—';
	var battDW = findDW(pw, "Battery Voltage");
	var solarDW = findDW(pw, "Solar Voltage");
	var energizerDW = findDW(pw, "Energizer Battery Voltage");
	var tempDW = findDW(pw, "Internal Temperature");
	var rssiDW = findDW(pw, "rssi");

	// Thresholds are a reasonable default for a working energizer (a healthy fence
	// typically pulses well above 3kV; under ~1kV it's generally not delivering an
	// effective shock) — adjust here if the real-world numbers say otherwise.
	var fenceKV = fenceAvgDW ? parseFloat(fenceAvgDW["Value"]) : null;
	var fenceColor = fenceKV === null ? '#999' : (fenceKV >= 3 ? '#27ae60' : (fenceKV >= 1 ? '#f39c12' : '#e74c3c'));

	var html = '<div style="background:white;">';
	html += '<div style="padding:2px 0 10px 0;margin-top:-8px;border-bottom:1px solid #eee;margin-bottom:10px;font-size:13px;color:#888;">';
	html += (localTimeDW ? localTimeDW["Value"] : '') + '&nbsp;&nbsp;' + opLabel;
	html += '</div>';

	html += '<ul class="nav nav-pills" style="margin-bottom:10px;">';
	html += '<li class="active" onclick="return teleonomeShowTab(\'lang-status-' + safeId + '\', this)"><a href="#">Status</a></li>';
	html += '<li onclick="return teleonomeShowTab(\'lang-config-' + safeId + '\', this)"><a href="#">Config</a></li>';
	html += '</ul><div class="tab-content">';

	html += '<div class="tab-pane active" id="lang-status-' + safeId + '">';
	html += '<div class="row" style="margin-bottom:8px;">';
	html += vitalCard('Fence Voltage', fenceKV !== null ? fenceKV.toFixed(1) : '—', 'kV', fenceColor);
	if (battDW) html += vitalCard('Battery', battDW["Value"], 'V', '#3498db');
	if (solarDW) html += vitalCard('Solar', solarDW["Value"], 'V', '#3498db');
	if (energizerDW) html += vitalCard('Energizer Batt', energizerDW["Value"], 'V', '#3498db');
	if (tempDW) html += vitalCard('Temp', tempDW["Value"], '°C', '#3498db');
	if (rssiDW) { var rssiV = parseFloat(rssiDW["Value"]); html += vitalCard('Signal', rssiDW["Value"], '', rssiV > -95 ? '#27ae60' : '#f39c12'); }
	html += '</div>';

	html += '<table class="table table-condensed table-striped" style="font-size:12px;">';
	html += row('Fence Voltage Min', findDW(pw, 'Fence Voltage Min'), tpName, 'Purpose');
	html += row('Fence Voltage Max', findDW(pw, 'Fence Voltage Max'), tpName, 'Purpose');
	html += row('Pulse Count', findDW(pw, 'Pulse Count'), tpName, 'Purpose');
	html += row('Energizer Battery Current', findDW(pw, 'Energizer Battery Current'), tpName, 'Purpose');
	html += row('External Battery Voltage', findDW(pw, 'External Battery Voltage'), tpName, 'Purpose');
	html += row('Solar Current', findDW(pw, 'Solar Current'), tpName, 'Purpose');
	html += row('Battery Current', findDW(pw, 'Battery Current'), tpName, 'Purpose');
	html += row('Seconds Since Last Pulse', findDW(pw, 'Seconds Since Last Pulse'), tpName, 'Purpose');
	html += row('snr', findDW(pw, 'snr'), tpName, 'Purpose');
	html += row('rssi', rssiDW, tpName, 'Purpose');
	html += row('RTC Battery Voltage', findDW(pw, 'RTC Battery Voltage'), tpName, 'Purpose');
	html += '</table>';
	html += '</div>'; // status pane

	html += '<div class="tab-pane" id="lang-config-' + safeId + '">';
	html += '<table class="table table-condensed table-striped" style="font-size:13px;">';
	for (var ci = 0; ci < cw.length; ci++) {
		html += '<tr><td style="width:50%;">' + cw[ci]["Name"] + '</td><td><strong>' + cw[ci]["Value"] + (cw[ci]["Units"] ? ' ' + cw[ci]["Units"] : '') + '</strong></td></tr>';
	}
	html += '</table></div>';

	html += '</div>'; // tab-content
	html += '</div>';
	return html;
}

function buildTelepathonDetailContent(telepathon) {
	var denes = telepathon["Denes"] || [];
	if (denes.length === 0) return '<p class="text-muted text-center" style="padding:20px;">No data available.</p>';
	var safeId = telepathon["Name"].replace(/[^a-zA-Z0-9]/g, '_');
	var html = '<ul class="nav nav-pills" style="margin-bottom:12px;flex-wrap:wrap;">';
	for (var pi = 0; pi < denes.length; pi++) {
		var paneId = 'tpDetail-' + safeId + '-' + pi;
		html += '<li' + (pi === 0 ? ' class="active"' : '') +
			' onclick="return teleonomeShowTab(\'' + paneId + '\', this)" style="margin-bottom:4px;">' +
			'<a href="#">' + denes[pi]["Name"] + '</a></li>';
	}
	html += '</ul><div class="tab-content">';
	for (var ti = 0; ti < denes.length; ti++) {
		var paneId2 = 'tpDetail-' + safeId + '-' + ti;
		html += '<div class="tab-pane' + (ti === 0 ? ' active' : '') + '" id="' + paneId2 + '">';
		html += '<table class="table table-condensed table-striped">';
		var dws = denes[ti]["DeneWords"] || [];
		for (var j = 0; j < dws.length; j++) {
			html += '<tr><td>' + dws[j]["Name"] + '</td><td><strong>' + dws[j]["Value"] + '</strong>' +
				(dws[j]["Units"] ? ' ' + dws[j]["Units"] : '') + '</td></tr>';
		}
		html += '</table></div>';
	}
	html += '</div>';
	return html;
}

function getCerebellumDeneWordValue(telepathonType, deneWordName) {
	var cacheKey = telepathonType + ':' + deneWordName;
	if (nucleiJSONArray) {
		for (var _ni = 0; _ni < nucleiJSONArray.length; _ni++) {
			if (nucleiJSONArray[_ni]["Name"] === "Purpose") {
				var _chains = nucleiJSONArray[_ni]["DeneChains"] || [];
				for (var _ci = 0; _ci < _chains.length; _ci++) {
					if (_chains[_ci]["Name"] === "Cerebellum") {
						var _denes = _chains[_ci]["Denes"] || [];
						for (var _di = 0; _di < _denes.length; _di++) {
							if (_denes[_di]["Name"] === telepathonType) {
								var _dws = _denes[_di]["DeneWords"] || [];
								for (var _wi = 0; _wi < _dws.length; _wi++) {
									if (_dws[_wi]["Name"] === deneWordName) {
										lastKnownCerebellumValues[cacheKey] = _dws[_wi]["Value"];
										return _dws[_wi]["Value"];
									}
								}
							}
						}
					}
				}
			}
		}
	}
	// Cerebellum data can be momentarily absent from a given pulse snapshot
	// (it's a periodic task, not present on every pulse). Fall back to the
	// last known value rather than flashing the UI to blank.
	return cacheKey in lastKnownCerebellumValues ? lastKnownCerebellumValues[cacheKey] : null;
}

function computeTelepathonAgeStatus(telepathon) {
	var name = telepathon["Name"];
	var deviceType = telepathonDeviceTypeCache[name] || '';
	var localTime = '';
	var purposeWords = [];
	var denes = telepathon["Denes"] || [];
	for (var di = 0; di < denes.length; di++) {
		if (denes[di]["Name"] === "Configuration") {
			var cws = denes[di]["DeneWords"] || [];
			for (var ci = 0; ci < cws.length; ci++) {
				if (cws[ci]["Name"] === "Device Type Id" && !deviceType) deviceType = cws[ci]["Value"];
			}
		}
		if (denes[di]["Name"] === "Purpose") {
			var pws = denes[di]["DeneWords"] || [];
			for (var pi = 0; pi < pws.length; pi++) {
				if (pws[pi]["Name"] === "Local Time") localTime = pws[pi]["Value"];
			}
			purposeWords = pws;
		}
	}
	function findPW(n) {
		for (var fi = 0; fi < purposeWords.length; fi++) if (purposeWords[fi]["Name"] === n) return purposeWords[fi];
		return null;
	}
	var opStatusDW = findPW("Operating Status");
	var opNum = opStatusDW ? String(parseInt(opStatusDW["Value"])) : null;
	var dataTimestampMs = (function() {
		var m = String(localTime || '').match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
		if (!m) return null;
		return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]), parseInt(m[4]), parseInt(m[5]), parseInt(m[6])).getTime();
	})();
	var ageSeconds = (dataTimestampMs !== null ? (Date.now() - dataTimestampMs) : (Date.now() - pulseTimestampMilliseconds)) / 1000;
	function rangeColor(green, yellow) {
		return ageSeconds < green ? '#27ae60' : (ageSeconds < yellow ? '#f39c12' : '#e74c3c');
	}
	var statusColor;
	if (name === "Chinampa") {
		statusColor = rangeColor(120, 240);
	} else if (deviceType === "Daffodil" || deviceType === "Langley") {
		if (opNum === "4") {
			var cloudySleepDW = findPW("Sleep Time");
			var cloudySleepSec = cloudySleepDW ? parseFloat(cloudySleepDW["Value"]) : null;
			statusColor = cloudySleepSec ?
				(ageSeconds <= cloudySleepSec ? '#27ae60' : (ageSeconds <= cloudySleepSec * 2 ? '#f39c12' : '#e74c3c')) :
				rangeColor(120, 240);
		} else {
			statusColor = rangeColor(120, 240);
		}
	} else {
		statusColor = rangeColor(60, 120);
	}
	return { ageSeconds: ageSeconds, statusColor: statusColor };
}

function buildTelepathonCardView(telepathon) {
	var name = telepathon["Name"];
	var safeId = name.replace(/[^a-zA-Z0-9]/g, '_');
	var modalId = 'tpModal_' + safeId;

	// Prefer the live-packet cache over the denome value which can be stale/garbled.
	var deviceType = telepathonDeviceTypeCache[name] || '';
	var localTime = '';
	var purposeWords = [];
	var sensorWords = [];
	var denes = telepathon["Denes"] || [];
	for (var di = 0; di < denes.length; di++) {
		if (denes[di]["Name"] === "Configuration") {
			var cws = denes[di]["DeneWords"] || [];
			for (var ci = 0; ci < cws.length; ci++) {
				if (cws[ci]["Name"] === "Device Type Id" && !deviceType) deviceType = cws[ci]["Value"];
			}
		}
		if (denes[di]["Name"] === "Purpose") {
			var pws = denes[di]["DeneWords"] || [];
			for (var pi = 0; pi < pws.length; pi++) {
				if (pws[pi]["Name"] === "Local Time") localTime = pws[pi]["Value"];
			}
			purposeWords = pws;
		}
		if (denes[di]["Name"] === "Sensors") {
			sensorWords = denes[di]["DeneWords"] || [];
		}
	}

	function findPW(n) {
		for (var fi = 0; fi < purposeWords.length; fi++) if (purposeWords[fi]["Name"] === n) return purposeWords[fi];
		return null;
	}
	function findSW(n) {
		for (var fi = 0; fi < sensorWords.length; fi++) if (sensorWords[fi]["Name"] === n) return sensorWords[fi];
		return null;
	}
	function levelColor(heightDW, measuredDW) {
		if (!heightDW || !measuredDW) return null;
		var min = parseFloat(heightDW["Minimum"]);
		var max = parseFloat(heightDW["Maximum"]);
		if (isNaN(min) || isNaN(max)) return null;
		var level = parseFloat(heightDW["Value"]) - parseFloat(measuredDW["Value"]);
		if (level < min) return 'Red';
		if (level > max) return 'Blue';
		return 'Green';
	}

	var opStatusDW = findPW("Operating Status");
	var opNum = opStatusDW ? String(parseInt(opStatusDW["Value"])) : null;

	var dataTimestampMs = (function() {
		var m = String(localTime || '').match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
		if (!m) return null;
		return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]), parseInt(m[4]), parseInt(m[5]), parseInt(m[6])).getTime();
	})();
	var ageSeconds = (dataTimestampMs !== null ? (Date.now() - dataTimestampMs) : (Date.now() - pulseTimestampMilliseconds)) / 1000;

	function rangeColor(green, yellow) {
		return ageSeconds < green ? '#27ae60' : (ageSeconds < yellow ? '#f39c12' : '#e74c3c');
	}

	var statusColor;
	if (name === "Chinampa") {
		statusColor = rangeColor(120, 240);
	} else if (deviceType === "Daffodil" || deviceType === "Langley") {
		if (opNum === "4") {
			var cloudySleepDW = findPW("Sleep Time");
			var cloudySleepSec = cloudySleepDW ? parseFloat(cloudySleepDW["Value"]) : null;
			statusColor = cloudySleepSec ?
				(ageSeconds <= cloudySleepSec ? '#27ae60' : (ageSeconds <= cloudySleepSec * 2 ? '#f39c12' : '#e74c3c')) :
				rangeColor(120, 240);
		} else {
			statusColor = rangeColor(120, 240);
		}
	} else {
		statusColor = rangeColor(60, 120);
	}

	// Build device-specific status info line
	var statusExtra = '';
	var opModeHtml = '';
	if (name === "Chinampa") {
		var alertCodeDW = findPW("Alert Code");
		var ac = alertCodeDW ? parseInt(alertCodeDW["Value"]) : 99;
		var alertMsgs = {0:"Initializing...",1:"Fish Tank Data Stale",2:"Sump Trough Stale",3:"FT & Sump Data Stale",4:"Solenoid Open / Low Flow",5:"Sump Level Too Low",6:"System Low In Water"};
		if (ac !== 99) {
			opModeHtml = '<div style="background:#fadbd8;color:#000;font-size:11px;font-weight:bold;padding:0 6px;margin-top:2px;border-radius:4px;width:100%;box-sizing:border-box;">' + (alertMsgs[ac] || ("Alert Code " + ac)) + '</div>';
		} else {
			opModeHtml = '<div style="background:#d5f5e3;color:#000;font-size:11px;font-weight:bold;padding:0 6px;margin-top:2px;border-radius:4px;width:100%;box-sizing:border-box;">&nbsp;</div>';
		}

		var fishColor = levelColor(findSW("Fish Tank Height"), findPW("Fish Tank Measured Height")) || 'Green';
		var sumpColor = levelColor(findSW("Sump TroughHeight"), findPW("Sump Trough Measured Height")) || 'Green';
		var levelColorHexMap = {Red:'#e74c3c', Green:'#27ae60', Blue:'#2060ff'};
		var fishColorHex = levelColorHexMap[fishColor];
		var sumpColorHex = levelColorHexMap[sumpColor];

		var fishFlowDW = findPW("Fish Tank Outflow Flow Rate");
		var fishFlowStr = fishFlowDW ? (fishFlowDW["Value"] + (fishFlowDW["Units"] ? ' ' + fishFlowDW["Units"] : '')) : '—';
		var fishLabel = window.innerWidth < 768 ? 'F' : 'Fish';
		var sumpLabel = window.innerWidth < 768 ? 'S' : 'Sump';
		statusExtra = '<span style="font-size:11px;color:#555;">' + fishLabel + ': ' + fishFlowStr +
			'&nbsp;<span style="color:' + fishColorHex + ';font-weight:bold;">' + fishColor + '</span>' +
			'&nbsp;&nbsp;' + sumpLabel + ': <span style="color:' + sumpColorHex + ';font-weight:bold;">' + sumpColor + '</span></span>';
	} else {
		if ((deviceType === "Daffodil" || deviceType === "Langley") && opStatusDW) {
			var opLabel = daffodilOperatingStatusNames[opNum] || ('Mode ' + opNum);
			var sleepStr = '';
			if (opNum === "1" || opNum === "4" || opNum === "5") {
				var sleepDW = findPW("Sleep Time");
				if (sleepDW) sleepStr = ', ' + sleepDW["Value"] + (sleepDW["Units"] ? sleepDW["Units"] : 's');
			}
			opModeHtml = '<div style="font-size:11px;color:#555;margin-top:2px;">' + opLabel + sleepStr + '</div>';
		}
		var battDW = findPW("Battery Voltage");
		var extras = [];
		if (battDW) extras.push(battDW["Value"] + 'V');
		if (deviceType === "Daffodil") {
			var socVal = getCerebellumDeneWordValue(name, DENEWORD_PULSE_TASK_BATTERY_SOC_LIVE);
			if (socVal !== null) extras.push('SOC: ' + parseFloat(socVal).toFixed(1) + '%');
		}
		if (deviceType === "Langley") {
			var fenceAvgCardDW = findPW("Fence Voltage Avg");
			if (fenceAvgCardDW) extras.push('Fence: ' + fenceAvgCardDW["Value"] + 'kV');
		}
		if (extras.length) statusExtra = '<span style="font-size:11px;color:#555;margin-left:4px;">' + extras.join('  ') + '</span>';
	}

	var detailHtml = name === "Chinampa" ? buildChinampaContent(telepathon) :
		deviceType === "Daffodil" ? buildDaffodilContent(telepathon) :
		deviceType === "Langley" ? buildLangleyContent(telepathon) :
		buildTelepathonDetailContent(telepathon);

	if (!$('#' + modalId).length) {
		$('body').append(
			'<div class="modal fade" id="' + modalId + '" tabindex="-1" role="dialog">' +
			'<div class="modal-dialog modal-lg"><div class="modal-content">' +
			'<div class="modal-header">' +
			'<button type="button" class="close" onclick="closeModal(\'' + modalId + '\')">&times;</button>' +
			'<h4 class="modal-title">' + name + '</h4></div>' +
			'<div class="modal-body" id="' + modalId + 'Body"></div>' +
			'<div class="modal-footer">' +
			'<button type="button" class="btn btn-default" onclick="closeModal(\'' + modalId + '\')">Close</button>' +
			'</div></div></div>'
		);
	}
	$('#' + modalId + 'Body').html(detailHtml);

	var imgSrc = 'images/' + deviceType + '.svg';

	var html = '<div class="col-xs-12 col-sm-6 col-md-4" id="tpCardCol_' + safeId + '" style="margin-bottom:16px;padding:6px;">';
	html += '<div style="border-radius:12px;border:1px solid #ddd;overflow:hidden;cursor:pointer;' +
		'box-shadow:0 2px 8px rgba(0,0,0,0.08);background:white;display:flex;align-items:stretch;" ' +
		'onclick="openModal(\'' + modalId + '\')">';
	html += '<div style="flex:0 0 110px;background:white;padding:10px;display:flex;align-items:center;' +
		'justify-content:center;border-right:1px solid #eee;">';
	html += '<img src="' + imgSrc + '" style="width:90px;height:90px;object-fit:contain;" onerror="this.style.display=\'none\'">';
	html += '</div>';
	var cardAgeSec = Math.floor(ageSeconds);
	html += '<div id="tpText_' + safeId + '" style="flex:1;padding:14px;background:#fafafa;display:flex;flex-direction:column;justify-content:center;">';
	html += '<div style="font-weight:bold;font-size:16px;color:#2c3e50;">' + name + '</div>';
	if (localTime) {
		var localTimeRaw = String(localTime);
		var localTimeShort = localTimeRaw.replace(/^\d{4}\//, '');
		if (window.innerWidth < 768) {
			var dm = localTimeRaw.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(.*)$/);
			if (dm) {
				var now = new Date();
				var todayStr = now.getFullYear() + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + String(now.getDate()).padStart(2, '0');
				var dateStr = dm[1] + '/' + dm[2] + '/' + dm[3];
				if (dateStr === todayStr) localTimeShort = dm[4];
			}
		}
		html += '<div style="font-size:12px;color:#888;margin-top:4px;">' + localTimeShort +
			'&nbsp;<span id="tpAge_' + safeId + '" style="color:' + statusColor + ';font-weight:bold;">(' + cardAgeSec + 's ago)</span></div>';
	}
	if (opModeHtml) html += opModeHtml;
	html += '<div style="margin-top:4px;text-align:center;">';
	html += statusExtra;
	html += '</div>';
	html += '</div>';
	html += '</div>';
	html += '</div>';
	return html;
}

function buildTelepathonPillsContent(telepathon) {
	var telepathonName = telepathon["Name"];
	var safeId = telepathonName.replace(/[^a-zA-Z0-9]/g, '_');
	var serialnumber = telepathon["Serial Number"] || "";
	var denes = telepathon["Denes"];
	var purposeDene = null, configDene = null;
	for (var dtd = 0; dtd < denes.length; dtd++) {
		if (denes[dtd]["Name"] === "Purpose") purposeDene = denes[dtd];
		if (denes[dtd]["Name"] === "Configuration") configDene = denes[dtd];
	}
	var localDate = purposeDene ? (getDeneWordFromTelepathon(telepathon, 'Purpose', 'Local Time', DENEWORD_VALUE_ATTRIBUTE) || "") : "";

	var html = '<div id="' + telepathonName + '" style="margin:15px;border-radius:5px;background:lightblue" class="col-lg-4 col-md-4 col-sm-5 col-xs-11 text-center top-buffer">';
	html += '<div style="font-size:16px">' + telepathonName + '</div>';
	html += '<div style="font-size:13px">' + localDate + '</div>';
	if (serialnumber) html += '<div style="font-size:13px">' + serialnumber + '</div>';
	html += '<ul class="nav nav-pills nav-justified" style="margin-top:8px;">';
	html += '<li role="presentation" class="active"><a href="#purpose-' + safeId + '" data-toggle="tab">Purpose</a></li>';
	html += '<li role="presentation"><a href="#config-' + safeId + '" data-toggle="tab">Configuration</a></li>';
	html += '</ul>';
	html += '<div class="tab-content" style="text-align:left;margin-top:5px;">';
	html += '<div role="tabpanel" class="tab-pane active" id="purpose-' + safeId + '">';
	html += '<table class="table table-condensed table-striped">';
	if (purposeDene) {
		var pWords = purposeDene["DeneWords"];
		for (var dtpw = 0; dtpw < pWords.length; dtpw++) {
			var dtUnits = pWords[dtpw]["Units"] ? ' ' + pWords[dtpw]["Units"] : "";
			html += '<tr><td>' + pWords[dtpw]["Name"] + '</td><td><strong>' + pWords[dtpw]["Value"] + '</strong>' + dtUnits + '</td></tr>';
		}
	}
	html += '</table></div>';
	html += '<div role="tabpanel" class="tab-pane" id="config-' + safeId + '">';
	html += '<table class="table table-condensed table-striped">';
	if (configDene) {
		var cWords = configDene["DeneWords"];
		for (var dtcw = 0; dtcw < cWords.length; dtcw++) {
			html += '<tr><td>' + cWords[dtcw]["Name"] + '</td><td><strong>' + cWords[dtcw]["Value"] + '</strong></td></tr>';
		}
	}
	html += '</table></div>';
	html += '</div></div>';
	return html;
}

function mergeTelepathonDenes(cached, incoming) {
	// Live per-telepathon MQTT pushes sometimes carry only the Denes that changed
	// (e.g. just "Purpose"), omitting others like "Configuration". Render off a
	// shallow merge so fields like Device Type Id don't transiently disappear.
	if (!cached) return incoming;
	var mergedDenes = (cached["Denes"] || []).slice();
	var incomingDenes = incoming["Denes"] || [];
	for (var i = 0; i < incomingDenes.length; i++) {
		var found = false;
		for (var j = 0; j < mergedDenes.length; j++) {
			if (mergedDenes[j]["Name"] === incomingDenes[i]["Name"]) {
				mergedDenes[j] = incomingDenes[i];
				found = true;
				break;
			}
		}
		if (!found) mergedDenes.push(incomingDenes[i]);
	}
	return { "Name": incoming["Name"] || cached["Name"], "Denes": mergedDenes };
}

function updateTelepathonsView(text){
	var telepathon = JSON.parse(text);
	var telepathonName = telepathon["Name"];
	// TelepathonStatus is the authoritative source for Device Type Id — it comes
	// directly from the LoRa deserializer, while the Status pulse reads the denome
	// file which can hold a stale or garbled value.
	var _tsDenes = telepathon["Denes"] || [];
	for (var _tsi = 0; _tsi < _tsDenes.length; _tsi++) {
		if (_tsDenes[_tsi]["Name"] === "Configuration") {
			var _tsCws = _tsDenes[_tsi]["DeneWords"] || [];
			for (var _tsci = 0; _tsci < _tsCws.length; _tsci++) {
				if (_tsCws[_tsci]["Name"] === "Device Type Id" && _tsCws[_tsci]["Value"]) {
					telepathonDeviceTypeCache[telepathonName] = _tsCws[_tsci]["Value"];
				}
			}
		}
	}
	var safeId = telepathonName.replace(/[^a-zA-Z0-9]/g, '_');
	telepathon = mergeTelepathonDenes(telepathonCardDataCache[telepathonName], telepathon);
	telepathonCardDataCache[telepathonName] = telepathon;
	var fullHtml = buildTelepathonCardView(telepathon); // updates modal as a side effect
	var $textPanel = $('#tpText_' + safeId);
	if ($textPanel.length) {
		// Update only the text panel — leave the image element untouched so the
		// browser never has to reload it, eliminating the "no image" flash.
		var $newCard = $(fullHtml);
		$textPanel.html($newCard.find('#tpText_' + safeId).html());
	} else if (!$('#tpCardCol_' + safeId).length) {
		$('#TelepathonsView').append(fullHtml);
	}
}

function tickTelepathonCards(){
	// Only refresh the "Xs ago" age label/color in place — rebuilding the whole
	// card (image + SOC etc.) on this timer was causing periodic flicker since
	// the underlying telepathon data hasn't actually changed.
	for (var tName in telepathonCardDataCache) {
		var safeId = tName.replace(/[^a-zA-Z0-9]/g, '_');
		var $age = $('#tpAge_' + safeId);
		if (!$age.length) continue;
		var ageInfo = computeTelepathonAgeStatus(telepathonCardDataCache[tName]);
		$age.text('(' + Math.floor(ageInfo.ageSeconds) + 's ago)').css('color', ageInfo.statusColor);
	}
}
setInterval(tickTelepathonCards, 10 * 1000);

var mnemoPeriodsData = [];
var mnemoNavIdx = {};

function mnemoSortDenes(denes) {
	return denes.slice().sort(function(a, b) {
		var hasPA = (a["Position"] !== undefined && a["Position"] !== null && a["Position"] !== '');
		var hasPB = (b["Position"] !== undefined && b["Position"] !== null && b["Position"] !== '');
		var posA = hasPA ? parseInt(a["Position"]) : (a._arrayIdx !== undefined ? a._arrayIdx : 0);
		var posB = hasPB ? parseInt(b["Position"]) : (b._arrayIdx !== undefined ? b._arrayIdx : 0);
		return posB - posA;
	});
}

function mnemoNav(pi, delta) {
	var denes = mnemoPeriodsData[pi] || [];
	var sorted = mnemoSortDenes(denes);
	var total = sorted.length;
	if (total === 0) return;
	if (mnemoNavIdx[pi] === undefined) mnemoNavIdx[pi] = 0;
	mnemoNavIdx[pi] = Math.max(0, Math.min(total - 1, mnemoNavIdx[pi] + delta));
	var cur = mnemoNavIdx[pi];
	var dene = sorted[cur];
	var hasPos = (dene["Position"] !== undefined && dene["Position"] !== null && dene["Position"] !== '');
	var pos = hasPos ? parseInt(dene["Position"]) : (total - cur);
	var dws = dene["DeneWords"] || [];
	var label = dene["Name"] ? '<strong>' + dene["Name"] + '</strong> &mdash; ' : '';
	var contentHtml = '<div style="margin-bottom:6px;font-size:13px;color:#555;">' + label + 'Entry ' + pos + ' of ' + total + '</div>';
	contentHtml += '<table class="table table-condensed table-striped" style="font-size:13px;">';
	for (var i = 0; i < dws.length; i++) {
		contentHtml += '<tr><td style="width:50%;">' + dws[i]["Name"] + '</td><td><strong>' + dws[i]["Value"] + '</strong></td></tr>';
	}
	contentHtml += '</table>';
	$('#mnemo-content-' + pi).html(contentHtml);
	$('#mnemo-prev-' + pi).prop('disabled', cur >= total - 1);
	$('#mnemo-next-' + pi).prop('disabled', cur <= 0);
}

// "Mnemosyne Pulse Count" Denes store DeneWords of Value Type "Time Series" -- an array of
// {Value, "Pulse Timestamp in Milliseconds"} entries (see UpdateTimeSeriesCounterOperation.java)
// rather than a plain scalar, which the generic table rendering below would otherwise just
// print as "[object Object]". Show entry count plus the few most recent samples instead.
function formatMnemosyneDeneWordValue(value) {
	if (Array.isArray(value)) {
		if (value.length === 0) return '<em>0 entries</em>';
		var preview = value.slice(-3).reverse().map(function(e) {
			var ts = e["Pulse Timestamp in Milliseconds"];
			var when = ts ? new Date(ts).toLocaleString() : '?';
			var v = e["Value"];
			return when + ': ' + (v === undefined || v === null ? '<em>no value</em>' : v);
		}).join('<br>');
		return value.length + ' entries, most recent:<br>' + preview;
	}
	if (value !== null && typeof value === 'object') {
		return '<pre style="white-space:pre-wrap;margin:0;">' + JSON.stringify(value, null, 2) + '</pre>';
	}
	return value;
}

function renderMnemosyneViewPanel() {
	mnemoPeriodsData = [];
	mnemoNavIdx = {};

	// Get Mnemosyne nucleus denechains
	var mnemoDCs = [];
	for (var ni = 0; ni < nucleiJSONArray.length; ni++) {
		if (nucleiJSONArray[ni]["Name"] === NUCLEI_MNEMOSYNE) {
			mnemoDCs = nucleiJSONArray[ni]["DeneChains"];
			break;
		}
	}

	// Include all time-period denechains (show empty ones too)
	var periodPrefixes = ["Mnemosyne Current Hour", "Mnemosyne Today", "Mnemosyne Yesterday",
		"Mnemosyne Current Week", "Mnemosyne Current Month", "Mnemosyne Current Quarter",
		"Mnemosyne Current Semester", "Mnemosyne Current Year", "Mnemosyne Pulse Count", "Mnemosyne Pulse"];
	var periods = [];
	for (var di = 0; di < mnemoDCs.length; di++) {
		var dc = mnemoDCs[di];
		for (var pi2 = 0; pi2 < periodPrefixes.length; pi2++) {
			if (dc["Name"] === periodPrefixes[pi2]) {
				periods.push(dc);
				break;
			}
		}
	}

	var html = '<div class="col-lg-12">';
	html += '<div class="bs-component">';
	html += '<div class="panel panel-default">';
	html += '<div class="panel-heading"><h4>Mnemosyne</h4></div>';
	html += '<div class="panel-body">';
	html += '<div>';

	if (periods.length === 0) {
		html += '<p class="text-muted text-center" style="padding:20px;">No Mnemosyne data available yet.</p>';
		return html;
	}

	// Pill nav
	html += '<ul class="nav nav-pills" style="margin-bottom:12px;flex-wrap:wrap;">';
	for (var pi = 0; pi < periods.length; pi++) {
		var label = periods[pi]["Name"].replace("Mnemosyne ", "");
		var pid = "mnemo-tab-" + pi;
		var activeClass = pi === 0 ? ' class="active"' : '';
		html += '<li' + activeClass + ' onclick="return teleonomeShowTab(\'' + pid + '\', this)" style="margin-bottom:4px;"><a href="#">' + label + '</a></li>';
	}
	html += '</ul>';

	// Tab content
	html += '<div class="tab-content">';
	for (var ti = 0; ti < periods.length; ti++) {
		var pid2 = "mnemo-tab-" + ti;
		var activeClass2 = ti === 0 ? ' active' : '';
		html += '<div class="tab-pane' + activeClass2 + '" id="' + pid2 + '">';
		var denes2 = periods[ti]["Denes"] || [];
		// Tag each dene with its original array index so mnemoNav can sort without Position
		var taggedDenes = denes2.map(function(d, i) { return Object.assign({}, d, { _arrayIdx: i }); });
		mnemoPeriodsData[ti] = taggedDenes;

		if (taggedDenes.length > 1) {
			// HyperCard navigation — newest first (by Position if present, else by array order)
			var sortedDenes = mnemoSortDenes(taggedDenes);
			mnemoNavIdx[ti] = 0;
			var total = sortedDenes.length;
			var newest = sortedDenes[0];
			var hasPos = (newest["Position"] !== undefined && newest["Position"] !== null && newest["Position"] !== '');
			var newestPos = hasPos ? parseInt(newest["Position"]) : total;
			// Navigation bar
			html += '<div style="display:flex;align-items:center;margin-bottom:10px;">';
			html += '<button id="mnemo-prev-' + ti + '" class="btn btn-sm btn-default" onclick="mnemoNav(' + ti + ',1)">&#8592; Older</button>';
			html += '<button id="mnemo-next-' + ti + '" class="btn btn-sm btn-default" disabled onclick="mnemoNav(' + ti + ',-1)" style="margin-left:8px;">Newer &#8594;</button>';
			html += '</div>';
			// Content area — starts showing newest entry
			html += '<div id="mnemo-content-' + ti + '">';
			var newestLabel = newest["Name"] ? '<strong>' + newest["Name"] + '</strong> &mdash; ' : '';
			html += '<div style="margin-bottom:6px;font-size:13px;color:#555;">' + newestLabel + 'Entry ' + newestPos + ' of ' + total + '</div>';
			var initDws = newest["DeneWords"] || [];
			if (initDws.length > 0) {
				html += '<table class="table table-condensed table-striped" style="font-size:13px;">';
				for (var idwi = 0; idwi < initDws.length; idwi++) {
					html += '<tr><td style="width:50%;">' + initDws[idwi]["Name"] + '</td>';
					html += '<td><strong>' + formatMnemosyneDeneWordValue(initDws[idwi]["Value"]) + '</strong></td></tr>';
				}
				html += '</table>';
			} else {
				html += '<p class="text-muted text-center" style="padding:16px;">No data for this entry.</p>';
			}
			html += '</div>';
		} else {
			// Single dene — show directly
			var singleDene = taggedDenes.length > 0 ? taggedDenes[0] : null;
			var dws = singleDene ? (singleDene["DeneWords"] || []) : [];
			if (dws.length > 0) {
				html += '<table class="table table-condensed table-striped" style="font-size:13px;">';
				for (var dwi = 0; dwi < dws.length; dwi++) {
					html += '<tr><td style="width:50%;">' + dws[dwi]["Name"] + '</td>';
					html += '<td><strong>' + formatMnemosyneDeneWordValue(dws[dwi]["Value"]) + '</strong></td></tr>';
				}
				html += '</table>';
			} else {
				html += '<p class="text-muted text-center" style="padding:16px;">No data available for this period.</p>';
			}
		}
		html += '</div>';
	}
	html += '</div>';

	return html;
}

function renderOrgansPanel() {
	if (organsRenderedThisCycle) {
		return '<div style="display:none;"><div><div><div><div>';
	}
	organsRenderedThisCycle = true;

	var ageSeconds = (Date.now() - pulseTimestampMilliseconds) / 1000;
	var statusClass = ageSeconds < 60 ? 'btn-success' : (ageSeconds < 120 ? 'btn-warning' : 'btn-danger');
	var mkClose = function(id) { return '<button type="button" class="close" onclick="closeModal(\'' + id + '\')">&times;</button>'; };
	var mkFooter = function(id) { return '<button type="button" class="btn btn-default" onclick="closeModal(\'' + id + '\')">Close</button>'; };

	// Hippocampus modal
	if (!$('#hippocampusModal').length) {
		$('body').append(
			'<div class="modal fade" id="hippocampusModal" tabindex="-1" role="dialog">' +
			'<div class="modal-dialog modal-lg"><div class="modal-content">' +
			'<div class="modal-header">' + mkClose('hippocampusModal') + '<h4 class="modal-title">Hippocampus</h4></div>' +
			'<div class="modal-body" id="hippocampusModalBody"></div>' +
			'<div class="modal-footer">' + mkFooter('hippocampusModal') + '</div>' +
			'</div></div></div>'
		);
	}
	var hippoContent = '';
	var hippoSpaceSlices = null;
	var hippoBreakdownSlices = null;
	var hippoDeviceRanges = {};
	var hippoPointer = "@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + DENECHAIN_PURPOSE_HIPPOCAMPUS;
	var hippoDeneChain = getDeneChainByIdentityPointer(hippoPointer);
	if (hippoDeneChain) {
		var hippoDenes = hippoDeneChain["Denes"];
		for (var ih = 0; ih < hippoDenes.length; ih++) {
			if (hippoDenes[ih]["Name"] === DENE_HIPPOCAMPUS_MEMORY_STATUS_DENE) {
				var hippoDene = hippoDenes[ih];
				var hippoTs = hippoDene["Timestamp"] || "";
				var hippoDws = hippoDene["DeneWords"];
				var hippoUsed = 0, hippoAvail = 0;
				var hippoRows = [];
				for (var jh = 0; jh < hippoDws.length; jh++) {
					var dwName = hippoDws[jh]["Name"];
					var dwVal  = hippoDws[jh]["Value"];
					if (dwName === "PointsUsed")    hippoUsed  = Number(dwVal);
					if (dwName === "PointsAvailable") hippoAvail = Number(dwVal);
					if (dwName === "MemoryBreakdown") {
						try { hippoBreakdownSlices = JSON.parse(dwVal).map(function(b) { return { name: b.name, value: b.points }; }); } catch(e) {}
					} else if (dwName === "DeviceDateRanges") {
						try {
							JSON.parse(dwVal).forEach(function(r) { hippoDeviceRanges[r.name] = { start: r.start, end: r.end }; });
						} catch(e) {}
					} else {
						hippoRows.push({ name: dwName, value: dwVal });
					}
				}
				if (hippoUsed > 0 || hippoAvail > 0) {
					hippoSpaceSlices = [{ name: "Used", value: hippoUsed }, { name: "Available", value: hippoAvail }];
				}

				// Charts
				hippoContent += '<div class="row" style="margin-bottom:16px;margin-top:4px;">';
				hippoContent += '<div class="col-xs-12 col-sm-6" style="padding-left:20px;padding-right:20px;">';
				hippoContent += '<h5 class="text-center" style="font-size:13px;color:#555;margin-bottom:4px;">Memory Space</h5>';
				hippoContent += '<div id="hippo-space-chart"></div></div>';
				hippoContent += '<div class="col-xs-12 col-sm-6" style="padding-left:20px;padding-right:20px;">';
				hippoContent += '<h5 class="text-center" style="font-size:13px;color:#555;margin-bottom:4px;">Memory by Sensor</h5>';
				hippoContent += '<div id="hippo-breakdown-chart"></div></div>';
				hippoContent += '</div>';
				if (hippoTs) hippoContent += '<p class="text-muted small" style="margin-bottom:4px;">Last update: ' + hippoTs + '</p>';

				// Build 2-per-row stats table
				var statsTableHtml = '<table class="table table-condensed table-striped" style="font-size:12px;">';
				for (var ri = 0; ri < hippoRows.length; ri += 2) {
					var lr = hippoRows[ri], rr = hippoRows[ri + 1];
					statsTableHtml += '<tr><td style="width:25%;">' + lr.name + '</td><td style="width:25%;"><strong>' + lr.value + '</strong></td>';
					if (rr) {
						statsTableHtml += '<td style="width:25%;">' + rr.name + '</td><td style="width:25%;"><strong>' + rr.value + '</strong></td>';
					} else {
						statsTableHtml += '<td></td><td></td>';
					}
					statsTableHtml += '</tr>';
				}
				statsTableHtml += '</table>';

				// Build Contents from Internal:Hippocampus:Data
				var hippoContentsHtml = '';
				(function() {
					var hippoDataDene = null;
					for (var _ni = 0; _ni < nucleiJSONArray.length; _ni++) {
						if (nucleiJSONArray[_ni]["Name"] !== "Internal") continue;
						var _chains = nucleiJSONArray[_ni]["DeneChains"] || [];
						for (var _ci = 0; _ci < _chains.length; _ci++) {
							if (_chains[_ci]["Name"] !== "Hippocampus") continue;
							var _denes = _chains[_ci]["Denes"] || [];
							for (var _di = 0; _di < _denes.length; _di++) {
								if (_denes[_di]["Name"] === "Data") { hippoDataDene = _denes[_di]; break; }
							}
							break;
						}
						break;
					}
					if (!hippoDataDene) { hippoContentsHtml = '<p class="text-muted">No hippocampus data configuration found.</p>'; return; }
					// "Data" DeneWords list device TYPES (e.g. "Chinampa", "Daffodil", "Langley"), not
					// specific instances -- so which telepathons show up here is discovered dynamically
					// from whatever is actually present in the live denome right now, same as
					// Hippocampus.absorbPulse(). This means a new instance of an already-listed type
					// (e.g. LangleyWest, later Langley_North/Langley_East) appears here automatically.
					var allowedDeviceTypes = (hippoDataDene["DeneWords"] || []).map(function(dw) { return dw["Value"]; }).filter(Boolean);
					var devices = [], deviceVars = {};
					var telepathonsNucleus = getTelepathonsDeneChains();
					var telepathonChains = (telepathonsNucleus && telepathonsNucleus["DeneChains"]) || [];
					for (var _ti = 0; _ti < telepathonChains.length; _ti++) {
						var tChain = telepathonChains[_ti];
						var tDenes = tChain["Denes"] || [];
						var deviceType = null, purposeDeneWords = [];
						for (var _tdi = 0; _tdi < tDenes.length; _tdi++) {
							if (tDenes[_tdi]["Name"] === "Configuration") {
								var _cws = tDenes[_tdi]["DeneWords"] || [];
								for (var _cwi = 0; _cwi < _cws.length; _cwi++) {
									if (_cws[_cwi]["Name"] === "Device Type Id") deviceType = _cws[_cwi]["Value"];
								}
							} else if (tDenes[_tdi]["Name"] === "Purpose") {
								purposeDeneWords = tDenes[_tdi]["DeneWords"] || [];
							}
						}
						if (!deviceType || allowedDeviceTypes.indexOf(deviceType) === -1) continue;
						var devName = tChain["Name"];
						if (!deviceVars[devName]) { devices.push(devName); deviceVars[devName] = []; }
						for (var _pdwi = 0; _pdwi < purposeDeneWords.length; _pdwi++) {
							deviceVars[devName].push({ name: purposeDeneWords[_pdwi]["Name"], value: purposeDeneWords[_pdwi]["Value"] });
						}
					}
					if (devices.length === 0) {
						hippoContentsHtml = '<p class="text-muted">No variables found.</p>';
					} else {
						// Device link bar
						hippoContentsHtml += '<div style="margin-bottom:10px;font-size:13px;">';
						for (var _devi = 0; _devi < devices.length; _devi++) {
							if (_devi > 0) hippoContentsHtml += ' &nbsp;|&nbsp; ';
							hippoContentsHtml += '<a href="#" onclick="$(\'.hippo-dev-table\').hide();$(\'#hippo-dev-' + _devi + '\').show();return false;">' + devices[_devi] + '</a>';
						}
						hippoContentsHtml += '</div>';
						// One table per device, only first visible
						for (var _devi = 0; _devi < devices.length; _devi++) {
							var dev = devices[_devi];
							var vars = deviceVars[dev];
							hippoContentsHtml += '<div id="hippo-dev-' + _devi + '" class="hippo-dev-table"' + (_devi > 0 ? ' style="display:none;"' : '') + '>';
							var devRange = hippoDeviceRanges[dev];
							hippoContentsHtml += '<table class="table table-condensed table-striped" style="font-size:12px;margin-bottom:0;">';
							if (devRange) {
								hippoContentsHtml += '<tr><td colspan="4">Data available: ' + devRange.start + ' &nbsp;to&nbsp; ' + devRange.end + '</td></tr>';
							}
							for (var _vi = 0; _vi < vars.length; _vi += 2) {
								var lv = vars[_vi], rv = vars[_vi + 1];
								hippoContentsHtml += '<tr><td style="width:25%;">' + lv.name + '</td><td style="width:25%;"><strong>' + lv.value + '</strong></td>';
								if (rv) {
									hippoContentsHtml += '<td style="width:25%;">' + rv.name + '</td><td style="width:25%;"><strong>' + rv.value + '</strong></td>';
								} else {
									hippoContentsHtml += '<td></td><td></td>';
								}
								hippoContentsHtml += '</tr>';
							}
							hippoContentsHtml += '</table></div>';
						}
					}
				})();

				// Pills + content divs
				hippoContent += '<ul class="nav nav-pills" style="margin-bottom:10px;">';
				hippoContent += '<li class="active" onclick="$(\'#hippo-modal-stats\').show();$(\'#hippo-modal-contents\').hide();$(this).addClass(\'active\').siblings().removeClass(\'active\');return false;"><a href="#">Stats</a></li>';
				hippoContent += '<li onclick="$(\'#hippo-modal-contents\').show();$(\'#hippo-modal-stats\').hide();$(this).addClass(\'active\').siblings().removeClass(\'active\');return false;"><a href="#">Contents</a></li>';
				hippoContent += '</ul>';
				hippoContent += '<div id="hippo-modal-stats">' + statsTableHtml + '</div>';
				hippoContent += '<div id="hippo-modal-contents" style="display:none;">' + hippoContentsHtml + '</div>';
				break;
			}
		}
	}
	$('#hippocampusModalBody').html(hippoContent);
	if (hippoSpaceSlices) {
		drawHippocampusPieChart('hippo-space-chart', hippoSpaceSlices, ['#4e79a7', '#d9d9d9']);
	}
	if (hippoBreakdownSlices && hippoBreakdownSlices.length > 0) {
		drawHippocampusPieChart('hippo-breakdown-chart', hippoBreakdownSlices);
	}

	// Cerebellum modal
	if (!$('#cerebellumModal').length) {
		$('body').append(
			'<div class="modal fade" id="cerebellumModal" tabindex="-1" role="dialog">' +
			'<div class="modal-dialog"><div class="modal-content">' +
			'<div class="modal-header">' + mkClose('cerebellumModal') + '<h4 class="modal-title">Cerebellum</h4></div>' +
			'<div class="modal-body" id="cerebellumModalBody"></div>' +
			'<div class="modal-footer">' + mkFooter('cerebellumModal') + '</div>' +
			'</div></div></div>'
		);
	}
	var cerebModalContent = '';
	var cerebInternalPointer = "@" + teleonomeName + ":" + NUCLEI_INTERNAL + ":" + DENECHAIN_INTERNAL_CEREBELLUM;
	var cerebPurposePointer  = "@" + teleonomeName + ":" + NUCLEI_PURPOSE  + ":" + DENECHAIN_PURPOSE_CEREBELLUM;
	var cerebInternalDC = getDeneChainByIdentityPointer(cerebInternalPointer);
	var cerebPurposeDC  = getDeneChainByIdentityPointer(cerebPurposePointer);
	var cerebSkipFields = ["Annabelle Action Pointer", "Annabelle Command", "Task True Expression",
		"Telepathon Type", "Mnemosyne Today", "Mnemosyne Current Week", "UsingSolarPower",
		"Evaluation Position", "SolarAnalysis Execution Time", "SolarAnalysis Duration"];
	var cerebAllDenes = cerebInternalDC ? (cerebInternalDC["Denes"] || []) : [];
	var cerebTasks = cerebAllDenes.filter(function(d) {
		return d["DeneType"] === DENE_TYPE_CEREBELLUM_TASK;
	});
	if (cerebTasks.length > 0) {
		cerebModalContent += '<ul class="nav nav-pills" style="margin-bottom:14px;flex-wrap:wrap;">';
		for (var cpi = 0; cpi < cerebTasks.length; cpi++) {
			var cTaskRawName = cerebTasks[cpi]["Name"];
			var cTaskDwsLabel = cerebTasks[cpi]["DeneWords"] || [];
			var cTeleopathonType = "";
			for (var tl = 0; tl < cTaskDwsLabel.length; tl++) {
				if (cTaskDwsLabel[tl]["Name"] === DENEWORD_CEREBELLUM_TELEPATHON_TYPE) { cTeleopathonType = cTaskDwsLabel[tl]["Value"]; break; }
			}
			var cTaskLabel = cTaskRawName;
			if (cTeleopathonType && cTaskLabel.indexOf(cTeleopathonType + " ") === 0) {
				cTaskLabel = cTaskLabel.substring(cTeleopathonType.length + 1);
			}
			cTaskLabel = cTaskLabel.replace(/([a-z])([A-Z])/g, '$1 $2');
			var cpid = "cereb-task-" + cpi;
			cerebModalContent += '<li' + (cpi === 0 ? ' class="active"' : '') +
				' onclick="return teleonomeShowTab(\'' + cpid + '\', this)" style="margin-bottom:4px;">' +
				'<a href="#">' + cTaskLabel + '</a></li>';
		}
		cerebModalContent += '</ul><div class="tab-content">';
		var cerebPurposeDenes = cerebPurposeDC ? (cerebPurposeDC["Denes"] || []) : [];
		for (var cti = 0; cti < cerebTasks.length; cti++) {
			var cTask = cerebTasks[cti];
			var cTaskName = cTask["Name"];
			var cpid2 = "cereb-task-" + cti;
			var cTaskNameLc = cTaskName.toLowerCase();
			var isGraveyardShift = cTaskNameLc.indexOf("graveyardshift") !== -1 || cTaskNameLc.indexOf("graveyard") !== -1;
			var isScheduleTask = isGraveyardShift || cTaskNameLc.indexOf("pulsetask") !== -1;
			cerebModalContent += '<div class="tab-pane' + (cti === 0 ? ' active' : '') + '" id="' + cpid2 + '">';
			// Find matching dene in Purpose:Cerebellum by Telepathon Type (Purpose denes are named after the telepathon)
			var cPurposeDene = null;
			var cTaskDwsMatch = cTask["DeneWords"] || [];
			var cTelepathonTypeMatch = "";
			for (var tdw = 0; tdw < cTaskDwsMatch.length; tdw++) {
				if (cTaskDwsMatch[tdw]["Name"] === DENEWORD_CEREBELLUM_TELEPATHON_TYPE) { cTelepathonTypeMatch = cTaskDwsMatch[tdw]["Value"]; break; }
			}
			for (var cpd = 0; cpd < cerebPurposeDenes.length; cpd++) {
				if (cTelepathonTypeMatch && cerebPurposeDenes[cpd]["Name"] === cTelepathonTypeMatch) { cPurposeDene = cerebPurposeDenes[cpd]; break; }
			}
			if (!cPurposeDene) {
				for (var cpd = 0; cpd < cerebPurposeDenes.length; cpd++) {
					if (cerebPurposeDenes[cpd]["Name"] === cTaskName) { cPurposeDene = cerebPurposeDenes[cpd]; break; }
				}
			}
			// For schedule/utility tasks: show their own config fields, not the shared Purpose:Cerebellum output
			if (isScheduleTask) {
				cerebModalContent += '<h5 style="margin-top:0;margin-bottom:6px;color:#337ab7;border-bottom:1px solid #ddd;padding-bottom:4px;">Schedule</h5>';
				cerebModalContent += '<table class="table table-condensed table-striped" style="margin-bottom:14px;">';
				var schedFields = ["Active", "Expression", "Execution Time", "Execution Frequency"];
				var schedDws = cTask["DeneWords"] || [];
				for (var sf = 0; sf < schedFields.length; sf++) {
					for (var sdw = 0; sdw < schedDws.length; sdw++) {
						if (schedDws[sdw]["Name"] === schedFields[sf] && schedDws[sdw]["Value"]) {
							cerebModalContent += '<tr><td style="width:50%;">' + schedDws[sdw]["Name"] + '</td>' +
								'<td><strong>' + schedDws[sdw]["Value"] + '</strong></td></tr>';
							break;
						}
					}
				}
				cerebModalContent += '</table>';
			}
			// Show Purpose:Cerebellum data for all tasks except GraveyardShift (which has no computed output)
			if (!isGraveyardShift) {
				if (cPurposeDene) {
					var cPurposeDws = cPurposeDene["DeneWords"] || [];

					// Cerebellum merges every task that shares this Telepathon Type into
					// one flat Purpose dene (so e.g. a live per-pulse task's words don't
					// erase an hourly task's words). Each task's own words are delimited
					// at the end by the "<TaskShortName> Execution Time" / "<TaskShortName>
					// Duration" markers Cerebellum.java appends after task.process()
					// returns. Use those to show only this tab's own task, not everyone's.
					var cClassName = "";
					for (var cdw = 0; cdw < cTaskDwsMatch.length; cdw++) {
						if (cTaskDwsMatch[cdw]["Name"] === "Task True Expression") { cClassName = cTaskDwsMatch[cdw]["Value"]; break; }
					}
					var cShortName = cClassName.substring(cClassName.lastIndexOf(".") + 1);

					var cMyWords = null;
					var segStart = 0;
					for (var pdw = 0; pdw < cPurposeDws.length; pdw++) {
						var pdwName = cPurposeDws[pdw]["Name"];
						var durSuffix = " Duration";
						if (typeof pdwName === "string" && pdwName.indexOf(durSuffix) === pdwName.length - durSuffix.length) {
							var ownerName = pdwName.substring(0, pdwName.length - durSuffix.length);
							if (pdw > 0 && cPurposeDws[pdw - 1]["Name"] === ownerName + " Execution Time") {
								if (ownerName === cShortName) { cMyWords = cPurposeDws.slice(segStart, pdw + 1); break; }
								segStart = pdw + 1;
							}
						}
					}
					// No markers for this task yet (e.g. an hourly task that hasn't fired
					// its first run) — show nothing rather than falling back to everyone
					// else's words.
					if (!cMyWords) cMyWords = [];

					if (cMyWords.length > 0) {
						cerebModalContent += '<table class="table table-condensed table-striped">';
						for (var cpdw = 0; cpdw < cMyWords.length; cpdw++) {
							var cpdwName = cMyWords[cpdw]["Name"];
							if (cerebSkipFields.indexOf(cpdwName) !== -1) continue;
							if (cpdwName === cShortName + " Execution Time" || cpdwName === cShortName + " Duration") continue;
							cerebModalContent += '<tr><td style="width:55%;">' + cpdwName + '</td>' +
								'<td><strong>' + cMyWords[cpdw]["Value"] + '</strong></td></tr>';
						}
						cerebModalContent += '</table>';
					} else {
						cerebModalContent += '<p class="text-muted text-center" style="padding:16px;">No data available.</p>';
					}
				} else {
					cerebModalContent += '<p class="text-muted text-center" style="padding:16px;">No data available.</p>';
				}
			}
			cerebModalContent += '</div>';
		}
		cerebModalContent += '</div>';
	} else {
		cerebModalContent = '<p class="text-muted text-center" style="padding:20px;">No tasks available.</p>';
	}
	$('#cerebellumModalBody').html(cerebModalContent);

	// Heart modal
	if (!$('#heartModal').length) {
		$('body').append(
			'<div class="modal fade" id="heartModal" tabindex="-1" role="dialog">' +
			'<div class="modal-dialog" style="max-width:calc(100vw - 20px);width:500px;margin:10px auto;"><div class="modal-content">' +
			'<div class="modal-header">' + mkClose('heartModal') + '<button type="button" class="btn btn-xs btn-default" onclick="heartLogDownload()" style="float:right;margin-right:6px;margin-top:3px;" title="Download log">&#8659; Download</button><h4 class="modal-title">Heart</h4></div>' +
			'<div class="modal-body" style="padding:0;">' +
			'<div id="heart-log-view" style="background:#0d1117;font-family:monospace;font-size:11px;padding:8px 10px;max-height:240px;overflow-y:auto;overflow-x:hidden;"></div>' +
			'<div style="background:#161b22;padding:4px 8px;border-bottom:2px solid #1e2a3a;">' +
			'<select id="heart-log-filter" onchange="heartLogApplyFilter()" style="width:100%;background:#0d1117;color:#9cdcfe;border:1px solid #2a2a3a;border-radius:3px;font-family:monospace;font-size:11px;padding:2px 4px;">' +
			'<option value="">Show All</option>' +
			'</select></div>' +
			'<div id="heart-stats-view" style="padding:12px 15px;"></div>' +
			'</div>' +
			'<div class="modal-footer">' + mkFooter('heartModal') + '</div>' +
			'</div></div></div>'
		);
		$('#heart-log-view').html(heartLogBuildHtml());
		// Seed topic dropdown from existing buffer
		heartMessageLog.forEach(function(e) {
			if (heartLogTopics.indexOf(e.topic) === -1) heartLogTopics.push(e.topic);
		});
		heartLogTopics.sort();
		heartLogUpdateFilterOptions();
	}
	var heartContent = '<table class="table table-condensed table-striped" style="margin-bottom:0;">';
	heartContent += '<tr><td>Last Pulse</td><td><strong>' + (pulseTimestamp || '—') + '</strong></td></tr>';
	heartContent += '<tr><td>Time Since Pulse</td><td><strong>' + (timeStringSinceLastPulse || '—') + '</strong></td></tr>';
	heartContent += '<tr><td>Operational Mode</td><td><strong>' + (operationalMode || '—') + '</strong></td></tr>';
	if (currentPulseFrequency != undefined) heartContent += '<tr><td>Pulse Frequency</td><td><strong>' + msToTime(currentPulseFrequency) + '</strong></td></tr>';
	if (currentPulseGenerationDuration != undefined) heartContent += '<tr><td>Generation Duration</td><td><strong>' + msToTime(currentPulseGenerationDuration) + '</strong></td></tr>';
	heartContent += '</table>';
	$('#heart-stats-view').html(heartContent);

	var html = '<div class="col-lg-12">';
	html += '<div class="bs-component"><div class="panel panel-default">';
	html += '<div class="panel-heading"><h4>Organs</h4></div>';
	html += '<div class="panel-body">';
	html += '<div>';
	html += '<div class="row" style="margin:8px 0;">';
	html += '<div class="col-xs-12 col-sm-4 text-center" style="margin-bottom:10px;">';
	html += '<button class="btn btn-lg btn-block ' + statusClass + '" onclick="openModal(\'hippocampusModal\')">Hippocampus</button>';
	html += '</div>';
	html += '<div class="col-xs-12 col-sm-4 text-center" style="margin-bottom:10px;">';
	html += '<button class="btn btn-lg btn-block ' + statusClass + '" onclick="openModal(\'cerebellumModal\')">Cerebellum</button>';
	html += '</div>';
	html += '<div class="col-xs-12 col-sm-4 text-center" style="margin-bottom:10px;">';
	html += '<button class="btn btn-lg btn-block ' + statusClass + '" onclick="openModal(\'heartModal\')">Heart</button>';
	html += '</div>';
	html += '</div>';
	return html;
}

function buildChinampaContent(telepathon) {
	var tpName = telepathon["Name"];
	var purposeDene = null, configDene = null, sensorsDene = null;
	var denes = telepathon["Denes"];
	for (var i = 0; i < denes.length; i++) {
		if (denes[i]["Name"] === "Purpose") purposeDene = denes[i];
		else if (denes[i]["Name"] === "Configuration") configDene = denes[i];
		else if (denes[i]["Name"] === "Sensors") sensorsDene = denes[i];
	}
	var pw = purposeDene ? purposeDene["DeneWords"] : [];
	var sw = sensorsDene ? sensorsDene["DeneWords"] : [];

	function findDW(words, name) {
		for (var i = 0; i < words.length; i++) if (words[i]["Name"] === name) return words[i];
		return null;
	}
	function fmtVal(dw) {
		if (!dw) return "—";
		var v = String(dw["Value"]);
		if (v.toLowerCase() === "true") return '<span style="color:#27ae60;font-weight:bold;">● ACTIVE</span>';
		if (v.toLowerCase() === "false") return '<span style="color:#999;">○ OFF</span>';
		return v + (dw["Units"] ? " " + dw["Units"] : "");
	}
	function svgGauge(totalH, measuredH, flash) {
		totalH = parseFloat(totalH) || 1;
		measuredH = parseFloat(measuredH) || 0;
		var fh = Math.max(5, Math.round(((totalH - measuredH) / totalH) * 100));
		var fy = 5 + (100 - fh);
		var fc = flash ? '#e74c3c' : '#3498db';
		return '<svg width="80" height="120"><rect x="10" y="5" width="60" height="100" fill="#eaedef" rx="4" stroke="#ccc"/>' +
			'<rect x="10" y="' + fy + '" width="60" height="' + fh + '" fill="' + fc + '" rx="2"/>' +
			'<text x="40" y="115" text-anchor="middle" font-size="11" font-weight="bold">' + Math.round(totalH - measuredH) + 'cm</text></svg>';
	}
	function metricBox(dw, btns) {
		if (!dw) return '';
		var s = '<div style="border-left:3px solid #3498db;background:#f0f4f8;margin-bottom:4px;border-radius:2px;overflow:hidden;">';
		s += '<div style="padding:4px 6px;">';
		s += '<div style="font-size:9px;color:#777;font-weight:bold;text-transform:uppercase;">' + dw["Name"] + '</div>';
		s += '<div style="font-size:12px;color:#333;">' + fmtVal(dw) + '</div>';
		s += '</div>';
		if (btns) s += '<div style="background:#e8edf2;text-align:right;padding:2px 4px;">' + btns + '</div>';
		s += '</div>';
		return s;
	}
	function mkGraphBtns(tpName, deneName, dwName, nucleus) {
		var nucleusAttr = nucleus ? ' data-nucleus="' + nucleus + '"' : '';
		var d = 'data-telepathonname="' + tpName + '" data-denename="' + deneName + '" data-denewordname="' + dwName + '"' + nucleusAttr;
		var btnCls = 'btn btn-xs btn-default telepathon-history-value';
		return '<button class="' + btnCls + '" ' + d + ' data-range="3600000">1h</button> ' +
			'<button class="' + btnCls + '" ' + d + ' data-range="86400000">24h</button> ' +
			'<button class="' + btnCls + ' hidden-xs" ' + d + ' data-range="604800000">7d</button>';
	}
	function vitalCard(label, val, unit, color, btns) {
		var html = '<div class="col-xs-4 col-sm-2" style="margin-bottom:8px;padding:2px;">';
		html += '<div style="border-radius:10px;overflow:hidden;">';
		html += '<div style="padding:8px 4px;color:white;text-align:center;background:' + color + ';">';
		html += '<div style="font-size:9px;text-transform:uppercase;font-weight:bold;opacity:0.9;">' + label + '</div>';
		html += '<div style="font-size:16px;font-weight:800;">' + val + unit + '</div>';
		html += '</div>';
		if (btns) html += '<div style="background:#f0f0f0;text-align:center;padding:3px 2px;">' + btns + '</div>';
		html += '</div></div>';
		return html;
	}

	var localTime = findDW(pw, "Local Time");
	var alertStatusDW = findDW(pw, "Alert Status");
	var alertCodeDW = findDW(pw, "Alert Code");
	var alertStatus = alertStatusDW && String(alertStatusDW["Value"]).toLowerCase() === "true";
	var alertCode = alertCodeDW ? parseInt(alertCodeDW["Value"]) : 0;
	var alertMessages = {0:"Initializing...",1:"Fish Tank Data Stale",2:"Sump Trough Stale",3:"FT & Sump Data Stale",4:"Solenoid Open / Low Flow",5:"Sump Level Too Low",6:"System Low In Water"};

	var ftH = findDW(sw, "Fish Tank Height");
	var ftM = findDW(pw, "Fish Tank Measured Height");
	var stH = findDW(sw, "Sump TroughHeight");
	var stM = findDW(pw, "Sump Trough Measured Height");
	var maxPCBdw = findDW(sw, "u Temperature Maximum");
	var maxPCB = maxPCBdw ? parseFloat(maxPCBdw["Value"]) : 75;
	var pcbDW = findDW(pw, "PCB Temperature");
	var rssiDW = findDW(pw, "rssi");
	var snrDW = findDW(pw, "snr");
	var outdoorTempDW = findDW(pw, "Outdoor Temperature");
	var outdoorHumDW = findDW(pw, "Outdoor Humidity");

	var usedKeys = ["Fish Tank Outflow Flow Rate","Fish Tank Outflow Solenoid Relay Status","Pump Flow Rate","Pump Relay Status",
		"Fish Tank Measured Height","Sump Trough Measured Height","Local Time","TOTP","Alert Status","Alert Code",
		"Outdoor Temperature","Outdoor Humidity","PCB Temperature","rssi","snr",
		"Seconds Since Last Fish Tank Data","Seconds Since Last Sump Trough Data"];

	function denewordGrid(words, accentColor) {
		var g = '<div class="row" style="margin:0;">';
		for (var gi = 0; gi < words.length; gi++) {
			g += '<div class="col-xs-6 col-sm-4" style="margin-bottom:6px;padding:2px 4px;">';
			g += '<div style="border:1px solid #eee;border-radius:4px;padding:5px;border-left:3px solid ' + accentColor + ';">';
			g += '<div style="font-size:9px;color:#777;">' + words[gi]["Name"] + '</div>';
			g += '<div style="font-weight:bold;font-size:12px;">' + fmtVal(words[gi]) + '</div>';
			g += '</div></div>';
		}
		g += '</div>';
		return g;
	}

	var html = '<div style="background:white;">';

	if (alertStatus) {
		html += '<div style="background:#e74c3c;color:white;padding:6px 12px;text-align:center;font-weight:bold;font-size:13px;">' + (alertMessages[alertCode] || "Alert") + '</div>';
	}

	// Pill tabs
	html += '<ul class="nav nav-pills" style="padding:8px 12px 0;margin:0;">';
	html += '<li class="active" onclick="return teleonomeShowTab(\'chinampa-purpose\', this)"><a href="#">Purpose</a></li>';
	html += '<li onclick="return teleonomeShowTab(\'chinampa-sensors\', this)"><a href="#">Sensors</a></li>';
	html += '<li onclick="return teleonomeShowTab(\'chinampa-config\', this)"><a href="#">Configuration</a></li>';
	html += '<li onclick="return teleonomeShowTab(\'chinampa-diag\', this)"><a href="#">Diagnostics</a></li>';
	html += '</ul>';

	var modalAgeSec = Math.floor((Date.now() - pulseTimestampMilliseconds) / 1000);
	var modalStatusColor = modalAgeSec < 60 ? '#27ae60' : (modalAgeSec < 120 ? '#f39c12' : '#e74c3c');
	html += '<div style="padding:4px 12px 6px;font-size:11px;color:#888;border-bottom:1px solid #eee;">';
	html += (localTime ? localTime["Value"] : '') +
		'&nbsp;&nbsp;<span style="color:' + modalStatusColor + ';font-weight:bold;">' + modalAgeSec + 's ago</span>';
	html += '</div>';
	html += '<div class="tab-content" style="padding:12px 15px;">';

	// Purpose tab
	html += '<div class="tab-pane active" id="chinampa-purpose">';
	html += '<div class="row">';

	// Fish Tank
	html += '<div class="col-xs-12 col-sm-6" style="margin-bottom:12px;">';
	html += '<div style="background:#f8f9fa;border-radius:8px;border-top:4px solid #3498db;padding:10px;">';
	html += '<div style="font-size:11px;text-transform:uppercase;font-weight:bold;color:#2c3e50;border-bottom:1px solid #eee;margin-bottom:8px;padding-bottom:4px;">Fish Tank (Pebble Mediate)</div>';
	html += '<div class="row"><div class="col-xs-5 text-center">';
	html += svgGauge(ftH ? ftH["Value"] : 1, ftM ? ftM["Value"] : 0, alertCode === 6);
	html += '<div style="font-size:9px;font-weight:bold;color:#777;margin-top:2px;">WATER LEVEL</div>';
	html += '<div style="margin-top:4px;">' + mkGraphBtns(tpName, "Purpose", "Fish Tank Measured Height") + '</div>';
	html += '</div><div class="col-xs-7">';
	html += metricBox(findDW(pw, "Fish Tank Outflow Flow Rate"), mkGraphBtns(tpName, "Purpose", "Fish Tank Outflow Flow Rate"));
	html += metricBox(findDW(pw, "Fish Tank Outflow Solenoid Relay Status"), mkGraphBtns(tpName, "Purpose", "Fish Tank Outflow Solenoid Relay Status"));
	html += metricBox(findDW(pw, "Seconds Since Last Fish Tank Data"));
	html += '</div></div></div></div>';

	// Sump Trough
	html += '<div class="col-xs-12 col-sm-6" style="margin-bottom:12px;">';
	html += '<div style="background:#f8f9fa;border-radius:8px;border-top:4px solid #3498db;padding:10px;">';
	html += '<div style="font-size:11px;text-transform:uppercase;font-weight:bold;color:#2c3e50;border-bottom:1px solid #eee;margin-bottom:8px;padding-bottom:4px;">Sump Trough</div>';
	html += '<div class="row"><div class="col-xs-5 text-center">';
	html += svgGauge(stH ? stH["Value"] : 1, stM ? stM["Value"] : 0, alertCode === 5 || alertCode === 6);
	html += '<div style="font-size:9px;font-weight:bold;color:#777;margin-top:2px;">WATER LEVEL</div>';
	html += '<div style="margin-top:4px;">' + mkGraphBtns(tpName, "Purpose", "Sump Trough Measured Height") + '</div>';
	html += '</div><div class="col-xs-7">';
	html += metricBox(findDW(pw, "Pump Flow Rate"), mkGraphBtns(tpName, "Purpose", "Pump Flow Rate"));
	html += metricBox(findDW(pw, "Pump Relay Status"), mkGraphBtns(tpName, "Purpose", "Pump Relay Status"));
	html += metricBox(findDW(pw, "Seconds Since Last Sump Trough Data"));
	html += '</div></div></div></div>';

	html += '</div>'; // end tanks row

	// Vitals — colored cards with history buttons below
	html += '<div class="row" style="margin-bottom:8px;">';
	if (outdoorTempDW) html += vitalCard("Outdoor Temp", outdoorTempDW["Value"], "°C", "#3498db", mkGraphBtns(tpName, "Purpose", "Outdoor Temperature"));
	if (outdoorHumDW) html += vitalCard("Outdoor Hum", outdoorHumDW["Value"], "%", "#3498db", mkGraphBtns(tpName, "Purpose", "Outdoor Humidity"));
	if (pcbDW) { var pcbV = parseFloat(pcbDW["Value"]); html += vitalCard("PCB Temp", pcbDW["Value"], "°C", pcbV > maxPCB ? "#e74c3c" : "#27ae60", mkGraphBtns(tpName, "Purpose", "PCB Temperature")); }
	if (rssiDW) { var rssiV = parseFloat(rssiDW["Value"]); html += vitalCard("Signal", rssiDW["Value"], "", rssiV > -95 ? "#27ae60" : "#f39c12", mkGraphBtns(tpName, "Purpose", "rssi")); }
	if (snrDW) { var snrV = parseFloat(snrDW["Value"]); html += vitalCard("SNR", snrDW["Value"], "", snrV > 0 ? "#27ae60" : "#f39c12", mkGraphBtns(tpName, "Purpose", "snr")); }
	html += '</div>';

	html += '</div>'; // end purpose tab-pane

	// Diagnostics tab (remaining purpose fields)
	var remainingPw = pw.filter(function(d) { return usedKeys.indexOf(d["Name"]) < 0; });
	html += '<div class="tab-pane" id="chinampa-diag">';
	if (remainingPw.length > 0) {
		html += denewordGrid(remainingPw, '#3498db');
	} else {
		html += '<p class="text-muted">No additional diagnostics.</p>';
	}
	html += '</div>';

	// Sensors tab
	html += '<div class="tab-pane" id="chinampa-sensors">';
	if (sensorsDene && sensorsDene["DeneWords"].length > 0) {
		html += denewordGrid(sensorsDene["DeneWords"], '#27ae60');
	} else {
		html += '<p class="text-muted">No sensor data available.</p>';
	}
	html += '</div>';

	// Configuration tab
	html += '<div class="tab-pane" id="chinampa-config">';
	if (configDene && configDene["DeneWords"].length > 0) {
		html += denewordGrid(configDene["DeneWords"], '#8e44ad');
	} else {
		html += '<p class="text-muted">No configuration data available.</p>';
	}
	html += '</div>';

	html += '</div>'; // end tab-content
	html += '</div>'; // end chinampa card
	return html;
}

function refreshTelepathonsView(){
	var telepathonsNuclei=getTelepathonsDeneChains();
	if(!telepathonsNuclei) return "";
	var deneChains = telepathonsNuclei['DeneChains'];
	var panelHTML="";
	for(var j13=0;j13<deneChains.length;j13++){
		var telepathonName = deneChains[j13]["Name"];
		// This full-pulse snapshot of a telepathon's denes can itself be partial
		// (e.g. missing "Configuration" on a given pulse). Merge onto the cache
		// instead of overwriting it outright, otherwise fields like Device Type Id
		// (used for the card image) transiently disappear and the card flickers.
		var merged = mergeTelepathonDenes(telepathonCardDataCache[telepathonName], deneChains[j13]);
		var changed = JSON.stringify(merged) !== JSON.stringify(telepathonCardDataCache[telepathonName]);
		telepathonCardDataCache[telepathonName] = merged;
		var safeId = telepathonName.replace(/[^a-zA-Z0-9]/g, '_');
		var $textPanel = $('#tpText_' + safeId);
		if ($textPanel.length) {
			// Card already exists — update only the text panel, leaving the
			// image div untouched. This prevents the image from being destroyed
			// and re-fetched on every pulse cycle, eliminating the flicker.
			if (changed) {
				var fullHtml = buildTelepathonCardView(merged); // modal update side effect
				$textPanel.html($(fullHtml).find('#tpText_' + safeId).html());
			}
		} else {
			panelHTML += buildTelepathonCardView(merged);
		}
	}
	if (panelHTML) $('#TelepathonsView').append(panelHTML);
	return panelHTML;
}

function calculateFutureTimeWithDate(secondsTime, sleepTimeSeconds) {
		// Convert sleepTimeMicros to seconds and add to the epoch time
	//	const microsToSeconds = sleepTimeMicros / 1000000;
		const futureEpoch = secondsTime + sleepTimeSeconds;
		
		// Create a Date object with the future time
		const futureDate = new Date(futureEpoch * 1000);
		
		// Format the date and time
		const year = futureDate.getFullYear();
		const month = (futureDate.getMonth() + 1).toString().padStart(2, '0');
		const day = futureDate.getDate().toString().padStart(2, '0');
		const hours = futureDate.getHours().toString().padStart(2, '0');
		const minutes = futureDate.getMinutes().toString().padStart(2, '0');
		const seconds = futureDate.getSeconds().toString().padStart(2, '0');
		
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

function formatTime(totalSeconds) {
		// Convert microseconds to seconds (1 second = 1,000,000 microseconds)
		//const totalSeconds = Math.floor(sleepTimeMicros / 1000000);
		
		// Calculate minutes and remaining seconds
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		
		// Format the output (adding leading zeros if needed)
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
	
function refreshOrganismView(){
	if(organismInfoJsonData != undefined){
		var panelHTML="";
		$('#OrganismView').empty();
		for(var i in organismInfoJsonData){
			if(i != teleonomeName){
				panelHTML += "<div class=\"col-lg-2 col-md-2 col-sm-2 col-xs-6 text-center top-buffer\">";
				panelHTML += "<a href=\"http://"+i+".local\" target=\"_new\" class=\"btn btn-lg btn-"+ organismInfoJsonData[i] +"\">"+i+"</a>";
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
	organsRenderedThisCycle = false;

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
	organsRenderedThisCycle = false;
	// This function empties and fully rebuilds the panel HTML (including chart SVGs) on every
	// pulse refresh and every AsyncUpdate (see Ra's PLSeries AsyncUpdate mode) -- emptying the
	// container collapses the page's scrollable height for a moment, and the browser clamps
	// scroll position down when that happens, so anyone scrolled down to e.g. the memory chart
	// gets kicked back to the top on every single refresh. Save/restore scroll position around
	// the rebuild so it doesn't move. Scoped to the main "EntryPoint" container specifically,
	// not any other locationId this function might be called with (e.g. modals), so it doesn't
	// affect scroll behavior anywhere that isn't the main page.
	var restoreScrollY = (locationId === "EntryPoint") ? window.pageYOffset : null;
	var pageDeneChain = humanInterfaceDeneChainIndex.get(pagePointer);
	console.log("renderPageByPointer pagePointer=" + pagePointer + " pageDeneChain=" +pageDeneChain);
	if (!pageDeneChain) {
		console.warn("renderPageByPointer: no denechain found for pointer: " + pagePointer);
		$('#' + locationId).empty().html('<div class="row top-buffer"><div class="col-lg-12 text-center" style="padding:40px;color:#999;">Page not yet configured.</div></div>');
		return;
	}
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
	if(teleonomeName==undefined || teleonomeName=="undefined")teleonomeName=denomeJSONObject.Name;
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
		if (!panelDeneChain) {
			console.warn("renderPageByPointer: target denechain not found for pointer: " + deneChainPointer);
			denes = [];
		} else {
			denes = panelDeneChain["Denes"];
		}
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


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_TELEPHATON_VIEW){
			var title = panelDeneChain["Name"]; /// xxx
			var telepathonPanel = new TelepathonPanel();
			panelHTML += telepathonPanel.process(title);
			refreshTelepathonsView();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_ORGANS){
			panelHTML += renderOrgansPanel();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_HIPPOCAMPUS_STATUS){
			panelHTML += renderOrgansPanel();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_CEREBELLUM_STATUS){
			panelHTML += renderOrgansPanel();

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
			panelHTML += aNetworkSensorDeviceStatusReport.process(organismIPInfoJsonData);
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
			// Not closing the "row" div here -- the shared closing block below (5 closing
			// </div> tags, shared with SingleValuePanel-style panels) closes it. Closing it
			// here too was an extra </div> that prematurely closed the outer
			// "row top-buffer" container, kicking every later panel outside any .row.

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
			// Was storing the function reference (getAllDeneWordsByIdentityPointer) instead of its
			// result -- drawDenomeMultiLineChart would have received a function, not data. Fixed
			// 2026-07-15 alongside adding the actual drawDenomeMultiLineChart implementation.
			chartDataSourcePointerHashMap.put(id,renderedDataSourceDeneWordsArray);
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
			// Not closing the "row" div here -- see matching note in the MULTI_LINE_CHART
			// branch above; the shared closing block closes it.

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

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MNEMOSYNE_VIEW){
			panelHTML += renderMnemosyneViewPanel();

		}else{

		}
		//// console.log("unidentified style, mainPanelVisualStyle=" + mainPanelVisualStyle)

		panelHTML += "</div>";    // closing <div class=\"panel-body text-center\"
		panelHTML += "</div>";    // closing <div class=\"row\" (panel-heading self-closes inline above)
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
		teleonomeName=denomeJSONObject.Name;

		if( secundaryView !="" && teleonomeName!= undefined && teleonomeName!=''){
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
			// Distinct function name from the CSV path below on purpose -- see D3Chart.js's
			// drawDenomeMultiLineChart comment. Both used to be named drawTimeSeriesMultiLineChart,
			// which silently clobbered one another depending on script load order.
			drawDenomeMultiLineChart(pId, renderedDataSourceDeneWord, title, timeString);
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

	if (restoreScrollY !== null) {
		// Deferred one tick so it runs after the browser has finished laying out the panels
		// and chart SVGs just appended above -- restoring synchronously can still race layout
		// on slower devices/large pages.
		setTimeout(function() { window.scrollTo(0, restoreScrollY); }, 0);
	}

}




