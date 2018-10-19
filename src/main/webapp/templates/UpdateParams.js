class UpdateParams{
	constructor(){
		localStorageManager.removeComponentInfo(LOCAL_STORAGE_CURRENT_VIEW_KEY);
        var currentViewObject ={};
        currentViewObject["SecundaryView"]="UpdateParams";
		localStorageManager.setItem(LOCAL_STORAGE_CURRENT_VIEW_KEY, currentViewObject);
	}


	process(){

		var systemInfoDeneChainPanelJSON = JSON.parse(localStorage.getItem("SystemInfo"));
		var  humanInterfaceDeneChainJSONObject = JSON.parse(localStorage.getItem("HumanInterfaceDeneChainIndex"));
		
		var panelPointers = Object.keys(systemInfoDeneChainPanelJSON);  
		var UpdateParamsNavBarDeneChain="";
		var i2=0, j2=0,k2=0;
		var panelHtml="";
		var prettyNamesList;
		var prettyNamesListObject, panelDeneChain
		var prettyNameListCounter=0;
		var prettyName;
		var panelPositionInPanelHashMap;
		var object;
		var nameToDisplay;
		var renderedDataSourceDene;
		var renderedDataSourceDeneWord;
		//console.log("about to start going ver the rpoerties, object=" + object);
		var dataDene,panelDataSourcePointer;
		var denePanel, navBarPointer, navBarPosition, navBarText;
		var denePanelArray;
		for(var i=0;i<panelPointers.length;i++){
			var panelPointer = panelPointers[i];
			if(panelPointer.includes("Update Parameters")){
				UpdateParamsNavBarDeneChain = systemInfoDeneChainPanelJSON[panelPointer];
				if(UpdateParamsNavBarDeneChain==""){
					return "";
				}
				//
				// the UpdateParamsNavBarDeneChain will contain denes each of
				// which become a link in a nav bar and also represent a grouping
				// of deneword update forms.  Each form in a group is submitted 
				// individually but they are presented together in an accordion
				// Each of th
				denePanelArray = UpdateParamsNavBarDeneChain["Denes"];
				panelHtml +='<div class="row top-buffer">';
				for(i2=0;i2<denePanelArray.length;i2++){
					denePanel = denePanelArray[i2];
					//
					// each dene will have three denewords with special denewordtype
					//
					navBarPointer =  getDeneWordAttributeByDeneWordTypeFromDene(denePanel, DENEWORD_TYPE_NAVBAR_POINTER, DENEWORD_VALUE_ATTRIBUTE);
					navBarPosition =  getDeneWordAttributeByDeneWordTypeFromDene(denePanel, DENEWORD_TYPE_NAVBAR_POSITION, DENEWORD_VALUE_ATTRIBUTE);
					navBarText =  getDeneWordAttributeByDeneWordTypeFromDene(denePanel, DENEWORD_TYPE_NAVBAR_TEXT, DENEWORD_VALUE_ATTRIBUTE);
					
					panelHtml +='	<div class="col-lg-1 col-xs-3 SettingBar">';
					panelHtml +='    	<span id="'+navBarText+'" data-panelpointer="'+navBarPointer+'" class="text-center SettingsSubMenu">'+navBarText+'</span>';
					panelHtml +='    </div> ';
				} 
				panelHtml +='</div>';

				//
				// now run the loop again this time to draw the hidden accordions
				//
				for(i2=0;i2<denePanelArray.length;i2++){
					denePanel = denePanelArray[i2];
					//
					// each dene will have three denewords with special denewordtype
					//
					navBarPointer =  getDeneWordAttributeByDeneWordTypeFromDene(denePanel, DENEWORD_TYPE_NAVBAR_POINTER, DENEWORD_VALUE_ATTRIBUTE);
					navBarPosition =  getDeneWordAttributeByDeneWordTypeFromDene(denePanel, DENEWORD_TYPE_NAVBAR_POSITION, DENEWORD_VALUE_ATTRIBUTE);
					navBarText =  getDeneWordAttributeByDeneWordTypeFromDene(denePanel, DENEWORD_TYPE_NAVBAR_TEXT, DENEWORD_VALUE_ATTRIBUTE);
					
					panelDeneChain = getDeneChainByIdentityPointer( navBarPointer);
					prettyNamesList = getFormPrettyNameOrdered(panelDeneChain);
					prettyNamesListObject = prettyNamesList["_map"];
				 	panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
					object = panelPositionInPanelHashMap["_map"];

					panelHTML+="<div id=\"" + navBarText +"\" class=\"accordion UpdateParamsGroup hidden\" >";
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
			
						panelHTML += "<div class=\"card\">";
						panelHTML += "  <div class=\"card-header\" id=\"headingOne\">";
						panelHTML += "      <h5 class=\"mb-0\">";
						panelHTML += "          <button class=\"btn btn-link\" type=\"button\" data-toggle=\"collapse\" data-target=\"#"+nameToDisplay + "UpdateFormPanel\" aria-expanded=\"true\" aria-controls=\""+nameToDisplay + "UpdateFormPanel\">";
						panelHTML += "              Update "+nameToDisplay;
						panelHTML += "          </button>";
						panelHTML += "      </h5>";
						panelHTML += "  </div>";

						panelHTML += "<div id=\""+nameToDisplay + "UpdateFormPanel\" class=\"collapse show\" aria-labelledby=\"headingOne\" data-parent=\"#"+navBarText +"\">";
						panelHTML += "  <div class=\"card-body\">";


						//panelHTML += "<div class=\"col-sm-4 SingleForm\">";
						panelHTML += "      <form id=\"" + nameToDisplay + "UpdateForm\">";
						panelHTML += "          <div class=\"panel panel-default\">";
						panelHTML += "              <div class=\"panel-heading\"><h6>Update "+nameToDisplay+"</h6></div>";
						panelHTML += "                  <div class=\"panel-body text-center\">";
						panelHTML += "                      <div class=\"form-group\">";

						if(valueType==="int" || valueType==="double"){
							fieldType="number";

							if(renderedDataSourceDeneWord.hasOwnProperty("Maximum")){
								maxValueText = "max=\""+ renderedDataSourceDeneWord["Maximum"] + "\"";
							}
							if(renderedDataSourceDeneWord.hasOwnProperty("Minimum")){
								minValueText = "min=\""+ renderedDataSourceDeneWord["Minimum"] + "\"";
							}

							panelHTML += "              <label class=\"control-label\"  for=\""+ nameToDisplay +"\" class=\"col-sm-4\" ><h5><span id=\""+ nameToDisplay+"Label\">Current&nbsp;("+ valueData +" " + unitsText +") &nbsp;&nbsp;</span></h5></label>";
							panelHTML += "              <input style=\"font-size:20px;\" class=\"form-control\" type=\""+ fieldType +"\" "+ maxValueText +" "+ minValueText +" id=\""+ nameToDisplay +"\" placeholder=\"\" value=\""+ valueData +"\"  required>";

						}else if(valueType==="boolean" ){

							panelHTML += "              <label  for=\""+ nameToDisplay +"\" class=\"col-sm-4\" ><h5><span id=\""+ nameToDisplay+"Label\">"+ prettyName +"&nbsp;&nbsp;</span></h5></label>";
							panelHTML += "              <div class=\"input-group\">";
							panelHTML += "                  <div id=\""+ nameToDisplay +"\" class=\"btn-group col-sm-4\">";
							panelHTML += "                      <a class=\"btn btn-primary btn-sm active\" id=\""+ nameToDisplay +"_true\" data-toggle=\""+nameToDisplay+"\" data-title=\"Y\">YES</a>";
							panelHTML += "                      <a class=\"btn btn-primary btn-sm notActive\" id=\""+nameToDisplay+"_false\" data-toggle=\""+nameToDisplay+"\" data-title=\"N\">NO</a>";
							panelHTML += "                  </div>";
							panelHTML += "                  <input style=\"font-size:20px;\" type=\"hidden\" name=\""+ nameToDisplay+"\" id=\""+ nameToDisplay +"\">";
							panelHTML += "              </div>"
						}else if(valueType==="String" ){ 
							fieldType="text";
							panelHTML += "<label class=\"control-label col-sm-4\"  for=\""+ nameToDisplay +"\"><h5><span id=\""+ nameToDisplay+"Label\">"+ prettyName +"&nbsp;&nbsp;&nbsp;</span></h5></label>";
							panelHTML += "<input style=\"font-size:20px;\" class=\"form-control\" type=\""+ fieldType +"\" " +" id=\""+ nameToDisplay +"\" placeholder=\"\" value=\""+ valueData +"\"  required>";
						}
						panelHTML += "</div>";
						
						panelHTML += "<div class=\"form-group\"> ";
						panelHTML += "<button type=\"submit\" data-form='{\"field\":\"" + nameToDisplay + "\",\"valueType\":\"" + valueType + "\", \"identity\":\""+panelDataSourcePointer+"\"}'class=\"btn btn-primary col-sm-4 pull-right UpdateParamBtn\">Update</button>";
						panelHTML += "</div>";
						panelHTML += "</div>";
						panelHTML += "</div>";
						panelHTML += "</div>";
						panelHTML += "</form>";
						
						panelHTML += "</div>";//</cardbody
						panelHTML += "</div>"; 
						panelHTML += "</div>";// closing card
						
					}
					panelHTML += "</div>";
				} 
			}	
		}
		return panelHTML;
	}
}