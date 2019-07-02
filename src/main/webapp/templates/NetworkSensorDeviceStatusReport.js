class NetworkSensorDeviceStatusReport{
	constructor(){

	}



	process(){
		var networkStatusSampleTimeStringPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_SENSOR_DATA + ":" + DENE_NETWORK_SENSOR_STATUS + ":" + NETWORK_SCAN_TIME_STRING;
		console.log("networkStatusSampleTimeStringPointer=" + networkStatusSampleTimeStringPointer);
		var scanTimeString = getDeneWordByIdentityPointer(networkStatusSampleTimeStringPointer, DENEWORD_VALUE_ATTRIBUTE);

		var deviceListPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_SENSOR_DATA + ":" + DENE_NETWORK_SENSOR_STATUS + ":" + DEVICE_LIST;
		console.log("deviceListPointer=" + deviceListPointer);
		var deviceList = JSON.parse(getDeneWordByIdentityPointer(deviceListPointer, DENEWORD_VALUE_ATTRIBUTE));

		var panelHTML = "<div class=\"col-lg-12\"><div class=\"well\"><h4>Network Status as of "+ scanTimeString +"</h4></div> </div>";
		
		 panelHTML += "<div class=\"col-lg-12\">";
		
		panelHTML += "	<div class=\"bs-component\">";
		panelHTML += "		<div class=\"panel panel-default\">";
		panelHTML += "			<div class=\"panel-heading\"><h4>Device List";
		panelHTML += "              <a href=\"#\" class=\"btn btn-success btn-sm pull-right\">";
		panelHTML += "              <span class=\"glyphicon glyphicon-plus-sign\"></span> Add All";
		panelHTML += "                 </a>";
		panelHTML += "</h4></div>";
		panelHTML += "<div class=\"panel-body\">";
		panelHTML += "	<table id=\"DeviceListTable\"  class=\"table table-stripped text-center\">";
		panelHTML += "		<tr><th class=\"text-center\">Actions </th><th class=\"text-center\">Device Name </th><th class=\"text-center\">Ip Address</th><th class=\"text-center\">Whitelist</th></tr>";
		panelHTML += "		<tr> ";
		for(var i = 0; i < deviceList.length; i++) {
			var device = deviceList[i];
			if(device[WHITE_LIST_STATUS]){
				panelHTML += "			<td><button type=\"submit\"  class=\"btn btn-primary btn-sm\">";
				panelHTML += "		        	<span class=\"glyphicon glyphicon-stats\"></span>&nbsp;";
				panelHTML += "		        </button>";
				panelHTML += "		    </td>";
				panelHTML += "		   <td><h5 class=\"text-success\">"+i+ device[DEVICE_NAME]+"</h5></td><td><h5 class=\"text-success\">"+ device[IP_ADDRESS]+"</h5></td>";
				panelHTML += "		 <td><a href=\"#\" data-form=\" {&quot;DeviceName&quot;:&quot;"+device[DEVICE_NAME]+"&quot;,&quot;MacAddress&quot;:&quot;"+device[MAC_ADDRESS]+"&quot;}\" class=\"btn btn-danger btn-sm removeFromWhiteListBtn\">";
				panelHTML += "		      <span class=\"glyphicon glyphicon-minus-sign\"></span> Remove</a>&nbsp;&nbsp;";
				panelHTML += "		    </td>";
			}else{
				panelHTML += "			<td><button type=\"submit\"  class=\"btn btn-primary btn-sm\">";
				panelHTML += "		        	<span class=\"glyphicon glyphicon-stats\"></span>&nbsp;";
				panelHTML += "		        </button>";
				panelHTML += "		    </td>";
				panelHTML += "		   <td><h5 class=\"text-danger\">"+i+ device[DEVICE_NAME]+"</h5></td><td><h5 class=\"text-danger\">"+ device[IP_ADDRESS]+"</h5></td>";
				panelHTML += "		 <td><a href=\"#\" data-form=\" {&quot;DeviceName&quot;:&quot;"+device[DEVICE_NAME]+"&quot;,&quot;MacAddress&quot;:&quot;"+device[MAC_ADDRESS]+"&quot;}\" class=\"btn btn-success btn-sm addTWhiteListBtn\">";
				panelHTML += "		      <span class=\"glyphicon glyphicon-plus-sign\"></span> Add</a>&nbsp;&nbsp;";
				panelHTML += "		    </td>";
			}
			panelHTML += "		</tr> ";
		}
		panelHTML += "	</table>";
		panelHTML += "	</div>";
		panelHTML += "	</div>";
		panelHTML += "	</div>";
		panelHTML += "	</div>";
		return  panelHTML;
	}
}

