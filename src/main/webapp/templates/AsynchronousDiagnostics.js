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
        panelHTML += "                  <div class=\"panel-footer\">";
        panelHTML += "                      <form class=\"form-inline\" action=\"\">";
        panelHTML += "                          <div class=\"form-group\">";
        panelHTML += "                              <div class=\"checkbox\">";
        panelHTML += "                                  <label><input type=\"checkbox\" id=\"UserLogs\" />  User</label>";
        panelHTML += "                              </div>";
        panelHTML += "                          </div>";
        panelHTML += "                          <div class=\"form-group\">";
        panelHTML += "                              <div class=\"checkbox\">";
        panelHTML += "                                  <label><input type=\"checkbox\" id=\"SystemLogs\" />  System</label>";
        panelHTML += "                              </div>";
        panelHTML += "                          </div>";
        panelHTML += "                          <button type=\"submit\" class=\"btn btn-default\">Submit</button>";
        panelHTML += "                      </form>";
        panelHTML += "              </div>";    // closing panel-footer
		panelHTML += "          </div>";    // closing <div class=\"panel panel-default\"
        panelHTML += "      </div>";    // closing <div class=\"bs-component\"
            

        $.ajax({
            type: "POST",
            url: "/TeleonomeServlet",
            data: {formName:"GetAllCommandRequests"},
            success: function (data) {
                console.log("GetAllCommandRequests res," + data);
                commandsInfo = JSON.parse(data);
                var allCommands = commandsInfo.Values;
                if(allCommands.length>0){
                    $('#AynchronousLog').empty();
                    var panelHTML = renderCommandRequestTable(commandsInfo);
                    $('#AynchronousLog').append(panelHTML);
                    $('#AynchronousLog').show();
                }

            },
            error: function(data){
                console.log("error getting commanda data:" + data);
                alert("Error getting commanda data:" +  data);
                panelHtml +='               <div class="panel-body" id="AynchronousLog" style="display:none"></div>';
                return false;
            }
        });

        return panelHTML;
    }

    
    
}