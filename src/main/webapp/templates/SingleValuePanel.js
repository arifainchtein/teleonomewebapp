class SingleValuePanel{

    constructor(){

    }

    process(completeWidth, title, object ){

        var panelHTML = "";
        if(completeWidth){
            panelHTML = "<div class=\"col-lg-12\">";
        }else{
            panelHTML = "<div class=\"col-lg-6\">";
        }
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading\"><h4>"+title+"</h4></div>";
        panelHTML += "<div class=\"panel-body text-center\">";
        panelHTML += "<div class=\"row\">";

        
        
        var nameToDisplay;
        var renderedDataSourceDeneWord;
        //console.log("about to start going ver the rpoerties, object=" + object);
        var dataDene;
        var panelDataSourcePointer;
        var visible=false;
        var statusMessage="";
        var isExternalData=false;
        var externalDataStatus="";
        var panelDataSourcePointerIdentity;
        for(var property in object) {
            //
            //after every three panels 
            dataDene = object[property];   
            panelDataSourcePointer =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER, DENEWORD_VALUE_ATTRIBUTE)
            panelDataSourcePointerIdentity = identityFactory.createIdentityByPointer(panelDataSourcePointer);
            
            var hasVisible=deneHasDeneWordProperty(dataDene, "Visible");
            //
            // if there is no deneword, then show it
            visible=true;
            if(hasVisible){
                //
                // visible could be false, that way you could hide the value by actuator
                visible=getDeneWordAttributeByDeneWordNameFromDene(dataDene, "Visible", DENEWORD_VALUE_ATTRIBUTE);
            }
            if(visible){
            	statusMessage="";
            	isExternalData=false;
            	externalDataStatus="";
            	if( panelDataSourcePointerIdentity.nucleusName== NUCLEI_PURPOSE && panelDataSourcePointerIdentity.deneChainName==DENECHAIN_EXTERNAL_DATA){
            		isExternalData=true;
	            	var externalDataStatusPointer = "@" +teleonomeName + ":" + panelDataSourcePointerIdentity.nucleusName + ":" +panelDataSourcePointerIdentity.deneChainName + ":" + panelDataSourcePointerIdentity.deneName + ":" +EXTERNAL_DATA_STATUS;
	        		//console.log("externalDataStatusPointer=" + externalDataStatusPointer);
	        		 externalDataStatus = getDeneWordByIdentityPointer(externalDataStatusPointer, DENEWORD_VALUE_ATTRIBUTE);
	        		//console.log("externalDataStatus=" + externalDataStatus);
	
	        		//
	        	    // 2)statusMessage - A string description of the status
	        		var statusMessagePointer = "@" +teleonomeName + ":" + panelDataSourcePointer.nucleusName + ":" +panelDataSourcePointer.deneChainName + ":" + panelDataSourcePointer.deneName + ":" +DENEWORD_STATUS;
	        	//	console.log("statusMessagePointer=" + statusMessagePointer);
	        		 statusMessage = getDeneWordByIdentityPointer(statusMessagePointer, DENEWORD_VALUE_ATTRIBUTE);
	        		
	            }
        		
        		
            	
                nameToDisplay =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME, DENEWORD_VALUE_ATTRIBUTE)
                console.log(" going over the rpoerties,panelDataSourcePointer=" + panelDataSourcePointer);
                renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
                var unitsText=renderedDataSourceDeneWord["Units"];
                if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

                panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm-4 col-xs-4\">";
                panelHTML += "<div class=\"panel panel-default\">";
                if(isExternalData){
                	 panelHTML += " <div class=\"panel-heading row\">"; 
                     panelHTML += "<div class=\"col-lg-9 col-md-9 col-sm-9 col-xs-9\">";
                     panelHTML += "<h6>" + nameToDisplay + "</h6>"; 
                     panelHTML +="</div>";// close col lg-4
                     
                     
                     
                     panelHTML += "<div class=\"col-lg-3 col-md-3 col-sm-3 col-xs-3\">";	
                     //panelHTML +="<h1   class=\"label label-lg label-"+ externalDataStatus +"\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h1>";
                     panelHTML +="<div  class=\"pull-right externalDataStatusBox external-data-"+ externalDataStatus +"\"></div>";
                     panelHTML +="</div>";// close col lg-4
                     panelHTML +="</div>";
                     
                     
                }else{
                	panelHTML += "<div class=\"panel-heading\"><h6>"+nameToDisplay+"</h6></div>";
                }
                
               
                
                var valueData = renderedDataSourceDeneWord["Value"];
                panelHTML += "<div class=\"panel-body text-center\">";
                if(valueData.length>10){
                    panelHTML += "<h4>"+valueData +"</h4>";
                }else{
                    panelHTML += "<h3>"+valueData +"</h3>";
                }

                panelHTML += "</div>";
                panelHTML += "<div class=\"panel-footer\">";
                panelHTML += "<h5>"+ unitsText  +"</h5>";
                panelHTML += "</div>";    
                panelHTML += "</div>";// closing <div class="panel panel-default">
                panelHTML += "</div>";    // closing col-lg-4 col-md-4 col-sm3 col-xs-4
            }// if visible

        }
        return panelHTML;
    }
}