class SynchronousDiagnostics{
	
	constructor(){

    }

    

    process(){
        var commandsInfo;

        var panelHTML = "<div class=\"col-lg-12\">";
        panelHTML += "      <div class=\"bs-component\">";
        panelHTML += "          <div class=\"panel panel-default\">";
        panelHTML += "              <div class=\"panel-heading\"><h4>Synchronous Cycle</h4></div>";
        panelHTML += "              <div class=\"panel-body text-center\">";

        var systemInfoDeneChainPanelJSONU = localStorage.getItem("DiagnosticInfo");
        var systemInfoDeneChainPanelJSON = JSON.parse(systemInfoDeneChainPanelJSONU);
        var pointer = "@" +teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":" +"Synchronous Cycle Panel";   
        var synchronousPanelDeneChain = systemInfoDeneChainPanelJSON[pointer];
        var denePanel;
        var deneWords;
        var panelInPagePosition=-1;
		var panelDeneChainPointer="";
		var	panelVisualStyle="";
		var	panelExternalDataSourcePointer="";
		var	panelExternalTimestampDataSourcePointer="";
		var	panelVisible=false;
        var denePanelArray = synchronousPanelDeneChain["Denes"];

        var panelPositionInPageHashMap = new HashMap();
		var panelVisibleHashMap = new HashMap();
        //
        // get the SynchronousCycle DeneCHain
        //
        for(var i2=0;i2<denePanelArray.length;i2++){
			denePanel = denePanelArray[i2];
            deneWords = denePanel["DeneWords"];
			panelInPagePosition=-1;
			panelDeneChainPointer="";
			panelVisualStyle="";
			panelExternalDataSourcePointer="";
			panelExternalTimestampDataSourcePointer="";
			panelVisible=false;
			for(j2=0;j2<deneWords.length;j2++){
				deneWord = deneWords[j2];
				//
                // get the position and the type
                
				if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_IN_PAGE_POSITION){
					panelInPagePosition = deneWord["Value"];
				}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_DENECHAIN_POINTER){
					panelDeneChainPointer = deneWord["Value"];
				}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_EXTERNAL_DATA_SOURCE_DENE){
					panelExternalDataSourcePointer = deneWord["Value"];
				}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_EXTERNAL_TIMESTAMP_DATA_SOURCE_DENE){
					panelExternalTimestampDataSourcePointer = deneWord["Value"];
				}else if(deneWord.Name===DENEWORD_VISIBLE){
					panelVisible = deneWord["Value"];
					panelVisibleHashMap.put(panelDeneChainPointer,panelVisible);
				}
			}
			//
			// if the values were found store them in a hashmap
            //
            
            if( panelVisualStyle!="" &&  
                panelDeneChainPointer!="" &&
                panelVisualStyle===PANEL_VISUALIZATION_STYLE_ACTION_EVALUATION_REPORT
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
		var obj5 = panelVisibleHashMap["_map"];
		//
		// after every two panels put a new row
		// open the first one
		//
		panelHTML += "<div class=\"row top-buffer\">";
		var panelCounter=0;
		var inSearch=false;
		for(var property in obj) {
			deneChainPointer= obj[property];
			panelVisible = obj5[deneChainPointer];
			if(!panelVisible)continue;
			panelDeneChain = humanInterfaceDeneChainIndex["_map"][deneChainPointer];
            denes = panelDeneChain["Denes"];	
            var sourceDataPointer = denes[0].DeneWords[0].Value;
            var anActionEvaluationReport = new ActionEvaluationReport();
            panelHTML += anActionEvaluationReport.process(sourceDataPointer);
        }

        panelHTML += "              </div>";    // closing <div class=\"panel-body text-center\"
		panelHTML += "          </div>";    // closing <div class=\"panel panel-default\"
        panelHTML += "      </div>";    // closing <div class=\"bs-component\"


        localStorageManager.removeComponentInfo(LOCAL_STORAGE_CURRENT_VIEW_KEY);
        var currentViewObject ={};
        currentViewObject["SecundaryView"]="SynchronousDiagnostics";
        localStorageManager.setItem(LOCAL_STORAGE_CURRENT_VIEW_KEY, currentViewObject);      

        return panelHTML;
    }

    
    
}