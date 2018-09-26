class UpdateParams{
	constructor(){
		secundaryView="UpdateParams";
	}


	process(panelDeneChainPointer){

		var systemInfoDeneChainPanelJSON = JSON.parse(localStorage.getItem("SystemInfo"));

		var panelPointers = Object.keys(systemInfoDeneChainPanelJSON);  
		var panelDeneChain="";
		for(var i=0;i<panelPointers.length;i++){
			var panelPointer = panelPointers[i];
			if(panelPointer.includes("Update Parameters")){
				panelDeneChain = systemInfoDeneChainPanelJSON[panelPointer];
			} 
		}
		if(panelDeneChain==""){
			return "";
		}

		var panelHTML="<div class=\"UpdateParamsGroup\" >";

		var prettyNamesList = getFormPrettyNameOrdered(panelDeneChain);
		var prettyNamesListObject = prettyNamesList["_map"];
		var prettyNameListCounter=0;
		var prettyName;
		var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
		var object = panelPositionInPanelHashMap["_map"];
		var nameToDisplay;
		var renderedDataSourceDene;
		var renderedDataSourceDeneWord;
		//console.log("about to start going ver the rpoerties, object=" + object);
		var dataDene,panelDataSourcePointer;

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

			var unitsText="";
			if(renderedDataSourceDeneWord["Units"]!= undefined){
				unitsText=renderedDataSourceDeneWord["Units"];
			}
			var valueData = renderedDataSourceDeneWord["Value"];
			var valueType = renderedDataSourceDeneWord["Value Type"];
			var fieldType	="";
			var minValueText="";
			var maxValueText="";
			//panelHTML += "<form class=\"form-inline\" id=\"" + nameToDisplay + "UpdateForm\">";
			panelHTML += "<div class=\"col-sm-4 SingleForm\">";
			panelHTML += "<form id=\"" + nameToDisplay + "UpdateForm\">";
			panelHTML += "<div class=\"panel panel-default\">";
			panelHTML += "<div class=\"panel-heading\"><h6>Update "+nameToDisplay+"</h6></div>";
			panelHTML += "<div class=\"panel-body text-center\">";
			
			panelHTML += "<div class=\"form-group\">";

			if(valueType==="int" || valueType==="double"){
				fieldType="number";

				if(renderedDataSourceDeneWord.hasOwnProperty("Maximum")){
					maxValueText = "max=\""+ renderedDataSourceDeneWord["Maximum"] + "\"";
				}
				if(renderedDataSourceDeneWord.hasOwnProperty("Minimum")){
					minValueText = "min=\""+ renderedDataSourceDeneWord["Minimum"] + "\"";
				}

				panelHTML += "<label class=\"control-label\"  for=\""+ nameToDisplay +"\" class=\"col-sm-4\" ><h5><span id=\""+ nameToDisplay+"Label\">Current&nbsp;("+ valueData +" " + unitsText +") &nbsp;&nbsp;</span></h5></label>";
				panelHTML += "<input style=\"font-size:20px;\" class=\"form-control\" type=\""+ fieldType +"\" "+ maxValueText +" "+ minValueText +" id=\""+ nameToDisplay +"\" placeholder=\"\" value=\""+ valueData +"\"  required>";

			}else if(valueType==="boolean" ){

				panelHTML += "<label  for=\""+ nameToDisplay +"\" class=\"col-sm-4\" ><h5><span id=\""+ nameToDisplay+"Label\">"+ prettyName +"&nbsp;&nbsp;</span></h5></label>";
				panelHTML += "<div class=\"input-group\">";
				panelHTML += "<div id=\""+ nameToDisplay +"\" class=\"btn-group col-sm-4\">";
				panelHTML += "<a class=\"btn btn-primary btn-sm active\" id=\""+ nameToDisplay +"_true\" data-toggle=\""+nameToDisplay+"\" data-title=\"Y\">YES</a>";
				panelHTML += "<a class=\"btn btn-primary btn-sm notActive\" id=\""+nameToDisplay+"_false\" data-toggle=\""+nameToDisplay+"\" data-title=\"N\">NO</a>";
				panelHTML += "</div>";
				panelHTML += "<input style=\"font-size:20px;\" type=\"hidden\" name=\""+ nameToDisplay+"\" id=\""+ nameToDisplay +"\">";
				panelHTML += "</div>"
			}else if(valueType==="String" ){ 
				fieldType="text";
				panelHTML += "<label class=\"control-label col-sm-4\"  for=\""+ nameToDisplay +"\"><h5><span id=\""+ nameToDisplay+"Label\">"+ prettyName +"&nbsp;&nbsp;&nbsp;</span></h5></label>";
				panelHTML += "<input style=\"font-size:20px;\" class=\"form-control\" type=\""+ fieldType +"\" " +" id=\""+ nameToDisplay +"\" placeholder=\"\" value=\""+ valueData +"\"  required>";
			}
			panelHTML += "</div>";
			panelHTML += "<div class=\"form-group\"> ";
			panelHTML += "<button type=\"submit\" data-form='{\"field\":\"" + nameToDisplay + "\", \"identity\":\""+panelDataSourcePointer+"\"}'class=\"btn btn-primary col-sm-4 pull-right UpdateParamBtn\">Update</button>";
			panelHTML += "</div>";
			panelHTML += "</div>";
			panelHTML += "</div>";
			panelHTML += "</div>";
			panelHTML += "</form>";
			panelHTML += "</div>";	
		}
		panelHTML += "</div>";	
		return panelHTML;
	}
}