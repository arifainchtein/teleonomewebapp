class SystemDiagnostics{

	constructor(){

	}

	process(){
		var currentViewObjectU = localStorageManager.getItem(LOCAL_STORAGE_CURRENT_VIEW_KEY);
		if(currentViewObjectU != null && currentViewObjectU != undefined){
			var currentViewObject = JSON.parse(currentViewObjectU);
			var secundaryView = currentViewObject["SecundaryView"];
			if( secundaryView != "SystemDiagnostics"){
				localStorageManager.removeComponentInfo(LOCAL_STORAGE_CURRENT_VIEW_KEY);
				var currentViewObject ={};
				currentViewObject["SecundaryView"]="SystemDiagnostics";  
				localStorageManager.setItem(LOCAL_STORAGE_CURRENT_VIEW_KEY, currentViewObject);
			}
		}

	}

	process1(){
		var commandsInfo;

		var panelHTML = "<div class=\"col-lg-12\">";
		panelHTML += "      <div class=\"bs-component\">";
		panelHTML += "          <div class=\"panel panel-default\">";
		panelHTML += "              <div class=\"panel-heading\"><h4>Internal Power</h4></div>";
		panelHTML += "              <div class=\"panel-body text-center\">";
		panelHTML += "                  <div class=\"battery\">";    
		panelHTML += "                  	<div class=\"battery-level\"></div>";  
		panelHTML += "                  	<i id=\"InternalBatteryChargingInd\" class=\"glyphicon glyphicon-erase\"></i>";  
		panelHTML += "                  </div>"; 
		panelHTML += "                  <div class=\"current\">";    
		panelHTML += "                  </div>";
		panelHTML += "              </div>";    // closing <div class=\"panel-body text-center\"
		panelHTML += "              <div class=\"panel-footer\">";

		panelHTML += "              <div class=\"row\">";
		panelHTML += "                  <form  action=\"\">";
		panelHTML += "                      <div class=\"col-lg-1 col-md-1 col-sm-1 col-xs-1\"></div>";
		panelHTML += "                      <div class=\"col-lg-2 col-md-2 col-sm-2 col-xs-2\">";
		panelHTML += "                          <div class=\"form-group\">";
		panelHTML += "                              <div class=\"checkbox\">";
		panelHTML += "                                  <label><input type=\"checkbox\" id=\"UserLogs\" checked />  User</label>";
		panelHTML += "                              </div>";
		panelHTML += "                          </div>";
		panelHTML += "                      </div>";


		panelHTML += "                      <div class=\"col-lg-3 col-md-3 col-sm-3 col-xs-3\">";
		panelHTML += "                          <div class=\"form-group\">";
		panelHTML += "                              <div class=\"checkbox\">";
		panelHTML += "                                  <label><input type=\"checkbox\" id=\"SystemLogs\" checked />  System</label>";
		panelHTML += "                              </div>";
		panelHTML += "                          </div>";
		panelHTML += "                      </div>";


		panelHTML += "                      <div class=\"col-lg-3 col-md-3 col-sm-3 col-xs-3\">";
		panelHTML += "                          <div class=\"form-group\">";
		panelHTML += "                              <label for=\"limit\">Show:</label>";
		panelHTML += "                              <select class=\"form-control\" id=\"limit\">";
		panelHTML += "                                   <option value=\"5\">5</option>";
		panelHTML += "                                   <option value=\"10\">10</option>";
		panelHTML += "                                   <option value=\"20\">20</option>";
		panelHTML += "                                   <option value=\"50\">50</option>";
		panelHTML += "                               </select>";
		panelHTML += "                          </div>";
		panelHTML += "                      </div>";

		panelHTML += "                      <div class=\"col-lg-3 col-md-3 col-sm-3 col-xs-3\">";
		panelHTML += "                          <button type=\"submit\" id=\"AsyncUpdateButton\" class=\"btn btn-default pull right\">Submit</button>";
		panelHTML += "                      </div>";
		panelHTML += "                  </form>";

		panelHTML += "              </div>";    // closing row
		panelHTML += "         </div>";    // closing panel-footer
		panelHTML += "          </div>";    // closing <div class=\"panel panel-default\"
		panelHTML += "      </div>";    // closing <div class=\"bs-component\"


		var currentViewObjectU = localStorageManager.getItem(LOCAL_STORAGE_CURRENT_VIEW_KEY);
		if(currentViewObjectU != null && currentViewObjectU != undefined){
			var currentViewObject = JSON.parse(currentViewObjectU);
			var secundaryView = currentViewObject["SecundaryView"];
			if( secundaryView != "AsynchronousDiagnostics"){
				localStorageManager.removeComponentInfo(LOCAL_STORAGE_CURRENT_VIEW_KEY);
				var currentViewObject ={};
				var jsonData = {
						offset:0,
						limit:5,
						userLogs:"Yes",
						systemLogs:"Yes"
				}
				var s = JSON.stringify(jsonData);
				currentViewObject["Data"]=s;
				currentViewObject["SecundaryView"]="AsynchronousDiagnostics";  
				localStorageManager.setItem(LOCAL_STORAGE_CURRENT_VIEW_KEY, currentViewObject);
				renderAsyncCommands("Yes","Yes", 5, 0 );
			}else{
				var data = currentViewObject["Data"];
				var stateData = JSON.parse(data);
				renderAsyncCommands(stateData.userLogs,stateData.systemLogs, stateData.limit, stateData.offset );
			} 
		}










		return panelHTML;
	}



}