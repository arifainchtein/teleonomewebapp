class SingleValuePanel{

    constructor(){

    }

    process(completeWidth, title ){

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

                nameToDisplay =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME, DENEWORD_VALUE_ATTRIBUTE)
                console.log(" going over the rpoerties,panelDataSourcePointer=" + panelDataSourcePointer);
                renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
                var unitsText=renderedDataSourceDeneWord["Units"];
                if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

                panelHTML += "<div class=\"col-lg-2 col-md-2 col-sm-4 col-xs-4\">";
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
            }// if visible

        }
    }
}