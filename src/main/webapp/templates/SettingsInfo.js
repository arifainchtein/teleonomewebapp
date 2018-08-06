class SettingsInfo{
	
	constructor(){

    }

    process(){
        var panelHtml='';				
        panelHtml +='<div class="row">';
        panelHtml +='   <div class="col-lg-12">';
        panelHtml +='       <div class="bs-component">';   
        panelHtml +='           <div class="panel panel-default">';
        panelHtml +='               <div class="panel-heading">';
        panelHtml +='                    <div class="row top-buffer">';
        panelHtml +='                       <div class="col-lg-9 col-xs-9"> </div>';
        panelHtml +='                       <div class="col-lg-1 col-xs-1 SettingBar">';
        panelHtml +='                           <span  id="UpdateParams" class="text-center"><i class="glyphicon glyphicon-tasks"></i><br>Params</span>';
        panelHtml +='                       </div>';
        panelHtml +='                       <div class="col-lg-1 col-xs-1 SettingBar">';
        panelHtml +='                           <span id="DeviceInfo" class="text-center"><i class="glyphicon glyphicon-info-sign"></i><br>Info</span>';
        panelHtml +='                       </div>';
        panelHtml +='                       <div class="col-lg-1 col-xs-1 SettingBar">';
        panelHtml +='                           <span id="Wifi" class="text-center"><i class="glyphicon glyphicon-signal"></i><br>Wifi</span>';
        panelHtml +='                       </div> ';          
        panelHtml +='                   </div> ';  
        panelHtml +='               </div>';
        panelHtml +='               <div class="panel-body" id="SettingsWorkArea" style="display:none"></div>';
        panelHtml +='           </div> ';
        panelHtml +='       </div>';
        panelHtml +='   </div> ';
        panelHtml +='</div> ';







        for(var u=0;u<pointers.length;u++){
            var aDeneToTable = new DeneToTable();
            panelHTML += aDeneToTable.process(pointers[u]);
        }
        

        return panelHtml;
    }

    
    
}