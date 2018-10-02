class PathologyPanel{

    constructor(){

    }

    process(){
        var	pathologyDeneChainPointer = "@" + teleonomeName + ":Purpose:Pathology:";
				var  pathologyDeneChain = getDeneChainByIdentityPointer(pathologyDeneChainPointer);
				//
				// get the pointer to where the exogenous events are stored
				// these exogenous events are problems related to network, ie i am supposed to be
				// part of an organism but could not find the network so i switched to
				// host mode
				//
				var identitySwitchDeneChainPointer = "@" + teleonomeName +":Internal:Descriptive:Identity Switch Control Parameters:Identity Switch Events Mnemosyne Destination";
				var allExogenousMethamorphosisEvents = getMnemosyneExogenousEventsByPointer(identitySwitchDeneChainPointer, DENE_TYPE_EXOGENUS_METAMORPHOSIS_EVENT);
				var mnemosynePathologyDenes  = getMnemosynePathologyDenes();
				
				
				var denePanelArray = pathologyDeneChain["Denes"];
				var processingDene;
				var deneName="";
				var processingDeneName;
				var deneWords;
				var actuatorConditionDeneWord;
				var conditionExpression;
				var pathologyCause;
				var pathologyLocation;
				var conditionResult;
				var variableData;
				var i32=0;
				var j2=0;
                var panelHTML="";
                var deneWord;
				if(denePanelArray.length>0 || mnemosynePathologyDenes.length>0 || allExogenousMethamorphosisEvents.length>0){
					panelHTML += "<div class=\"col-lg-12\">";
					panelHTML += "<div class=\"bs-component\">";
					panelHTML += "<div class=\"panel panel-default\">";
					panelHTML += " <div class=\"panel-heading\"><h4>Pathology</h4></div>";
					panelHTML += "<div class=\"panel-body\">";
					panelHTML += "<h4></h4>";
					panelHTML += "<h6></h6><br>";
					panelHTML += "<table class=\"table table-stripped\">";
					panelHTML += "<tr><th>Type</th><th>Location</th><th>Cause</th><th>Details</th></tr>";
					
					if(denePanelArray.length){
						for(i32=0;i32<denePanelArray.length;i32++){
							processingDene = denePanelArray[i32];
							processingDeneName = processingDene.Name;
							deneWords = processingDene["DeneWords"];
							variableData="";
							for(j2=0;j2<deneWords.length;j2++){
								deneWord = deneWords[j2];
								if(deneWord.Name ==PATHOLOGY_CAUSE){
									pathologyCause = deneWord.Value;
								}else if(deneWord.Name ==PATHOLOGY_LOCATION){
									pathologyLocation = deneWord.Value;
								}else {
									variableData = variableData.concat(deneWord.Name + "=" + deneWord.Value + "<br>");		
									
								}	
							}
							panelHTML += "<tr><td>"+processingDeneName +"</td><td>"+ pathologyCause +"</td><td>"+pathologyLocation+"</td><td>"+variableData +"</td></tr>";				
						}
					}
					
					
					
					if(mnemosynePathologyDenes.length){
						for(i32=0;i32<mnemosynePathologyDenes.length;i32++){
							processingDene = mnemosynePathologyDenes[i32];
							processingDeneName = processingDene.Name;
							deneWords = processingDene["DeneWords"];
							variableData="";
							for(j2=0;j2<deneWords.length;j2++){
								deneWord = deneWords[j2];
								if(deneWord.Name ==PATHOLOGY_CAUSE){
									pathologyCause = deneWord.Value;
								}else if(deneWord.Name ==PATHOLOGY_LOCATION){
									pathologyLocation = deneWord.Value;
								}else {
									if( $(window).width() > 960 && deneWord.Name == PATHOLOGY_EVENT_MILLISECONDS){
										var deneWordValueText = "<a href=\"#bannerformmodal\" data-toggle=\"modal\" data-dirname=\""+deneWord.Value+"\" class=\"pathology-showLogsLink\" data-target=\"#bannerformmodal\">"+deneWord.Value+"</a>"; 
										variableData = variableData.concat(deneWord.Name + "=" + deneWordValueText + "<br>");
									}else{
										variableData = variableData.concat(deneWord.Name + "=" + deneWord.Value + "<br>");		
									}
								}	
							}
							panelHTML += "<tr><th>"+processingDeneName +"</th><th>"+ pathologyLocation +"</th><th>"+pathologyCause+"</th><th>"+variableData +"</th></tr>";				
						}
					}
					
					panelHTML += "</table>";
				}
				
				//
				// now add the div which represents the model
				// it will be hidden first
				//
				panelHTML += "<div class=\"modal fade bannerformmodal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"bannerformmodal\" aria-hidden=\"true\" id=\"bannerformmodal\">";
				panelHTML += "<div class=\"modal-dialog modal-xl\">";
				panelHTML += "<div class=\"modal-content\">";
				panelHTML += "<div class=\"modal-content\">";
				panelHTML += "<div class=\"modal-header \">";
				panelHTML += "<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" id=\"dismissbannerformmodal\">&times;</button>";
				panelHTML += "<h4 class=\"modal-title\" id=\"myModalLabel\">";
				
				panelHTML += "<ul class=\"nav nav-pills pathology-file-list\">";
				panelHTML += "</ul>";
				panelHTML += "</h4>";
				panelHTML += "</div>";
				panelHTML += "<div class=\"modal-body pathology-modal-body\">";
				panelHTML += "</div>";
				panelHTML += "<div class=\"modal-footer\">";
				panelHTML += "</div>  ";      
				panelHTML += "</div>";
				panelHTML += "</div>";
				panelHTML += "</div>";
				panelHTML += " </div>";
				//
				// ends the code for modal widnow
				
				var eventTimestamp;
				if(allExogenousMethamorphosisEvents.length>0){
					
					panelHTML += "<h6></h6><br>";
					panelHTML += "<table class=\"table table-stripped\">";
					panelHTML += "<tr><th>Type</th><th>Time</th><th>Cause</th><th>Details</th></tr>";
					
					for(i32=0;i32<allExogenousMethamorphosisEvents.length;i32++){
						processingDene = allExogenousMethamorphosisEvents[i32];
						processingDeneName = processingDene.Name;
						deneWords = processingDene["DeneWords"];
						variableData="";
						for(j2=0;j2<deneWords.length;j2++){
							deneWord = deneWords[j2];
							if(deneWord.Name ==METAMORPHOSIS_EVENT_TIMESTAMP){
								eventTimestamp = deneWord.Value;
							}	
						}
						panelHTML += "<tr><td>Identity Switch</td><td>"+ eventTimestamp +"</td></tr>";				
					}
					panelHTML += "</table>";
                }
                return panelHTML;
    }
}