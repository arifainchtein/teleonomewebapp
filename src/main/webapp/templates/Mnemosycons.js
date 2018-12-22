class Mnemosycons{

	constructor(){

	}

	process(){
		 var commandsInfo;

	        var panelHTML = "<div class=\"col-lg-12\">";
	        panelHTML += "      <div class=\"bs-component\">";
	        panelHTML += "          <div class=\"panel panel-default\">";
	        panelHTML += "              <div class=\"panel-heading\"><h4>Mnemosycons</h4></div>";
	        panelHTML += "              <div class=\"panel-body text-center\">";

	        var diagnosticInfoDeneChainPanelJSONU = localStorage.getItem("DiagnosticInfo");
	        var diagnosticInfoDeneChainPanelJSON = JSON.parse(diagnosticInfoDeneChainPanelJSONU);
	        var pointer = "@" +teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":" +"Mnemosycons Panel";   
	        var mnemosyconsPanelDeneChain = diagnosticInfoDeneChainPanelJSON[pointer];
	        //
	        // check that the data has already being initialized, if not, return empty
	        //
	        if(mnemosyconsPanelDeneChain == undefined)return "";
	        var denePanel;
	        var deneWords;
	        var panelInPagePosition=-1;
			var panelDeneChainPointer="";
			var	panelVisualStyle="";
			var	panelVisible=false;
	        var denePanelArray = mnemosyconsPanelDeneChain["Denes"];

	        var panelPositionInPageHashMap = new HashMap();
	        var panelVisibleHashMap = new HashMap();
	        var deneWord;
	        //
	        // get the SynchronousCycle DeneCHain
	        //
	        for(var i2=0;i2<denePanelArray.length;i2++){
				denePanel = denePanelArray[i2];
	            deneWords = denePanel["DeneWords"];
				panelInPagePosition=-1;
				panelDeneChainPointer="";
				panelVisualStyle="";

				panelVisible=false;
				for(var j2=0;j2<deneWords.length;j2++){
					deneWord = deneWords[j2];
					//
	                // get the position and the type
	                panelVisible=false;
					if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_IN_PAGE_POSITION){
						panelInPagePosition = deneWord["Value"];
					}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_DENECHAIN_POINTER){
						panelDeneChainPointer = deneWord["Value"];
					}else if(deneWord.Name===DENEWORD_VISIBLE){
						panelVisible = deneWord["Value"];
					}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_VISUALIZATION_STYLE){
						panelVisualStyle = deneWord["Value"];
					}
				}
				//
				// if the values were found store them in a hashmap
	            //
	            
	            if( panelVisualStyle!="" &&  
	                panelDeneChainPointer!="" &&
	                panelVisible &&
	                panelVisualStyle=== PANEL_VISUALIZATION_STYLE_MNEMOSYCON_EVALUATION_REPORT
	        	
	            ){

	                if(panelInPagePosition!=-1 &&  panelDeneChainPointer!=""){
	                    panelPositionInPageHashMap.put(panelInPagePosition,panelDeneChainPointer);
	                }
	            }
	        }

	        var sorted= sortHashMap(panelPositionInPageHashMap);
			panelHTML ="";
			
			var numberOfPanelsPerRow=2;
			var obj =  sorted["_map"];
			
			//
			// after every two panels put a new row
			// open the first one
			//
			
			var panelCounter=0;
	        var inSearch=false;
	        var deneChainPointer;
	        var panelDeneChain;
	        var denes;

			for(var property in obj) {
				deneChainPointer= obj[property];
				//
				// deneChainPointer will contain the address in the mnemosyne where the mnemosycon evaluation is stored 
				// ie @Sento:Mnemosyne:Mnemosyne Current Week:Static Mnemosycon Processing
				//
	            panelHTML += "<div class=\"row top-buffer\">";
	            
	            panelHTML += renderMnemosycons(deneChainPointer);
	            
	            
	            panelHTML += "</div>" // closing row;
	        }

	        panelHTML += "              </div>";    // closing <div class=\"panel-body text-center\"
			panelHTML += "          </div>";    // closing <div class=\"panel panel-default\"
	        panelHTML += "      </div>";    // closing <div class=\"bs-component\"

	        //
	        // the dialog for the rules
	        //
	        panelHTML += "                <div class=\"modal fade bannerformmodal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"bannerformmodal\" aria-hidden=\"true\" id=\"bannerformmodal\">";
	        panelHTML += "				    <div class=\"modal-dialog modal-xl\">";
	        panelHTML += "				        <div class=\"modal-content\">";
	        panelHTML += "				            <div class=\"modal-content\">";
	        panelHTML += "				                <div class=\"modal-header \">";
	        panelHTML += "				                    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" id=\"dismissbannerformmodal\">&times;</button>";
	        panelHTML += "                                    <h4 class=\"modal-title text-center\" id=\"DisplayPulseTitle\"></h4>";
	        panelHTML += "                                    <button type=\"button\"   onclick=\"CopyToClipboard('DisplayPulseData')\" id=\"CopyPulseData\">Copy</button>  ";                                  
	        panelHTML += "				                </div>";
	        panelHTML += "				                <div id=\"DisplayPulseData\" class=\"modal-body\"></div>";
	        panelHTML += "				                <div class=\"modal-footer\"></div>  ";   
	        panelHTML += "				            </div>";
	        panelHTML += "				        </div>";
	        panelHTML += "				    </div>";
	        panelHTML += "                </div>";
	        
	        

	        localStorageManager.removeComponentInfo(LOCAL_STORAGE_CURRENT_VIEW_KEY);
	        var currentViewObject ={};
	        currentViewObject["SecundaryView"]="MnemosyconsDiagnostics";
	        localStorageManager.setItem(LOCAL_STORAGE_CURRENT_VIEW_KEY, currentViewObject);      

	        return panelHTML;
	}
}