class DiagnosticsInfo{
	
	constructor(){
  
        var currentViewObjectU = localStorageManager.getItem(LOCAL_STORAGE_CURRENT_VIEW_KEY);
		if(currentViewObjectU != null && currentViewObjectU != undefined){
            var currentViewObject = JSON.parse(currentViewObjectU);
			var secundaryView = currentViewObject["SecundaryView"];
			if( secundaryView !="" && 
                secundaryView!="AsynchronousDiagnostics" &&
                secundaryView!="SynchronousDiagnostics" && 
                secundaryView!="SystemDiagnostics")
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
        panelHtml +='                       <div class="col-lg-9 col-xs-6"> </div>';
        panelHtml +='                       <div class="col-lg-1 col-xs-2 DiagnosticsBar">';
        panelHtml +='                           <span id="Synchronous" data-panelpointer="Synchronous Panel" class="text-center DiagnosticsMenu"><i class="glyphicon glyphicon-time"></i><br>Synchronous</span>';
        panelHtml +='                       </div>';
        
        panelHtml +='                       <div class="col-lg-1 col-xs-2 DiagnosticsBar">';
        panelHtml +='                           <span  id="Asynchronous" data-panelpointer="Asynchronous Panel" class="text-center DiagnosticsMenu"><i class="glyphicon glyphicon-flash"></i><br>Asynchronous</span>';
        panelHtml +='                       </div>';
        panelHtml +='                       <div class="col-lg-1 col-xs-2 DiagnosticsBar">';
        panelHtml +='                           <span id="SystemDiagnostics" data-panelpointer="System Diagnostics Panel" class="text-center DiagnosticsMenu"><i class="glyphicon glyphicon-dashboard"></i><br>System</span>';
        panelHtml +='                       </div> ';          
        panelHtml +='                   </div> ';   

        panelHtml +='               </div>';
        panelHtml +='               <div class="panel-body" id="DiagnosticsWorkArea" style="display:none"></div>';
        panelHtml +='           </div> ';
        panelHtml +='       </div>';
        panelHtml +='   </div> ';
        panelHtml +='</div> ';
        return panelHtml;
    }

    
    
}