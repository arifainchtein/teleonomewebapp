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
					
					panelHtml +='	<div class="col-lg-3 col-xs-3 SettingBar">';
					panelHtml +='    	<span id="'+navBarText+'" data-panelpointer="'+navBarPointer+'" class="text-center SettingsSubMenu">'+navBarText+'</span>';
					panelHtml +='    </div> ';
				}
				panelHtml += "</div>";
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

					panelHtml+="<div id=\"" + navBarText +"\" class=\"accordion UpdateParamsGroup hidden\" >";
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
			
						panelHtml += "<div class=\"card\">";
						panelHtml += "  <div class=\"card-header\" id=\"headingOne\">";
						panelHtml += "      <h5 class=\"mb-0\">";
						panelHtml += "          <button class=\"btn btn-link\" type=\"button\" data-toggle=\"collapse\" data-target=\"#"+nameToDisplay + "UpdateFormPanel\" aria-expanded=\"true\" aria-controls=\""+nameToDisplay + "UpdateFormPanel\">";
						panelHtml += "              Update "+nameToDisplay;
						panelHtml += "          </button>";
						panelHtml += "      </h5>";
						panelHtml += "  </div>";

						panelHtml += "<div id=\""+nameToDisplay + "UpdateFormPanel\" class=\"collapse show\" aria-labelledby=\"headingOne\" data-parent=\"#"+navBarText +"\">";
						panelHtml += "  <div class=\"card-body\">";


						//panelHtml += "<div class=\"col-sm-4 SingleForm\">";
						panelHtml += "      <form id=\"" + nameToDisplay + "UpdateForm\">";
						panelHtml += "          <div class=\"panel panel-default\">";
						panelHtml += "              <div class=\"panel-heading\"><h6>Update "+nameToDisplay+"</h6></div>";
						panelHtml += "                  <div class=\"panel-body text-center\">";
						panelHtml += "                      <div class=\"form-group\">";

						if(valueType==="int" || valueType==="double"){
							fieldType="number";

							if(renderedDataSourceDeneWord.hasOwnProperty("Maximum")){
								maxValueText = "max=\""+ renderedDataSourceDeneWord["Maximum"] + "\"";
							}
							if(renderedDataSourceDeneWord.hasOwnProperty("Minimum")){
								minValueText = "min=\""+ renderedDataSourceDeneWord["Minimum"] + "\"";
							}

							panelHtml += "              <label class=\"control-label\"  for=\""+ nameToDisplay +"\" class=\"col-sm-4\" ><h5><span id=\""+ nameToDisplay+"Label\">Current&nbsp;("+ valueData +" " + unitsText +") &nbsp;&nbsp;</span></h5></label>";
							panelHtml += "              <input style=\"font-size:20px;\" class=\"form-control\" type=\""+ fieldType +"\" "+ maxValueText +" "+ minValueText +" id=\""+ nameToDisplay +"\" placeholder=\"\" value=\""+ valueData +"\"  required>";

						}else if(valueType==="boolean" ){

							panelHtml += "              <label  for=\""+ nameToDisplay +"\" class=\"col-sm-4\" ><h5><span id=\""+ nameToDisplay+"Label\">"+ prettyName +"&nbsp;&nbsp;</span></h5></label>";
							panelHtml += "              <div class=\"input-group\">";
							panelHtml += "                  <div id=\""+ nameToDisplay +"\" class=\"btn-group col-sm-4\">";
							panelHtml += "                      <a class=\"btn btn-primary btn-sm active\" id=\""+ nameToDisplay +"_true\" data-toggle=\""+nameToDisplay+"\" data-title=\"Y\">YES</a>";
							panelHtml += "                      <a class=\"btn btn-primary btn-sm notActive\" id=\""+nameToDisplay+"_false\" data-toggle=\""+nameToDisplay+"\" data-title=\"N\">NO</a>";
							panelHtml += "                  </div>";
							panelHtml += "                  <input style=\"font-size:20px;\" type=\"hidden\" name=\""+ nameToDisplay+"\" id=\""+ nameToDisplay +"\">";
							panelHtml += "              </div>"
						}else if(valueType==="String" ){ 
							fieldType="text";
							panelHtml += "<label class=\"control-label col-sm-4\"  for=\""+ nameToDisplay +"\"><h5><span id=\""+ nameToDisplay+"Label\">"+ prettyName +"&nbsp;&nbsp;&nbsp;</span></h5></label>";
							panelHtml += "<input style=\"font-size:20px;\" class=\"form-control\" type=\""+ fieldType +"\" " +" id=\""+ nameToDisplay +"\" placeholder=\"\" value=\""+ valueData +"\"  required>";
						}
						panelHtml += "</div>";
						
						panelHtml += "<div class=\"form-group\"> ";
						panelHtml += "<button type=\"submit\" data-form='{\"field\":\"" + nameToDisplay + "\",\"valueType\":\"" + valueType + "\", \"identity\":\""+panelDataSourcePointer+"\"}'class=\"btn btn-primary col-sm-4 pull-right UpdateParamBtn\">Update</button>";
						panelHtml += "</div>";
						panelHtml += "</div>";
						panelHtml += "</div>";
						panelHtml += "</div>";
						panelHtml += "</form>";
						
						panelHtml += "</div>";//</cardbody
						panelHtml += "</div>"; 
						panelHtml += "</div>";// closing card
						
					}
					panelHtml +='</div>';
			} 
			panelHtml +='</div>';
			}	
		}
		return panelHtml;
	}
}