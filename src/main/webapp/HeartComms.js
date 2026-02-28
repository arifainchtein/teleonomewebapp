var mqtt;
var reconnectTimeout = 2000;
var visualizer="";
var lastMessageTopic;
function HeartConnect() {
	//
	// before we actually connect ask the server for the visualizer
	//	
	// $.ajax({
	// 	type: "GET",
	// 	url: "/TeleonomeServlet",
	// 	data: {formName:"GetVisualizer"},
	// 	success: function (data) {
	// 		console.log("data=" + data);
	// 		visualizer=data;
			
	// 	},
	// 	error: function(data){
	// 		console.log("error getting visualizer:" + JSON.stringify(data));
	// 		alert("Hubo un errors al procesar la forma:" + JSON.stringify(data));
	// 		return false;
	// 	}
	// });	
	
	
	localStorage.clear();
	
	console.log('invoking mqttconnect');
	host="Egg.local";
	port=9999; 
	mqtt = new Paho.MQTT.Client( host, port, "web_" + parseInt(Math.random() * 100));
	mqtt.onConnect = onConnect;
	mqtt.onMessageArrived = onMessageArrived;
	mqtt.onConnectionLost = onConnectionLost;
	mqtt.connect({onSuccess: onConnect, onFailure: onFailure, cleanSession:false});
	console.log("Host="+ host + ", port=" + port );
	console.log("connected...");
}



function onConnect() {
	console.log('in onconnect');
	// $('#pulse').html('Connected to ' + host + ':' + port + path);
	// Connection succeeded; subscribe to our topic
	mqtt.subscribe("Hello", {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:2});
	console.log('after firstsub');
	mqtt.subscribe(HEART_TOPIC_PULSE_STATUS_INFO, {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:1});
	mqtt.subscribe(HEART_TOPIC_PULSE_STATUS_INFO_SECUNDARY, {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:1});
	mqtt.subscribe(HEART_TOPIC_ORGANISM_STATUS, {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:1});
	mqtt.subscribe(HEART_TOPIC_ORGANISM_IP, {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:1});
	mqtt.subscribe(HEART_TOPIC_UPDATE_FORM_STATUS, {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:1});
	mqtt.subscribe(HEART_TOPIC_STATUS, {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:1});
	mqtt.subscribe(HEART_TOPIC_ASYNC_CYCLE_UPDATE, {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:1});
	mqtt.subscribe(HEART_TOPIC_UPDATE_FORM_RESPONSE, {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:1});
	mqtt.subscribe(HEART_TOPIC_TELEPATHON_STATUS, {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:1});
	mqtt.subscribe(HEART_TOPIC_HIPPOCAMPUS_RESPONSE, {"onSuccess":subscribeSucessFcn,"onFailure":subscribeFailureFcn,qos:1});
	
	
}

function onConnectionLost(response) {
	setTimeout(mqtt, reconnectTimeout);
	console.log("connection lost: " + response.errorMessage + ". Reconnecting");
	$('#PulseStatusInfo').val("connection lost: " + response.errorMessage + ". Reconnecting");
	HeartConnect();
}

function subscribeSucessFcn(){
	console.log("subscribe Success");
}

function subscribeFailureFcn(){
	console.log('subs failure');
}
function onFailure(){
	console.log("subscription is failed");
}


function onMessageArrived(message) {
console.log("message arrived");
	lastMessageTopic = message.destinationName;
	var payload = message.payloadString;
	console.log("message arrive, topic=" + lastMessageTopic);
	if (lastMessageTopic == "Hippocampus_Response") {
        var response = JSON.parse(payload);
        console.log("Received history for: " + response.Identity);
        
        // This is where you would call your graphing function or update a table
        renderHistoryChart(response.Data);
        
        // Reset the button opacity if you changed it earlier
        $('.telepathon-daily-value').css("opacity", "1.0");

    }else 	if(lastMessageTopic=='Status'){
		//
		// the payload is a pulse so refresh the interface
		// in the current page
		//
		console.log("about to start DenomeUtils2");
		////aDenomeUtils = new DenomeUtils();
		//console.log("about to process new pulse");
		//aDenomeUtil.loadDenomeRefreshInterface(payload);
		loadDenomeRefreshInterface(payload);
		
	} else if(lastMessageTopic=='Ada Status'){
		//
		// The message of the payload when is a status message
		// is
		//  Ada Name#IP Address#Timestamp Millis#Timestamp#Message
		//
		updateAdaStatus(payload);
	}else if(lastMessageTopic==HEART_TOPIC_PULSE_STATUS_INFO){
		updatePulseStatusInfo(payload);
	}else if(lastMessageTopic==HEART_TOPIC_PULSE_STATUS_INFO_SECUNDARY){
		updatePulseStatusInfoSecundary(payload);
	}else if(lastMessageTopic==HEART_TOPIC_ORGANISM_STATUS){
		updateOrganismView(payload);
	}else if(lastMessageTopic==HEART_TOPIC_TELEPATHON_STATUS){
		updateTelepathonsView(payload);
	}else if(lastMessageTopic==HEART_TOPIC_ORGANISM_IP){
		updateOrganismIP(payload);
	}else if(lastMessageTopic==HEART_TOPIC_AVAILABLE_SSIDS){
		setAvailableSSIDs(payload);
	}else if(lastMessageTopic==HEART_TOPIC_ASYNC_CYCLE_UPDATE && pageToDisplay==1){
		asyncUpdate(payload);
	}else if(lastMessageTopic==HEART_TOPIC_UPDATE_FORM_RESPONSE  && (pageToDisplay==1 || pageToDisplay==5)) {
		receivedCommandResponse(payload);
	}else if(lastMessageTopic==HEART_TOPIC_HIPPOCAMPUS_RESPONSE){
		displayHippocampusResponse(payload);
	}      
};
