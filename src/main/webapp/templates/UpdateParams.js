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
		var nameToDisplayNoSpaces;
		var navBarTextNoSpaces;
		var renderedDataSourceDene;
		var renderedDataSourceDeneWord;
		//console.log("about to start going ver the rpoerties, object=" + object);
		var dataDene,panelDataSourcePointer;
		var denePanel, navBarPointer, navBarPosition, navBarText;
		var denePanelArray;
		var restartRequired=false;
		var restartRequiredText="";
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
					panelHtml +='    	<button class="btn btn-primary SettingsSubMenu"  data-panelpointer="'+navBarTextNoSpaces+'FormGroup" type="button" aria-expanded="false" aria-controls="'+navBarText+'">'+navBarText+'</button>';
					panelHtml +='    </div> ';
				}
				panelHtml += "</div>    <hr /> ";
				for(i2=0;i2<denePanelArray.length;i2++){
					denePanel = denePanelArray[i2];
					//
					// each dene will have three denewords with special denewordtype
					//
					navBarPointer =  getDeneWordAttributeByDeneWordTypeFromDene(denePanel, DENEWORD_TYPE_NAVBAR_POINTER, DENEWORD_VALUE_ATTRIBUTE);
					navBarPosition =  getDeneWordAttributeByDeneWordTypeFromDene(denePanel, DENEWORD_TYPE_NAVBAR_POSITION, DENEWORD_VALUE_ATTRIBUTE);
					navBarText =  getDeneWordAttributeByDeneWordTypeFromDene(denePanel, DENEWORD_TYPE_NAVBAR_TEXT, DENEWORD_VALUE_ATTRIBUTE);
					navBarTextNoSpaces = navBarText.replace(/ /g,'');

					panelDeneChain = getDeneChainByIdentityPointer( navBarPointer);
					prettyNamesList = getFormPrettyNameOrdered(panelDeneChain);
					prettyNamesListObject = prettyNamesList["_map"];
					panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
					object = panelPositionInPanelHashMap["_map"];
					
					panelHtml+="<div id=\"" + navBarTextNoSpaces +"FormGroup\" class=\"hidden UpdateParamsGroup\" >";navBarText
					panelHtml+="	<div id=\"" + navBarTextNoSpaces +"Well\" class=\"well\" ><h4>Updating " +navBarText + "</h4><br><h5> <span class=\"text-danger\">Update to DeneWords in Red will require a manual restart</span></div>";
					panelHtml+="	<div id=\"" + navBarTextNoSpaces +"\" class=\"accordion\" >";
					for(var property in object) {
						//
						//after every three panels 
						dataDene = object[property];   
						panelDataSourcePointer =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER, DENEWORD_VALUE_ATTRIBUTE)
						nameToDisplay =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_PANEL_DATA_DISPLAY_NAME, DENEWORD_VALUE_ATTRIBUTE)
						restartRequired =  getDeneWordAttributeByDeneWordTypeFromDene(dataDene, DENEWORD_TYPE_RESTART_NEEDED, DENEWORD_VALUE_ATTRIBUTE)
						restartRequiredText="";
						if(restartRequired){
							restartRequiredText='btn-danger';
						}
						//panelDataSourcePointer = object[property];    
						//console.log(" going over the rpoerties,panelDataSourcePointer=" + panelDataSourcePointer);

						prettyName = prettyNamesList[prettyNameListCounter];
						prettyNameListCounter++;

						renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);
						nameToDisplay = renderedDataSourceDeneWord["Name"];
						nameToDisplayNoSpaces = nameToDisplay.replace(/ /g,'');
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
						panelHtml += "  <div class=\"card-header\" id=\""+nameToDisplayNoSpaces+"Card\">";
						panelHtml += "      <h5 class=\"mb-0\">";
						panelHtml += "          <button class=\"btn "+ restartRequiredText +"\" type=\"button\" data-toggle=\"collapse\" data-target=\"#"+nameToDisplayNoSpaces + "UpdateFormPanel\" style=\"margin-bottom:30px;\" aria-expanded=\"true\" aria-controls=\""+nameToDisplayNoSpaces + "UpdateFormPanel\">";
						panelHtml += "              Update "+nameToDisplay;
						panelHtml += "          </button>";
						panelHtml += "      </h5>";
						panelHtml += "  </div>";

						panelHtml += "<div id=\""+nameToDisplayNoSpaces + "UpdateFormPanel\" class=\"UpdateParamsList collapse\" aria-labelledby=\""+nameToDisplayNoSpaces+"Card\" data-parent=\"#"+navBarText +"\">";
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

							panelHtml += "              <label class=\"control-label\"  for=\""+ nameToDisplayNoSpaces +"\" class=\"col-sm-4\" ><h5><span id=\""+ nameToDisplayNoSpaces+"Label\">Current&nbsp;("+ valueData +" " + unitsText +") &nbsp;&nbsp;</span></h5></label>";
							panelHtml += "              <input style=\"font-size:20px;\" class=\"form-control\" type=\""+ fieldType +"\" "+ maxValueText +" "+ minValueText +" id=\""+ nameToDisplayNoSpaces +"\" placeholder=\"\" value=\""+ valueData +"\"  required>";

						}else if(valueType==="boolean" ){

							panelHtml += "              <label  for=\""+ nameToDisplayNoSpaces +"\" class=\"col-sm-4\" ><h5><span id=\""+ nameToDisplayNoSpaces+"Label\">"+ prettyName +"&nbsp;&nbsp;</span></h5></label>";
							panelHtml += "              <div class=\"input-group\">";
							panelHtml += "                  <div id=\""+ nameToDisplayNoSpaces +"\" class=\"btn-group col-sm-4\">";
							panelHtml += "                      <a class=\"btn btn-primary btn-sm active\" id=\""+ nameToDisplayNoSpaces +"_true\" data-toggle=\""+nameToDisplayNoSpaces+"\" data-title=\"Y\">YES</a>";
							panelHtml += "                      <a class=\"btn btn-primary btn-sm notActive\" id=\""+nameToDisplayNoSpaces+"_false\" data-toggle=\""+nameToDisplayNoSpaces+"\" data-title=\"N\">NO</a>";
							panelHtml += "                  </div>";
							panelHtml += "                  <input style=\"font-size:20px;\" type=\"hidden\" name=\""+ nameToDisplayNoSpaces+"\" id=\""+ nameToDisplayNoSpaces +"\">";
							panelHtml += "              </div>"
						}else if(valueType==="String" ){ 
							fieldType="text";
							panelHtml += "<label class=\"control-label col-sm-4\"  for=\""+ nameToDisplayNoSpaces +"\"><h5><span id=\""+ nameToDisplayNoSpaces+"Label\">"+ prettyName +"&nbsp;&nbsp;&nbsp;</span></h5></label>";
							panelHtml += "<input style=\"font-size:20px;\" class=\"form-control\" type=\""+ fieldType +"\" " +" id=\""+ nameToDisplayNoSpaces +"\" placeholder=\"\" value=\""+ valueData +"\"  required>";
						}
						panelHtml += "</div>";
						
						panelHtml += "<div class=\"form-group\"> ";
						panelHtml += "<button type=\"submit\" data-form='{\"field\":\"" + nameToDisplayNoSpaces + "\",\"valueType\":\"" + valueType +   "\",\"restartRequired\":\"" + restartRequired +  "\", \"identity\":\""+panelDataSourcePointer+"\"}'class=\"btn btn-primary col-sm-4 pull-right UpdateParamBtn\">Update</button>";
						panelHtml += "</div>";

						panelHtml += "</div>"; //panel-body text-center
						panelHtml += "</div>"; //panel panel-default
						//panelHtml += "</div>";
						panelHtml += "</form>";
						
						panelHtml += "</div>";//</cardbody
						panelHtml += "</div>"; 
						panelHtml += "</div>";// closing card
						
					}
					panelHtml +='	</div>';
					panelHtml +='</div>';
					
			} 
			panelHtml +='</div>';
			}	
		}
		return panelHtml;
	}
}