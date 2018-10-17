class SearchPanel{

    

    
    constructor(){
    
    }

    process(){
		var screensize = document.documentElement.clientWidth;
		var panelHTML="";
		panelHTML += "<div class=\"resizable ui-widget-content container-fluid wrap\">";
       
        if(screensize>500){
			panelHTML += "                <div class=\"row-fluid\">";
			panelHTML += "                    <div id=\"TopButtons\" class=\"pull-left TopButtons col-xs-8\">";
			panelHTML += "                        <button class=\"btn btn-default\" type=\"button\" id=\"NewChart\" type=\"submit\" value=\"Submit\"><em class=\"glyphicon glyphicon-plus\"></em>New</button>";
			panelHTML += "                        <button class=\"btn btn-default\" type=\"button\" id=\"ClearCharts\" type=\"submit\" value=\"Submit\"   style=\" margin-right:50px;\"><em class=\"glyphicon glyphicon-remove\"></em>Clear</button>";
			if(organismInfoJsonData != undefined){
				panelHTML += "                        <button class=\"btn btn-default\"  data-toggle=\"modal\" data-target=\"#NewRememberedDeneWordWizard\" type=\"button\" id=\"NewRemember\" type=\"submit\" value=\"Submit\" ><em class=\"glyphicon glyphicon-record\"></em>Remember</button>";
			}else{
				panelHTML += "                        <button class=\"btn btn-default \" type=\"button\" id=\"NewRemember\" type=\"submit\" value=\"Submit\" disabled><em class=\"glyphicon glyphicon-record\"></em>Remember</button>";
			}
			panelHTML += "                        <button class=\"btn btn-default \" type=\"button\" id=\"ForgetRememberedDeneWord\" type=\"submit\" value=\"Submit\"><em class=\"glyphicon glyphicon-remove\"></em>Stop Remembering</button>";
			panelHTML += "                    </div>";
			panelHTML += "                    <div id=\"UpdateArea\" class=\"TopButtons pull-right col-xs-4\"><div id=\"RefreshCounter\"></div><div id=\"RefreshCounterMessage\">Click to Pause</div></div>";
			panelHTML += "                </div>";
		}else{
			panelHTML += "                <div class=\"row-fluid\">";
			panelHTML += "                    <div id=\"TopButtons\" class=\"pull-left TopButtons col-xs-8\">";
			panelHTML += "                        <button class=\"btn btn-default btn-sm\" type=\"button\" id=\"NewChart\" type=\"submit\" value=\"Submit\"><em class=\"glyphicon glyphicon-plus\"></em></button>";
			panelHTML += "                        <button class=\"btn btn-default btn-sm\" type=\"button\" id=\"ClearCharts\" type=\"submit\" value=\"Submit\"   style=\" margin-right:50px;\"><em class=\"glyphicon glyphicon-remove\"></em></button>";
			if(organismInfoJsonData != undefined){
				panelHTML += "                        <button class=\"btn btn-default btn-sm\"  data-toggle=\"modal\" data-target=\"#NewRememberedDeneWordWizard\" type=\"button\" id=\"NewRemember\" type=\"submit\" value=\"Submit\" ><em class=\"glyphicon glyphicon-record\"></em></button>";
			}else{
				panelHTML += "                        <button class=\"btn btn-default btn-sm\" type=\"button\" id=\"NewRemember\" type=\"submit\" value=\"Submit\" disabled><em class=\"glyphicon glyphicon-record\"></em></button>";
			}
			panelHTML += "                        <button class=\"btn btn-default btn-sm\" type=\"button\" id=\"ForgetRememberedDeneWord\" type=\"submit\" value=\"Submit\"><em class=\"glyphicon glyphicon-remove\"></em></button>";
			panelHTML += "                    </div>";
			panelHTML += "                    <div id=\"UpdateArea\" class=\"TopButtons pull-right col-xs-4\"><div id=\"RefreshCounter\"></div><div id=\"RefreshCounterMessage\"></div></div>";
			panelHTML += "                </div>";
		}
        
        
        
	
		

		

        panelHTML += "                <div class=\"modal fade bannerformmodal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"bannerformmodal\" aria-hidden=\"true\" id=\"bannerformmodal\">";
        panelHTML += "				    <div class=\"modal-dialog modal-xl\">";
        panelHTML += "				        <div class=\"modal-content\">";
        panelHTML += "				            <div class=\"modal-content\">";
        panelHTML += "				                <div class=\"modal-header \">";
        panelHTML += "				                    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" id=\"dismissbannerformmodal\">&times;</button>";
        panelHTML += "                                    <h4 class=\"modal-title\" id=\"DisplayPulseTitle\"></h4>";
        panelHTML += "                                    <button type=\"button\"   onclick=\"CopyToClipboard('DisplayPulseData')\" id=\"CopyPulseData\">Copy</button>  ";                                  
        panelHTML += "				                </div>";
        panelHTML += "				                <div id=\"DisplayPulseData\" class=\"modal-body\"></div>";
        panelHTML += "				                <div class=\"modal-footer\"></div>  ";   
        panelHTML += "				            </div>";
        panelHTML += "				        </div>";
        panelHTML += "				    </div>";
        panelHTML += "                </div>";
        
		//
		// the panel for the new remembered
		//
		panelHTML += "          <div id=\"NewRememberedWordPanel\" class=\"row collapse \">";
		panelHTML += "              <div class=\"col-lg-12\">";
        panelHTML += "                  <div class=\"bs-component\">";
		panelHTML += "                      <div class=\"panel panel-default\">";
        panelHTML += "                          <div class=\"panel-heading\"> <h4><span id=\"ModalHeadingText\"></span> <button id=\"NewRememberedWordCloseButton\" type=\"button\" class=\"close pull-right\" >&times;</button></h4></div>";
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
		panelHTML += "          </div>"; // row
		//
		// end the panel for the new remembered
		//

		//
		// the panel for the forget remembered
		//
		panelHTML += "          <div id=\"ForgetRememberedWordPanel\" class=\"row collapse \">";
		panelHTML += "              <div class=\"col-lg-12\">";
        panelHTML += "                  <div class=\"bs-component\">";
		panelHTML += "                      <div class=\"panel panel-default\">";
        panelHTML += "                          <div class=\"panel-heading\"> <h4><span id=\"ForgetHeadingText\"></span> <button id=\"ForgetRememberedWordCloseButton\" type=\"button\" class=\"close pull-right\" >&times;</button></h4></div>";
        panelHTML += "                          <div class=\"panel-body text-center\">";
		panelHTML += "                              <select id=\"RememeberedDeneWords\" class=\"\"></select>";
		panelHTML += "                        <button class=\"btn btn-default \" type=\"button\" id=\"ForgetSubmitButton\" type=\"submit\" value=\"Submit\" disabled><em class=\"glyphicon glyphicon-record\"></em>Submit</button>";
        panelHTML += "                          </div>";
        panelHTML += "                      </div>"; //panel panel-default           
        panelHTML += "                  </div>";   //bs-component  
		panelHTML += "              </div>"; // col-lg-12
		panelHTML += "          </div>"; // row
		//
		// end the panel for the new remembered
		//


        if(screensize>500){
	        panelHTML += "                <div id=\"SearchConfigurator\"  class=\"SearchConfigurator row\" style=\"display:none\">";
	        panelHTML += "                        <form >";
	        panelHTML += "                                <div class=\"form-row\">";
	        panelHTML += "                                        <label for=\"Identity\">Remembered DeneWords</label>";
	        panelHTML += "                                    <select name=\"identity\" id=\"Identity\"></select><br>";
			panelHTML += "                                </div> ";  
			                             
	        // panelHTML += "                                <div class=\"form-row\">";
	        // panelHTML += "                                        <label for=\"Teleonome\">Search Denome</label>";
	        // panelHTML += "                                    <select name=\"Teleonome\" id=\"Teleonome\" onchange=\"searchFunctions.populateNuclei()\"></select>";
	        // panelHTML += "                                    <select name=\"Nucleus\" id=\"Nucleus\" onchange=\"searchFunctions.populateDeneChain()\"></select>";
	        // panelHTML += "                                    <select name=\"DeneChain\" id=\"DeneChain\" onchange=\"searchFunctions.populateDene()\"></select>";
	        // panelHTML += "                                    <select name=\"Dene\" id=\"Dene\" onchange=\"searchFunctions.populateDeneWord()\"></select>";
	        // panelHTML += "                                    <select name=\"DeneWord\" id=\"DeneWord\" onchange=\"searchFunctions.populateLookUpIdentity()\"></select>";
	        // panelHTML += "                                </div>";
			// panelHTML += "                                <div  id=\"LookUpIdentity\" name=\"lookupUpIdentity\"></div><br>";      
			
			
	        panelHTML += "                                <div class=\"form-row\">";
	        panelHTML += "                                    <div class=\"form-group col-md-6\">";
	        panelHTML += "                                        <label for=\"fromDate\">From</label>";
	        panelHTML += "                                        <input type=\"DATE\" name=\"fromDate\" id=\"fromDate\">    <input type=\"time\" name=\"fromTime\" id=\"fromTime\">";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                    <div class=\"form-group col-md-6\">";
	        panelHTML += "                                            <label for=\"untilDate\">Until</label>";
	        panelHTML += "                                        <input type=\"DATE\" name=\"untilDate\" id=\"untilDate\">    <input type=\"time\" name=\"untilTime\" id=\"untilTime\">";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                </div>";
	        panelHTML += "                                <div class=\"form-row\">";
	        panelHTML += "                                    <div class=\"form-group col-md-6\">";
	        panelHTML += "                                            <label for=\"VisualisationType\">View As</label>";
	        panelHTML += "                                            <select name=\"VisualisationType\" id=\"VisualisationType\">";
	        panelHTML += "                                                <option value=\"LineGraph\">Line Graph</option>";
	        panelHTML += "                                                <option value=\"DataTable\">Data Table</option>";
	        panelHTML += "                                            </select>";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                    <div class=\"form-group col-md-6\">";
	        panelHTML += "                                        <div class=\"form-check form-check-inline\">";
	        panelHTML += "                                            <input class=\"form-check-input\" type=\"checkbox\" id=\"AppendChart\" >";
	        panelHTML += "                                            <label class=\"form-check-label\" for=\"AppendChart\">Append</label>";
	        panelHTML += "                                        </div>";
	        panelHTML += "                                        <div class=\"form-check form-check-inline\">";
	        panelHTML += "                                            <input class=\"form-check-input\" type=\"checkbox\" id=\"LiveUpdate\" value=\"option2\">";
	        panelHTML += "                                            <label class=\"form-check-label\" for=\"LiveUpdate\">Live Update</label>";
	        panelHTML += "                                        </div>";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                </div>";
	        panelHTML += "                                <div class=\"form-row\">";
	        panelHTML += "                                    <div class=\"pull-right SearchConfiguratorButtons\">";
	        panelHTML += "                                        <button id=\"CancelSearch\" class=\"btn btn-default\" type=\"button\" type=\"submit\" value=\"Submit\">Cancel</button>";
	        panelHTML += "                                        <button id=\"GetDataSubmit\" class=\"btn btn-default\" type=\"button\" type=\"submit\" value=\"Submit\">Get Data</button>";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                </div> ";
	        panelHTML += "                         </form>";
	        panelHTML += "                </div>";
	    }else{
	    	panelHTML += "                <div id=\"SearchConfigurator\"  class=\"SearchConfiguratorSmall row\" style=\"display:none\">";
	        panelHTML += "                        <form >";
	        panelHTML += "                                <div class=\"form-row form-elements-small\">";
	        panelHTML += "                                        <label for=\"Identity\">Remembered DeneWords</label>";
	        panelHTML += "                                    <select name=\"identity\" id=\"Identity\"></select><br>";
	        panelHTML += "                                </div> ";                               
	        // panelHTML += "                                <div class=\"form-row form-elements-small\">";
	        // panelHTML += "                                        <label for=\"Teleonome\">Search Denome</label>";
	        // panelHTML += "                                    <select name=\"Teleonome\" id=\"Teleonome\" onchange=\"searchFunctions.populateNuclei()\"></select><br>";
	        // panelHTML += "                                    <select name=\"Nucleus\" id=\"Nucleus\" onchange=\"searchFunctions.populateDeneChain()\"></select><br>";
	        // panelHTML += "                                    <select name=\"DeneChain\" id=\"DeneChain\" onchange=\"searchFunctions.populateDene()\"></select><br>";
	        // panelHTML += "                                    <select name=\"Dene\" id=\"Dene\" onchange=\"searchFunctions.populateDeneWord()\"></select><br>";
	        // panelHTML += "                                    <select name=\"DeneWord\" id=\"DeneWord\" onchange=\"searchFunctions.populateLookUpIdentity()\"></select><br>";
	        // panelHTML += "                                </div>";
	        // panelHTML += "                                <div  id=\"LookUpIdentity\" class=\"form-elements\" name=\"lookupUpIdentity\"></div><br>";                                 
	        panelHTML += "                                <div class=\"form-row form-elements-small\">";
	        panelHTML += "                                    <div class=\"form-group col-md-6\">";
	        panelHTML += "                                        <label for=\"fromDate\">From</label>";
	        panelHTML += "                                        <input type=\"DATE\" name=\"fromDate\" id=\"fromDate\">    <input type=\"time\" name=\"fromTime\" id=\"fromTime\">";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                    <div class=\"form-group col-md-6\">";
	        panelHTML += "                                            <label for=\"untilDate\">Until</label>";
	        panelHTML += "                                        <input type=\"DATE\" name=\"untilDate\" id=\"untilDate\">    <input type=\"time\" name=\"untilTime\" id=\"untilTime\">";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                </div>";
	        panelHTML += "                                <div class=\"form-row form-elements-small\">";
	        panelHTML += "                                    <div class=\"form-group col-md-12\">";
	        panelHTML += "                                            <label for=\"VisualisationType\">View As</label>";
	        panelHTML += "                                            <select name=\"VisualisationType\" id=\"VisualisationType\">";
	        panelHTML += "                                                <option value=\"LineGraph\">Line Graph</option>";
	        panelHTML += "                                                <option value=\"DataTable\">Data Table</option>";
	        panelHTML += "                                            </select>";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                </div>";
	        panelHTML += "                                <div class=\"form-row form-elements-small\">";
	        panelHTML += "                                    <div class=\"form-group col-md-6 \">";
	        panelHTML += "                                        <div class=\"form-check form-check-inline\">";
	        panelHTML += "                                            <input class=\"form-check-input\" type=\"checkbox\" id=\"AppendChart\" >";
	        panelHTML += "                                            <label class=\"form-check-label\" for=\"AppendChart\">Append</label>";
	        panelHTML += "                                        </div>";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                    <div class=\"form-group col-md-6 \">";
	        panelHTML += "                                        <div class=\"form-check form-check-inline\">";
	        panelHTML += "                                            <input class=\"form-check-input\" type=\"checkbox\" id=\"LiveUpdate\" value=\"option2\">";
	        panelHTML += "                                            <label class=\"form-check-label\" for=\"LiveUpdate\">Live Update</label>";
	        panelHTML += "                                        </div>";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                </div>";
	        panelHTML += "                                <div class=\"form-row\">";
	        panelHTML += "                                    <div class=\"pull-right SearchConfiguratorButtonsSmall\">";
	        panelHTML += "                                        <button id=\"CancelSearch\" class=\"btn btn-default\" type=\"button\" type=\"submit\" value=\"Submit\">Cancel</button>";
	        panelHTML += "                                        <button id=\"GetDataSubmit\" class=\"btn btn-default\" type=\"button\" type=\"submit\" value=\"Submit\">Get Data</button>";
	        panelHTML += "                                    </div>";
	        panelHTML += "                                </div> ";
	        panelHTML += "                         </form>";
	        panelHTML += "                </div>";
        }
        
        panelHTML += "  <div class=\"row\"><div id=\"SearchGraphArea\"></div></div>";
        panelHTML += "         </div>";
        searchFunctions.loadNewVisualizerData();
        
        return panelHTML;
}



     
    
     
    
     
    
    
    
     getNumberOfSearchObjects(){
    	 return localStorageManager.getNumberOfObjectsByComponent(localStorageSearchKey);
        
    
    }
    
     allSearchStorage() {
    	return localStorageManager.getAllStorageForComponent(localStorageSearchKey);
    }
    
     
    
     
     
}