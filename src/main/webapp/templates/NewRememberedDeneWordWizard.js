class NewRememberedDeneWordWizard{

    constructor(){

    }

    process(){
        
        var panelHTML = "";
        
        panelHTML = "<div class=\"modal fade bs-example-modal-lg\" tabindex=\"-1\" id=\"NewRememberedDeneWordWizard\" role=\"dialog\" aria-labelledby=\"NewRememberedDeneWordWizard\" aria-hidden=\"true\">";
        panelHTML = "   <div class=\"modal-dialog modal-lg\">";
        panelHTML = "       <div class=\"modal-content\">";
        panelHTML = "           <div class=\"modal-header\">";
        panelHTML = "               <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>";
        panelHTML = "               <h4 class=\"modal-title\" id=\"myModalLabel\">Start Remembering</h4>";
        panelHTML = "           </div>";

        panelHTML = "           <div class=\"col-lg-12\">";
        panelHTML += "              <div class=\"bs-component\">";
        panelHTML += "                  <div class=\"panel panel-default\">";
        panelHTML += "                      <div class=\"panel-heading\"><h4>Select the Teleonome</h4></div>";
        panelHTML += "                      <div class=\"panel-body text-center\">";
        panelHTML += "                          <div id=\"NewRememberedWordOrganismView\" class=\"row\"></div>";
        panelHTML += "                          <div id=\"NewRememberedWordNucleusView\" class=\"row\"></div>";
        panelHTML += "                          <div id=\"NewRememberedWordDeneChainView\" class=\"row\"></div>";
        panelHTML += "                          <div id=\"NewRememberedWordDeneView\" class=\"row\"></div>";
        panelHTML += "                          <div id=\"NewRememberedWordDeneWordView\" class=\"row\"></div>";
        panelHTML += "                      </div>";
        panelHTML += "                  </div>";            
        panelHTML += "              </div>";     
        panelHTML += "          </div>";

        panelHTML += "        </div>";
        panelHTML += "    </div>";
        panelHTML += "</div>";
        
        return panelHTML;
    }
}