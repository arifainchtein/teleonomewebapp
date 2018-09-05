class SettingsInfo{
	
	constructor(){

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
        panelHtml +='                           <span id="DeviceInfo" data-panelpointer="Device Info Panel" class="text-center SettingsMenu"><i class="glyphicon glyphicon-info-sign"></i><br>Info</span>';
        panelHtml +='                       </div>';
        panelHtml +='                       <div class="col-lg-9 col-xs-6"> </div>';
        panelHtml +='                       <div class="col-lg-1 col-xs-2 SettingBar">';
        panelHtml +='                           <span  id="UpdateParams" data-panelpointer="Update Params Panel" class="text-center SettingsMenu"><i class="glyphicon glyphicon-tasks"></i><br>Params</span>';
        panelHtml +='                       </div>';
        panelHtml +='                       <div class="col-lg-1 col-xs-2 SettingBar">';
        panelHtml +='                           <span id="Wifi" data-panelpointer="Configure Wifi Panel" class="text-center SettingsMenu"><i class="glyphicon glyphicon-signal"></i><br>Wifi</span>';
        panelHtml +='                       </div> ';          
        panelHtml +='                   </div> ';  
        panelHtml +='               </div>';
        panelHtml +='               <div class="panel-body" id="SettingsWorkArea" style="display:none"></div>';
        panelHtml +='           </div> ';
        panelHtml +='       </div>';
        panelHtml +='   </div> ';
        panelHtml +='</div> ';

        $.ajax({
            type: "POST",
            url: "/TeleonomeServlet",
            data: {formName:"GetAllCommandRequests"},
            success: function (data) {
                console.log("GetAllCommandRequests res," + data);
                allCommands = JSON.parse(data);
                
                if(allCommands.length>0){
                    $('#SettingsWorkArea').empty();
                    var panelHTML = renderCommandRequestTable(allCommands);
                    $('#SettingsWorkArea').append(panelHTML);
                    $('#SettingsWorkArea').show();
                }

            },
            error: function(data){
                console.log("error getting commanda data:" + data);
                alert("Error getting commanda data:" +  data);
                panelHtml +='               <div class="panel-body" id="SettingsWorkArea" style="display:none"></div>';
                return false;
            }
        });

       			
       
       
        

        

        return panelHtml;
    }

    
    
}