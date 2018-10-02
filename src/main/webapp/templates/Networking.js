class Networking{

    constructor(){
        localStorageManager.removeComponentInfo(LOCAL_STORAGE_CURRENT_VIEW_KEY);
        var currentViewObject ={};
        currentViewObject["SecundaryView"]="WiFi";
        localStorageManager.setItem(LOCAL_STORAGE_CURRENT_VIEW_KEY, currentViewObject);      

    }
    process(panelTitle){
        //
        // There are three cases
        //
        // 1)The teleonome only has wlan0 - In this case wlan0 can be in on of two states, as a host or as part of a network
        //
        // 2)The teleonome has wlan0 and wlan1 - In this case wlan0 is always the network interface bound to the outside network
        //   and wlan1 is the host for the 172.16.1.1 network. In this case you allow users to configure wlan0 as to select the
        //   wifi host (make sure not to show the internal ssid)
        //
        // 3)The teleonome has only ethernet
        //
        $.ajax({
            type: "GET",
            url: "/TeleonomeServlet",
            data: {formName:"GetNetworkInterfaces" },
            success: function (data) {
                var interfaces = JSON.parse(data);
                var hasWlan0=interfaces.hasOwnProperty("wlan0");
                var hasWlan1=interfaces.hasOwnProperty("wlan1");
                var hasEth0=interfaces.hasOwnProperty("eth0");
                renderUI( hasWlan0, hasWlan1, hasEth0, panelTitle);
            },
            error: function(data){
                $('#WaitingWheel').hide();
                console.log("error getting log file:" + JSON.stringify(data));
                alert("Error getting log:" + JSON.stringify(data));
                return false;
            }
        });
       
    }
    
    renderUI( hasWlan0, hasWlan1, hasEth0, panelTitle){
        

        var panelHTML = "<div class=\"col-lg-12\">";
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading\"><h4>"+panelTitle+"</h4></div>";
        panelHTML += "<div class=\"panel-body text-center\">";
        panelHTML += "<div class=\"row\">";

        if(hasWlan1){
            //
            // there are two wifi interfaces, so allow the user to configure wlan0 to select which ssid to bind to
            // 




        }else{
            //
            // there is only 1 wifi 
            //
           
            panelHTML += "<Form id=\"Resignal\" name=\"ReSignal\"  id=\"MainForm\" method=\"POST\" action=\"TeleonomeServlet\">";
            
            var currentIdentityModePointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_CURRENT_IDENTITY_MODE;
            var currentIdentityMode = getDeneWordByIdentityPointer(currentIdentityModePointer, DENEWORD_VALUE_ATTRIBUTE);
    
            var ipAddressPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_WIFI_INFO + ":" +"Host IP Address";
            var ipAddress = getDeneWordByIdentityPointer(ipAddressPointer, DENEWORD_VALUE_ATTRIBUTE);
            var essidPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_WIFI_INFO + ":" +"ESSID";
            var essid = getDeneWordByIdentityPointer(essidPointer, DENEWORD_VALUE_ATTRIBUTE);
            var linkQualityPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_WIFI_INFO + ":" +"Link Quality";
            var linkQuality = getDeneWordByIdentityPointer(linkQualityPointer, DENEWORD_VALUE_ATTRIBUTE);
            var signallevelPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_WIFI_INFO + ":" +"Signal level";
            var signallevel = getDeneWordByIdentityPointer(signallevelPointer, DENEWORD_VALUE_ATTRIBUTE);
    
    
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
    
                //
                // set up the available ssids
                //
                $('#WaitingText').html("Please Wait...");
                $('#WaitingWheel').show();
            
                $.ajax({
                    type: "GET",
                    url: "/TeleonomeServlet",
                    data: {formName:"GetSSIDs" },
                    success: function (availableSSIDs) {
                        //console.log("availableSSIDs=" + data);
                       // var availableSSIDs = JSON.parse(data);
                        $('#AvailableNetworks').append('<option value="">Select SSID</option>');
                        for(var i = 0; i < availableSSIDs.length; i++) {
                            var item = availableSSIDs[i];
                            var security="";
                            if(item["Authentication"]!=null && item["Authentication"].indexOf("PSK")>-1)security="Password";
                            var key = item["SSID"]+ "-" + item["Signal"] + " " + security;
                            var value=item["SSID"] ;
                            //ssidOptions += "<option value=\""+ value+"\">"+ key +"</option>";
                            $('#AvailableNetworks').append($('<option>', {value:value, text:key}));
                        }	
                        $('#ssidPassword').hide();
                        $('#WaitingWheel').hide();
                    },
                    error: function(data){
                        $('#WaitingWheel').hide();
                        console.log("error getting log file:" + JSON.stringify(data));
                        alert("Error getting log:" + JSON.stringify(data));
                        return false;
                    }
                });	
    
            }else{
                panelHTML += "<div id=\"SelfMode\">";
                panelHTML += "<center>";
                panelHTML += "<div class=\"row\">";
                panelHTML += "<label id=\"CurrentESSID\">Current SSID:&nbsp;&nbsp;"+ essid +"</label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                panelHTML += "<label id=\"CurrentIPAddress\">Current IPAddress:&nbsp;&nbsp;"+ ipAddress +"</label><br>";
                panelHTML += "<label id=\"LinkQuality\">Link Quality:&nbsp;&nbsp;"+ linkQuality +"</label>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                panelHTML += "<label id=\"SignalLevel\">Signal Level:&nbsp;&nbsp;"+ signallevel +"</label>";
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
            if(currentIdentityMode == TELEONOME_IDENTITY_SELF){
                //
                // layout the connected clients
                //
                panelHTML += "<div class=\"row\">";
                var screensize = document.documentElement.clientWidth;
                if(screensize<500){
                    panelHTML += "<div  class=\"col-xs-1\"></div>";
                    panelHTML += "<div id=\"ConnectedClients\" class=\"col-lg-6  col-xs-10\"></div>";
                    panelHTML += "<div  class=\"col-xs-1\"></div>";
                }else{
                    panelHTML += "<div id=\"ConnectedClients\" class=\"col-lg-6  col-xs-12\"></div>";
                }
                
                panelHTML += "</div>";
                
                $.ajax({
                    type: "GET",
                    url: "/TeleonomeServlet",
                    data: {formName:"GetConnectedClients" },
                    success: function (connectedClients) {
                        console.log("commandId=" + connectedClients);
                        var clientsTable="";
                        $('#ConnectedClients').empty();
                        if(connectedClients.length>0){
                            
                            clientsTable += "<br><label><h4>Connected Clients:</h4></label><br>";
                            clientsTable += "	<table id=\"ClientsTable\" class=\"table table-striped table-responsive\">";
                            clientsTable += "<thead>";
                            clientsTable += "<tr> <th class=\"text-center\">Name</th> <th class=\"text-center\">IPAddress</th></tr>";
                            clientsTable += "</thead>";
                            clientsTable += "<tbody>";
    
                            for(var i = 0; i < connectedClients.length; i++) {
                                var obj = connectedClients[i];
                                clientsTable += "<tr><td>" + obj.name + "</td><td>"+obj.ipaddress+"</td></tr>";
                            }	
                            clientsTable += "</tbody>";
                            clientsTable += "</table>";
                            $('#ConnectedClients').append(clientsTable);
                        }
                            
                    },
                    error: function(data){
                        console.log("error getting log file:" + JSON.stringify(data));
                        
                        return false;
                    }
                });	
            }
        }

         panelHTML += "<input type=\"Hidden\" id=\"formName\" name=\"formName\" value=\"ReSignal\">";
         // panelHTML += "<div class=\"row\"><div class=\"col-xs-12\" style=\"height: 100px;\"></div></div>";
         panelHTML += "<div class=\"row\">";
         panelHTML += "<div class=\"col-lg-3 col-xs-1\"></div>";
         panelHTML += "<div class=\"col-lg-3 col-xs-4\"><input class=\"btn btn-primary  btn-lg\" type=\"Submit\" name=\"action\" id=\"RebootButton\" value=\"Reboot\"></div>";
         panelHTML += "<div class=\"col-lg-1  col-xs-1\"></div>";
         panelHTML += "<div class=\"col-lg-3 col-xs-5\"><input class=\"btn btn-primary  btn-lg\" type=\"Submit\"  name=\"action\" id=\"ShutdownButton\" value=\"Shutdown\"></div>";
         panelHTML += "<div class=\"col-lg-2  col-xs-1\"></div>";
         panelHTML += "</div>";
         panelHTML += "</form>";	

         
        
        return panelHTML;
    }
}