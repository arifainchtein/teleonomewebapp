class SettingsInfo{
	
	constructor(){

        var currentViewObjectU = localStorageManager.getItem(LOCAL_STORAGE_CURRENT_VIEW_KEY);
		if(currentViewObjectU != null && currentViewObjectU != undefined){
            var currentViewObject = JSON.parse(currentViewObjectU);
			var secundaryView = currentViewObject["SecundaryView"];
			if( secundaryView !="" && 
            secundaryView!="DeviceInfo" &&
            secundaryView!="UpdateParams" && 
            secundaryView!="WiFi")
            {
                localStorageManager.removeComponentInfo(LOCAL_STORAGE_CURRENT_VIEW_KEY);
            } 
        }
    }

    process(){
        var allCommands=[];
        var panelHtml='';	
        panelHtml +='<div class="row">';
        panelHtml +='   <div class="col-lg-12">';
        panelHtml +='       <div class="bs-component">';   
        panelHtml +='           <div class="panel panel-default">';
        panelHtml +='               <div class="panel-heading">';
        panelHtml +='                    <div class="row top-buffer">';
        panelHtml +='                       <div class="col-lg-1 col-xs-2 SettingBar">';
        panelHtml +='                           <span id="Wifi" data-panelpointer="Configure Wifi Panel" class="text-center SettingsMenu"><i class="glyphicon glyphicon-signal"></i><br>Network</span>';
        panelHtml +='                       </div> ';
        panelHtml +='                       <div class="col-lg-1 col-xs-2 SettingBar">';
        panelHtml +='                           <span  id="UpdateParams" data-panelpointer="Update Params Panel" class="text-center SettingsMenu"><i class="glyphicon glyphicon-tasks"></i><br>Params</span>';
        panelHtml +='                       </div>';
        panelHtml +='                       <div class="col-lg-1 col-xs-2 SettingBar">';
        panelHtml +='                           <span id="DeviceInfo" data-panelpointer="Device Info Panel" class="text-center SettingsMenu"><i class="glyphicon glyphicon-info-sign"></i><br>Info</span>';
        panelHtml +='                       </div>';
   

        panelHtml +='                       <div class="col-lg-8 col-xs-3"> </div>';
        panelHtml +='                       <div class="col-lg-1 col-xs-3 SettingBar">';
    
        //panelHtml +='                       <span id="PowerButton" data-panelpointer="Power Menu" class="text-center SettingsMenu"><i class="glyphicon glyphicon-off"></i><br>Power</span>';
     
        
        panelHtml +='                           <div class="btn-group">';
        panelHtml +='                           <button type="button" id="MainPowerButton" class="btn btn-success dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="padding-top:15px;top:-10px;">';
        panelHtml +='                               <i class="glyphicon glyphicon-off"></i><br>Power';
        panelHtml +='                             </button>';
        panelHtml +='                             <ul class="dropdown-menu">';
        panelHtml +='                               <li><a id="RestartButton" class="dropdown-item" href="#">Restart</a></li>';
        panelHtml +='                               <li><a id="ShutdownButton" class="dropdown-item" href="#">Turn Off</a></li>';
        panelHtml +='                             </ul>';
        panelHtml +='                           </div>';

     
     
     
        panelHtml +='                       </div>';
    
               
        panelHtml +='                   </div> ';  
        panelHtml +='               </div>';
        panelHtml +='               <div class="panel-body" id="SettingsWorkArea" style="display:none"></div>';
        panelHtml +='           </div> ';
        panelHtml +='       </div>';
        panelHtml +='   </div> ';
        panelHtml +='</div> ';
        return panelHtml;
    }

    
    
}