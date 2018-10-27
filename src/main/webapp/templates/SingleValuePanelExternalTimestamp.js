class SingleValuePanelExternalTimestamp{
    constructor(){

    }

    process( title, panelExternalTimestampDataSourcePointer){
        var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(panelExternalTimestampDataSourcePointer);
        //
        // 2)statusMessage - A string description of the status
        var dataTimestampPointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +DENEWORD_RECORD_TIMESTAMP;
        //console.log("statusMessagePointer=" + statusMessagePointer);
        var dataTimestamp = getDeneWordByIdentityPointer(dataTimestampPointer, DENEWORD_VALUE_ATTRIBUTE);
        //console.log("statusMessage=" + statusMessage);
        
        var panelHTML = "<div class=\"col-lg-6\">";
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading row\">";
        
        panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm-4 col-xs-4\">";
        panelHTML += "<h4>" + title + "</h4>"; 
        panelHTML +="</div>";// close col lg-4
        
        panelHTML += "<div class=\"col-lg-8 col-md-8 col-sm-8 col-xs-8\">";
        panelHTML += "<h4>" + dataTimestamp+ "</h4>"; 
        panelHTML +="</div>";// close col lg-4
        panelHTML +="</div>"
        
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
            
            //
            // dont render the timestamp again
            //
            if(dataTimestampPointer!=panelDataSourcePointer){
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
        }
        panelHTML += "</div>";    // closing row
        return panelHTML;
    }
}