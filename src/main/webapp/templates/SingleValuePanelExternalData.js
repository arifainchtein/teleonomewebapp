class SingleValuePanelExternalData{
    constructor(){

    }

    process(completeWidth){
        

        var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(panelExternalDataSourcePointer);

        var externalDataStatusPointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +EXTERNAL_DATA_STATUS;
        //console.log("externalDataStatusPointer=" + externalDataStatusPointer);
        var externalDataStatus = getDeneWordByIdentityPointer(externalDataStatusPointer, DENEWORD_VALUE_ATTRIBUTE);
    //	console.log("externalDataStatus=" + externalDataStatus);

        //
        // 2)statusMessage - A string description of the status
        var statusMessagePointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +DENEWORD_STATUS;
        //console.log("statusMessagePointer=" + statusMessagePointer);
        var statusMessage = getDeneWordByIdentityPointer(statusMessagePointer, DENEWORD_VALUE_ATTRIBUTE);
        //console.log("statusMessage=" + statusMessage);
        
        var panelHTML = "";
        if(cmpleteWidth){
            panelHTML+= "<div class=\"col-lg-12\">";
        }else{
            panelHTML+= "<div class=\"col-lg-6\">";
        }
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading row\">";
        
        panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm-4 col-xs-4\">";
        panelHTML += "<h4>" + panelDeneChain["Name"] + "</h4>"; 
        panelHTML +="</div>";// close col lg-4
        
        panelHTML += "<div class=\"col-lg-5 col-md-5 col-sm-5 col-xs-5\">";
        panelHTML += "<h4>" + statusMessage+ "</h4>"; 
        panelHTML +="</div>";// close col lg-4
        
        panelHTML += "<div class=\"col-lg-3 col-md-3 col-sm-3 col-xs-3\">";	
        panelHTML +="<h3   class=\"label label-lg label-"+ externalDataStatus +"\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</h3>";
        panelHTML +="</div>";// close col lg-4
        panelHTML +="</div>";
        
        panelHTML += "<div class=\"panel-body text-center\">";
        panelHTML += "<div class=\"row\">";

        
        
        var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
        var object = panelPositionInPanelHashMap["_map"];
        var nameToDisplay;
        var renderedDataSourceDene;
        //console.log("about to start going ver the rpoerties, object=" + object);
        
        
        for(var property in object) {
            //
            //after every three panels 
            dataDene = object[property];   
            panelDataSourcePointer =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER, DENEWORD_VALUE_ATTRIBUTE)
            nameToDisplay =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME, DENEWORD_VALUE_ATTRIBUTE)
            //console.log(" going over the rpoerties,panelDataSourcePointer=" + panelDataSourcePointer);
            renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
            if(nameToDisplay.startsWith("@")){
                //
                // this is a pointer, so render it
                nameToDisplay = getDeneWordByIdentityPointer(nameToDisplay, DENEWORD_VALUE_ATTRIBUTE);
            }
            
            var unitsText=renderedDataSourceDeneWord["Units"];
            if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

            panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm-4 col-xs-4\">";
            panelHTML += "<div class=\"panel panel-default\">";
            panelHTML += "<div class=\"panel-heading\"><h6>"+nameToDisplay+"</h6></div>";
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
        }
        panelHTML += "</div>";    // closing row
        return panelHTML;
    }
}