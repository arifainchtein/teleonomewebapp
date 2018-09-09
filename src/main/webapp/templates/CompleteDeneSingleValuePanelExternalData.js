class CompleteDeneSingleValuePanelExternalData{

    constructor(){

    }
    
	process(sourceDataPointer){
		//var sourceDataPointer = denes[0].DeneWords[0].Value;
		var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(sourceDataPointer);


		
		//
		// the logic here is the same as in the PANEL_VISUALIZATION_COMPLETE_DENE_STYLE_SINGLE_VALUE_PANEL
		//
		// the nly difference is that since we know is a dene from external data, there  are two variables
		// that are used to display status, so dont paint them as data but out it in the title
		// the two variables are:
		//
		// 1)externalDataStatusPointer- this variable has a bootstrap level value like warning or danger or success
		// that signify that the pacemaker processed all the denewords of this external source and everything was ok
		//
		var externalDataStatusPointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +EXTERNAL_DATA_STATUS;
		//console.log("externalDataStatusPointer=" + externalDataStatusPointer);
		var externalDataStatus = getDeneWordByIdentityPointer(externalDataStatusPointer, DENEWORD_VALUE_ATTRIBUTE);
		//console.log("externalDataStatus=" + externalDataStatus);

		//
	    // 2)statusMessage - A string description of the status
		var statusMessagePointer = "@" +teleonomeName + ":" + sourceDataPointerIdentity.nucleusName + ":" +sourceDataPointerIdentity.deneChainName + ":" + sourceDataPointerIdentity.deneName + ":" +DENEWORD_STATUS;
	//	console.log("statusMessagePointer=" + statusMessagePointer);
		var statusMessage = getDeneWordByIdentityPointer(statusMessagePointer, DENEWORD_VALUE_ATTRIBUTE);
	//	console.log("statusMessage=" + statusMessage);

		panelHTML += "<div class=\"col-lg-6\">";
		panelHTML += "<div class=\"bs-component\">";
		panelHTML += "<div class=\"panel panel-default\">";
		panelHTML += " <div class=\"panel-heading row\">"
			
		
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

		
		
		

		//console.log("in complete dene sourceDataPointer=" + sourceDataPointer)
		renderedDataSourceDene = getDeneByIdentityPointer(sourceDataPointer);
		//console.log("in complete dene renderedDataSourceDene=" + renderedDataSourceDene.toString(4))
		deneWords = renderedDataSourceDene.DeneWords;
		for(k2=0;k2<deneWords.length;k2++){
			deneWord = deneWords[k2];
			if(deneWord.Name === EXTERNAL_DATA_STATUS || deneWord.Name===DENEWORD_STATUS){continue;}
			////console.log("in complete dene deneWord=" + deneWord.toString(4))
			var unitsText=deneWord["Units"];
			if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

			// set the name to replace camel case with spaces
			nameToDisplay = deneWord["Name"].trim().replace( /([A-Z])/g, ' $1' );
			if(nameToDisplay.length>14){
				nameToDisplay="<span style=\"font-size:1em;\">"+nameToDisplay+"</span>"
			}
			
			
			//
			// nw see if you can break them into space
//			var words=nameToDisplay.split(" ");
//			if(words.length>1){
//				//
//				// there are more than one word
//				// make sure that each word does not have more than 7
//				nameToDisplay="";
//				var l2=0;
//				for( l2=0;l2<words.length;l2++){
//					if(words[l2]<7)nameToDisplay+=words[l2];
//					else nameToDisplay+=words[l2].substring(0,7);
//					nameToDisplay+=" ";
//				}
//
//			}
			panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm3 col-xs-4\">";
			panelHTML += "<div class=\"panel panel-default\">";
			panelHTML += "<div class=\"panel-heading\"><h6>" + nameToDisplay +"</h6></div>";
			panelHTML += "<div class=\"panel-body text-center\">";
			var valueData = deneWord["Value"];
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
	}
}