class Networking{

    constructor(){

    }
    process(panelTitle){
        var panelHTML = "<div class=\"col-lg-12\">";
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading\"><h4>"+panelTitle+"</h4></div>";
        panelHTML += "<div class=\"panel-body text-center\">";
        panelHTML += "<div class=\"row\">";
        panelHTML += "<Form id=\"Resignal\" name=\"ReSignal\"  id=\"MainForm\" method=\"POST\" action=\"TeleonomeServlet\">";
        
        var currentIdentityModePointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_CURRENT_IDENTITY_MODE;
		var currentIdentityMode = getDeneWordByIdentityPointer(currentIdentityModePointer, DENEWORD_VALUE_ATTRIBUTE);

        var ipAddressPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_WIFI_INFO + ":" +"Host IP Address";
        var ipAddress = getDeneWordByIdentityPointer(ipAddressPointer, DENEWORD_VALUE_ATTRIBUTE);
        var essidPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_WIFI_INFO + ":" +"ESSID";
        var essid = getDeneWordByIdentityPointer(essidPointer, DENEWORD_VALUE_ATTRIBUTE);
       
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
            $.ajax({
                type: "GET",
                url: "/TeleonomeServlet",
                data: {formName:"GetSSIDs" },
                success: function (availableSSIDs) {
                    console.log("commandId=" + data);
                    for(var i = 0; i < availableSSIDs.length; i++) {
                        var item = availableSSIDs[i];
                        var security="";
                        if(item["Authentication"]!=null && item["Authentication"].indexOf("PSK")>-1)security="Password";
                        var key = item["SSID"]+ "-" + item["Signal"] + " " + security;
                        var value=item["SSID"] ;
                        panelHTML += "<option value=\""+ value+"\">"+ key +"</option>";
                    }	
                },
                error: function(data){
                    console.log("error getting log file:" + JSON.stringify(data));
                    alert("Error getting log:" + JSON.stringify(data));
                    return false;
                }
            });	

           
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
            panelHTML += "<label id=\"CurrentESSID\">Current SSID:&nbsp;&nbsp;"+ essid +"</label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
            panelHTML += "<label id=\"CurrentIPAddress\">Current IPAddress:&nbsp;&nbsp;"+ ipAddress +"</label>";
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
        
        
        panelHTML += "<input type=\"Hidden\" id=\"formName\" name=\"formName\" value=\"ReSignal\">";
       // panelHTML += "<div class=\"row\"><div class=\"col-xs-12\" style=\"height: 100px;\"></div></div>";
        panelHTML += "<div class=\"row\">";
       
        panelHTML += "<div class=\"col-lg-3 col-xs-3\"></div>";
        panelHTML += "<div class=\"col-lg-3 col-xs-3\"><input class=\"btn btn-primary  btn-lg\" type=\"Submit\" name=\"action\" id=\"RebootButton\" value=\"Reboot\"></div>";
        panelHTML += "<div class=\"col-lg-3 col-xs-3\"><input class=\"btn btn-primary  btn-lg\" type=\"Submit\"  name=\"action\" id=\"ShutdownButton\" value=\"Shutdown\"></div>";
        panelHTML += "<div class=\"col-lg-3  col-xs-3\"></div>";
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
            
            $.ajax({
                type: "GET",
                url: "/TeleonomeServlet",
                data: {formName:"GetConnectedClients" },
                success: function (connectedClients) {
                    console.log("commandId=" + data);
                    for(var i = 0; i < connectedClients.length; i++) {
                        var obj = connectedClients[i];
                        panelHTML += "<tr><td>" + obj.name + "</td><td>"+obj.ipaddress+"</td></tr>";
                    }		
                },
                error: function(data){
                    console.log("error getting log file:" + JSON.stringify(data));
                    alert("Error getting log:" + JSON.stringify(data));
                    return false;
                }
            });	


            			
            panelHTML += "</tbody>";
            panelHTML += "</table>";
            panelHTML += "</div>";
            panelHTML += "</div>";
            
        }
        return panelHTML;
    }
}