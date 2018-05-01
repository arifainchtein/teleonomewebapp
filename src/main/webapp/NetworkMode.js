function confirmMessage( mensaje) {
		 //
		 // check we are enabling network mode
		 var enabledNetworkMode = $("#EnableNetworkMode").is(':checked');
		 if(enabledNetworkMode){
			 //
			 // now check that you have a value for SSID 
			 // and if needed a password
			 if($("#AvailableNetworks :selected")==null || ("#AvailableNetworks :selected")==""){
				 alert("Please select a SSID");
					return false;
			 }
			 var selectedSSID = $("#AvailableNetworks :selected").val();
			 if(selectedSSID!=""){
				 var selectedValue = $("#AvailableNetworks :selected").text();
				 var password =  $("#password").val().length>7;
				 
					if(selectedValue!=null && 
					  selectedValue.indexOf("Password")>-1 &&
					  !password
					){
						alert("Please input SSID password");
						return false;
					}
			 }else{
				 alert("Select an SSID");
				 return false;
			 }
			 
		 }
		 var answer = confirm(mensaje);
		 return answer;
		 
	}

function loadInitialSetup(){
		    		
	enableUI();
	currentOperationalData = JSON.parse(responseText);
	
	var alive = currentOperationalData["Alive"];
	$("#TogglePulseSwitch").bootstrapSwitch('state', alive, true);
	$("#ShutdownSwitch").bootstrapSwitch('state', true, true);
	$("#RebootSwitch").bootstrapSwitch('state', true, true);
	//	console.log("created json object");

}


function disableNetworkModeUI(){
	 $('.BSswitch').bootstrapSwitch('disabled',true);
	 $('.btn').attr('disabled','disabled');
	 $('#ssidPassword').hide();
	 $("#AvailableNetworkSection").hide();
	}

function enableUI(){
	$('.BSswitch ').bootstrapSwitch('disabled',false);
	 $('.btn').removeAttr('disabled');
	 $("#AvailableNetworkSection").hide();
}



$(document).ready(function(){  
	disableNetworkModeUI();
	$('#ssidPassword').hide();
	$('#showModal').hide();
	 $("#modal-data").hide();
	 loadInitialSetup();
	 
	$("#TogglePulseSwitch").bootstrapSwitch('state', true);
	$("#ShutdownSwitch").bootstrapSwitch('state', true);
	$("#RebootSwitch").bootstrapSwitch('state', true);
	
	$("#RejectAction").click(function(event){
		$('#showModal').hide();
		var data = $("#modal-data").html();
		if(data == '<%= com.teleonome.framework.TeleonomeConstants.COMMAND_KILL_PULSE %>'){
			$("#TogglePulseSwitch").bootstrapSwitch('state', true, true);
		}else if(data == '<%= com.teleonome.framework.TeleonomeConstants.COMMAND_SHUTDOWN %>'){
			
			$("#ShutdownSwitch").bootstrapSwitch('state', true, true);
		}else if(data == '<%= com.teleonome.framework.TeleonomeConstants.COMMAND_REBOOT %>'){
			
			$("#RebootSwitch").bootstrapSwitch('state', true, true);
		}else if(data == '<%= com.teleonome.framework.TeleonomeConstants.COMMAND_START_PULSE %>'){
			$("#TogglePulseSwitch").bootstrapSwitch('state', false, true);
		}		
	});
	
	$("#AvailableNetworks").on('change', function(){
		var selectedValue = $("#AvailableNetworks :selected").text();
		
		if(selectedValue!=null && selectedValue.indexOf("Password")>-1){
			$('#ssidPassword').show();
		}else{
			$('#ssidPassword').hide();
		}
    	
	});
	
	
	$("#EnableNetworkMode").on('switchChange.bootstrapSwitch', function (event, data) {
		var $this = $(this);
	    // $this will contain a reference to the checkbox   
	    if ($this.is(':checked')) {
	        // the checkbox was checked 
	        $("#AvailableNetworkSection").show();
	    } else {
	        // the checkbox was unchecked
	    	$("#AvailableNetworkSection").hide();
	    }
	 });
	
	
	
	
	
	$("#ConfirmAction").click(function(event){
		$('#showModal').hide();
		disableUI();
		
		var data = $("#modal-data").html();
		
		$('#WaitingText').html("Processing...");
		$('#WaitingWheel').show();
	
		
	if(	data=='UpdateParameters'){
		
		$.post("MonoNannyServlet",formData,function(resp){
			console.log("returning from pst, data=" + data);
			processState(resp);
			pulseGeneratorAlive=false;
			window.location.reload();
			$('#WaitingWheel').hide();
		}).fail(function(xhr, textStatus, errorThrown){
			console.log(xhr.responseText);
			$('#WaitingWheel').hide();
			alert("reques xhr " + xhr.responseText);
			
		});	
		
	}else{
		
		$.post("MonoNannyServlet",{formName:data},function(resp){
			console.log("returning from pst, data=" + data);
			if(data == '<%=com.teleonome.framework.TeleonomeConstants.COMMAND_KILL_PULSE%>'){
				$("#TogglePulseSwitch").bootstrapSwitch('state', false, true);
				$("#ShutdownSwitch").bootstrapSwitch('state', true, true);
				$("#RebootSwitch").bootstrapSwitch('state', true, true);
				pulseGeneratorAlive=false;
				window.location.reload();
				
			}else if(data == '<%=com.teleonome.framework.TeleonomeConstants.COMMAND_SHUTDOWN%>'){
				$("#TogglePulseSwitch").bootstrapSwitch('state', false, true);
				$("#ShutdownSwitch").bootstrapSwitch('state', false, true);
				$("#RebootSwitch").bootstrapSwitch('state', false, true);
				$( "#StatusLabel" ).html( "Shutting down, good night..." );
				
				
			}else if(data == '<%=com.teleonome.framework.TeleonomeConstants.COMMAND_REBOOT%>'){
				$("#TogglePulseSwitch").bootstrapSwitch('state', false, true);
				$("#ShutdownSwitch").bootstrapSwitch('state', false, true);
				$("#RebootSwitch").bootstrapSwitch('state', false, true);
				$( "#StatusLabel" ).html( "Rebooting, be right back..." );
				
				
			}else if(data == '<%=com.teleonome.framework.TeleonomeConstants.COMMAND_START_PULSE%>'){
				$("#TogglePulseSwitch").bootstrapSwitch('state', true, true);
				$("#ShutdownSwitch").bootstrapSwitch('state', true, true);
				$("#RebootSwitch").bootstrapSwitch('state', true, true);
				pulseGeneratorAlive=true;
				//
				// now reload the page
				window.location.reload();
				$( "#StatusLabel" ).html( "Restarted pulse, reloading..." );	
			}
		
			
			
			
		}).fail(function(xhr, textStatus, errorThrown){
			console.log(xhr.responseText);
			$('#WaitingWheel').hide();
			alert("reques xhr " + xhr.responseText);
			
		});	
		
		$('#WaitingWheel').hide();
	}
	});
	
	
	$("#SubmitButton").click(function(event){
		$('#showModal').hide();
		disableUI();
		
		var data = $("#modal-data").html();
		
		$('#WaitingText').html("Processing...");
		$('#WaitingWheel').show();
	
		
	if(	data=='UpdateParameters'){
		
		$.post("MonoNannyServlet",formData,function(resp){
			console.log("returning from pst, data=" + data);
			processState(resp);
			pulseGeneratorAlive=false;
			window.location.reload();
			$('#WaitingWheel').hide();
		}).fail(function(xhr, textStatus, errorThrown){
			console.log(xhr.responseText);
			$('#WaitingWheel').hide();
			alert("reques xhr " + xhr.responseText);
			
		});	
		
	}else{
		var datastring = $('#MainForm').serialize();
		alert(datastring);
		$.post("MonoNannyServlet",datastring,function(resp){
			console.log("returning from pst, data=" + data);
			if(data == '<%=com.teleonome.framework.TeleonomeConstants.COMMAND_KILL_PULSE%>'){
				$("#TogglePulseSwitch").bootstrapSwitch('state', false, true);
				$("#ShutdownSwitch").bootstrapSwitch('state', true, true);
				$("#RebootSwitch").bootstrapSwitch('state', true, true);
				pulseGeneratorAlive=false;
				window.location.reload();
				
			}else if(data == '<%=com.teleonome.framework.TeleonomeConstants.COMMAND_SHUTDOWN%>'){
				$("#TogglePulseSwitch").bootstrapSwitch('state', false, true);
				$("#ShutdownSwitch").bootstrapSwitch('state', false, true);
				$("#RebootSwitch").bootstrapSwitch('state', false, true);
				$( "#StatusLabel" ).html( "Shutting down, good night..." );
				
				
			}else if(data == '<%=com.teleonome.framework.TeleonomeConstants.COMMAND_REBOOT%>'){
				$("#TogglePulseSwitch").bootstrapSwitch('state', false, true);
				$("#ShutdownSwitch").bootstrapSwitch('state', false, true);
				$("#RebootSwitch").bootstrapSwitch('state', false, true);
				$( "#StatusLabel" ).html( "Rebooting, be right back..." );
				
				
			}else if(data == '<%=com.teleonome.framework.TeleonomeConstants.COMMAND_START_PULSE%>'){
				$("#TogglePulseSwitch").bootstrapSwitch('state', true, true);
				$("#ShutdownSwitch").bootstrapSwitch('state', true, true);
				$("#RebootSwitch").bootstrapSwitch('state', true, true);
				pulseGeneratorAlive=true;
				//
				// now reload the page
				window.location.reload();
				$( "#StatusLabel" ).html( "Restarted pulse, reloading..." );	
			}
		
			
			
			
		}).fail(function(xhr, textStatus, errorThrown){
			console.log(xhr.responseText);
			$('#WaitingWheel').hide();
			alert("reques xhr " + xhr.responseText);
			
		});	
		
		$('#WaitingWheel').hide();
	}
	});
	
	
	
	
	
	$("#UpdateParameterButton").on('switchChange.bootstrapSwitch', function (event, data) {
		if(!loading){
			$("#modal-data").html( 'UpdateParameters' );
			$("#myModalTitle").html( "Update" );
			$("#modalText").html( "Are you sure you want to update the parameters?" );
		    $('#showModal').modal('show');
		}
	 });
	
	
	
	$("#ShutdownSwitch").on('switchChange.bootstrapSwitch', function (event, data) {
		if(!loading){
			$("#modal-data").html( '<%= com.teleonome.framework.TeleonomeConstants.COMMAND_SHUTDOWN %>' );
			$("#myModalTitle").html( "Shutdown" );
			$("#modalText").html( "Are you sure you want to shutdown the Teleonome?" );
		    $('#showModal').modal('show');
		}
	 });
	
	$("#RebootSwitch").on('switchChange.bootstrapSwitch', function (event, data) {
		if(!loading){
			$("#modal-data").html( '<%= com.teleonome.framework.TeleonomeConstants.COMMAND_REBOOT %>' );
			$("#myModalTitle").html( "Reboot" );
			$("#modalText").html( "Are you sure you want to reboot the Teleonome?" );
		    $('#showModal').modal('show');
		}
	 });
	

});

var processingResponse=false;
function processState(resp){
	processingResponse=true;
	//console.log("response=");
	//console.log(resp);
	var currentOperationalData=resp;
	
	try {
		currentOperationalData = JSON.parse(resp);
	//	console.log("created json object");
		} catch (exception) {
			console.log("exception parsing json " + exception);
		}

	 pulseStatus = currentOperationalData["Pulse Status"];

	
	 currentIdentityMode = currentOperationalData["Current Identity Mode"];
	if(currentIdentityMode == "Self"){
		$('#NetworkMode').show();
		$('#SelfMode').hide();
		$('#ConnectedClients').show();
		//
		// set up the connected clients
		//
		var connectedClients = currentOperationalData["Connected Clients"];
		console.log("connectedClients=" + connectedClients);
		$('#ClientsTable tbody').empty();
		$(function() {
		    $.each(connectedClients, function(i, item) {
		    	
		        var $tr = $('<tr>').append(
		            $('<td>').text(item["name"]),
		            $('<td>').text(item["ipaddress"])
		        ).appendTo('#ClientsTable');
		        
		    });
		});
		
		//
		// set up the available ssids
		//
		var availableSSIDs = currentOperationalData["Available SSIDs"];
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
		
		
		
	}else{
		$('#NetworkMode').hide();
		$('#SelfMode').show();
		$('#ConnectedClients').hide();
		var essid = currentOperationalData["ESSID"];
		var ipAddress = currentOperationalData["IP Address"];
		$("#CurrentESSID").html("Current SSID:&nbsp;&nbsp;" + essid);
		$("#CurrentIPAddress").html("Current IPAddress:&nbsp;&nbsp;" + ipAddress);
		
		
	}
	
	if(pulseStatus.substring(0,13) =="<%= com.teleonome.framework.TeleonomeConstants.STARTING_PULSE_MAPPED_BUS_MESSAGE %>" || pulseStatus=="pulse started" || pulseStatus=="Start Pulse" || pulseStatus=="StartPulse"){
			var res = pulseStatus.split(":");
			//console.log
			//$("#StatusLabel").html(res[0]);
			//$("#StatusDetailLabel").html(res[1] +":"+ res[2]);
			$("#StatusLabel").html(res[1] +":"+ res[2]);
			
			disableUI();
			inPulse=true;
		}else if(pulseStatus.substring(0,14) =="<%= com.teleonome.framework.TeleonomeConstants.PULSE_FINISHED_MAPPED_BUS_MESSAGE %>" || pulseStatus=="End Pulse" || pulseStatus=="EndPulse"){
			var res = pulseStatus.split(":");
			enableUI();
			inPulse=false;
			//$("#StatusLabel").html(res[0]);
			//$("#StatusDetailLabel").html(res[1] +":"+ res[2]);
			$("#StatusLabel").html(pulseStatus);
		}
	//}

		
		
		

	processingResponse=false;
	//console.log("exited processSate");
}
