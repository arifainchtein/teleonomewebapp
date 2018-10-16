class NewRememberedDeneWordWizard{

    constructor(){

    }

    process(){
        
        var panelHTML = "";
        
          
        panelHTML += "              <div class=\"col-lg-12\">";
        panelHTML += "                  <div class=\"bs-component\">";
        panelHTML += "                      <div class=\"panel panel-default\">";
        panelHTML += "                          <div class=\"panel-heading\"><h4><span id=\"ModalHeadingText\"></span></h4></div>";
        panelHTML += "                          <div class=\"panel-body text-center\">";
        panelHTML += "                              <div class=\"well\" id=\"NewRememberedWordIdentity\" class=\"row\"></div>";
        panelHTML += "                              <div id=\"NewRememberedWordOrganismView\" class=\"row\"></div>";
        panelHTML += "                              <div id=\"NewRememberedWordNucleusView\" class=\"row\"></div>";
        panelHTML += "                              <div id=\"NewRememberedWordDeneChainView\" class=\"row\"></div>";
        panelHTML += "                              <div id=\"NewRememberedWordDeneView\" class=\"row\"></div>";
        panelHTML += "                              <div id=\"NewRememberedWordDeneWordView\" class=\"row\"></div>";
        panelHTML += "                          </div>";
        panelHTML += "                      </div>"; //panel panel-default           
        panelHTML += "                  </div>";   //bs-component  
        panelHTML += "              </div>"; // col-lg-12
        
        return panelHTML;
    }

}