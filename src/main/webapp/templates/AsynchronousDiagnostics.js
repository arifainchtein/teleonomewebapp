class AsynchronousDiagnostics{
	
	constructor(){

    }

    process(){
        var commandsInfo;

        var panelHTML = "<div class=\"col-lg-12\">";
        panelHTML += "      <div class=\"bs-component\">";
        panelHTML += "          <div class=\"panel panel-default\">";
        panelHTML += "              <div class=\"panel-heading\"><h4>Asynchronous Cycle</h4></div>";
        panelHTML += "              <div class=\"panel-body text-center\">";
        panelHTML += "                  <div id=\"AynchronousLog\"></div>";    // closing AynchronousLog"
        panelHTML += "                  <div id=\"Pagination\"></div>";    // closing AynchronousLog"
        panelHTML += "              </div>";    // closing <div class=\"panel-body text-center\"
        panelHTML += "              <div class=\"panel-footer\">";
    panelHTML += "                      <form class=\"form-inline\" action=\"\">";
    panelHTML += "                          <div class=\"form-group\">";
    panelHTML += "                              <div class=\"checkbox\">";
    panelHTML += "                                  <label><input type=\"checkbox\" id=\"UserLogs\" checked />  User</label>";
    panelHTML += "                              </div>";
    panelHTML += "                          </div>";
    panelHTML += "                          <div class=\"form-group\">";
    panelHTML += "                              <div class=\"checkbox\">";
    panelHTML += "                                  <label><input type=\"checkbox\" id=\"SystemLogs\" checked />  System</label>";
    panelHTML += "                              </div>";
    panelHTML += "                          </div>";
    panelHTML += "                          <div class=\"form-group\">";
    panelHTML += "                              <label for=\"limit\">Show:</label>";
    panelHTML += "                              <select class=\"form-control\" id=\"limit\">";
    panelHTML += "                                   <option value=\"5\">5</option>";
    panelHTML += "                                   <option value=\"10\">10</option>";
    panelHTML += "                                   <option value=\"20\">20</option>";
    panelHTML += "                                   <option value=\"50\">50</option>";
    panelHTML += "                               </select>";
    panelHTML += "                              </div>";
    panelHTML += "                          </div>";
    panelHTML += "                          <button type=\"submit\" id=\"AsyncUpdateButton\" class=\"btn btn-default pull right\">Submit</button>";
    panelHTML += "                      </form>";
        panelHTML += "              </div>";    // closing panel-footer
		panelHTML += "          </div>";    // closing <div class=\"panel panel-default\"
        panelHTML += "      </div>";    // closing <div class=\"bs-component\"

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

        return panelHTML;
    }

    
    
}