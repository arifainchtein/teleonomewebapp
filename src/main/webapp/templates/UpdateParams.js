class UpdateParams{
    constructor(){
        
    }

    
    process(panelDeneChain){
        
        var html='';

        // panelHTML += "<div class=\"col-lg-12 col-xs-12\">";
        // panelHTML += "<div class=\"bs-component\">";
        // panelHTML += "<div class=\"panel panel-default\">";
        // panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
        // panelHTML += "<div class=\"panel-body\">";
        
        
        var prettyNamesList = getFormPrettyNameOrdered(panelDeneChain);
        var prettyNamesListObject = prettyNamesList["_map"];
        var prettyNameListCounter=0;
        var prettyName;
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
            
            //panelDataSourcePointer = object[property];    
            //console.log(" going over the rpoerties,panelDataSourcePointer=" + panelDataSourcePointer);
            
            prettyName = prettyNamesList[prettyNameListCounter];
            prettyNameListCounter++;
            
            renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
            nameToDisplay = renderedDataSourceDeneWord["Name"];
            
            var unitsText=renderedDataSourceDeneWord["Units"];
            var valueData = renderedDataSourceDeneWord["Value"];
            var valueType = renderedDataSourceDeneWord["Value Type"];
            var fieldType	="";
            var minValueText="";
            var maxValueText="";
            panelHTML += "<form class=\"form-inline\" id=\"" + nameToDisplay + "UpdateForm\">";
            panelHTML += "<div class=\"form-group\">";
        
            if(valueType==="int" || valueType==="double"){
                fieldType="number";
                
                if(renderedDataSourceDeneWord.hasOwnProperty("Maximum")){
                    maxValueText = "max=\""+ renderedDataSourceDeneWord["Maximum"] + "\"";
                }
                if(renderedDataSourceDeneWord.hasOwnProperty("Minimum")){
                    minValueText = "min=\""+ renderedDataSourceDeneWord["Minimum"] + "\"";
                }
                
                panelHTML += "<label class=\"control-label\"  for=\""+ nameToDisplay +"\"><h5><span id=\""+ nameToDisplay+"Label\">"+ prettyName +"&nbsp;("+ valueData +" " + unitsText +") &nbsp;&nbsp;</span></h5></label>";
                panelHTML += "<input style=\"font-size:20px;\" class=\"form-control\" type=\""+ fieldType +"\" "+ maxValueText +" "+ minValueText +" id=\""+ nameToDisplay +"\" placeholder=\"\" value=\""+ valueData +"\"  required>";
                
            }else if(valueType==="boolean" ){
                
                panelHTML += "<label  for=\""+ nameToDisplay +"\"><h5><span id=\""+ nameToDisplay+"Label\">"+ prettyName +"&nbsp;&nbsp;</span></h5></label>";
                panelHTML += "<div class=\"input-group\">";
                panelHTML += "<div id=\""+ nameToDisplay +"\" class=\"btn-group\">";
                panelHTML += "<a class=\"btn btn-primary btn-sm active\" id=\""+ nameToDisplay +"_true\" data-toggle=\""+nameToDisplay+"\" data-title=\"Y\">YES</a>";
                panelHTML += "<a class=\"btn btn-primary btn-sm notActive\" id=\""+nameToDisplay+"_false\" data-toggle=\""+nameToDisplay+"\" data-title=\"N\">NO</a>";
                panelHTML += "</div>";
                panelHTML += "<input style=\"font-size:20px;\" type=\"hidden\" name=\""+ nameToDisplay+"\" id=\""+ nameToDisplay +"\">";
                panelHTML += "</div>"
            }
            
        panelHTML += "</div>";
            panelHTML += "<div class=\"form-group\"> ";
            panelHTML += "<button type=\"submit\" data-form='{\"field\":\"" + nameToDisplay + "\", \"identity\":\""+panelDataSourcePointer+"\"}'class=\"btn btn-primary col-sm-offset-5\">Submit</button>";
            panelHTML += "</div>";		
            panelHTML += "</form>";	

            
        }
        return html;
    }
}