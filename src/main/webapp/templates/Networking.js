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

        var panelHTML = "<div class=\"col-lg-12\">";
        panelHTML += "		<div class=\"bs-component\">";
        panelHTML += "			<div class=\"panel with-nav-tabs \">";
        panelHTML += "				<div class=\"panel-heading\"><h4>Networking Configuration</h4>";
        panelHTML += "					<ul class=\"nav nav-tabs\">";
        if(hasWlan0){
            panelHTML += "					<li><a id=\"wlan0\" href=\"#\" data-toggle=\"tab\">wlan0</a></li>";
        }
        if(hasWlan1){
            panelHTML += "					<li><a id=\"wlan1\" href=\"#\" data-toggle=\"tab\">wlan1</a></li>";
        }
        if(hasEth0){
            panelHTML += "					<li><a id=\"eth0\" href=\"#\" data-toggle=\"tab\">eth0</a></li>";
        }
        panelHTML += "					</ul>";
        panelHTML += "				</div>";
        panelHTML += "				<div class=\"panel-body text-center\">";
        panelHTML += "					<div class=\"tab-content\">";
        panelHTML += "						<div id=\"NetworkingInfoArea\"></div>";
        panelHTML += "					</div>";
        panelHTML += "				</div>";
        panelHTML += "			</div>";
        panelHTML += "		</div>";
        panelHTML += "	</div>";
        return panelHTML;     
    }

           
    
}