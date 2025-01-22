class TelepathonPanel{

    constructor(){

    }

    process(){
        
				
        var panelHTML = "<div class=\"col-lg-6\">";
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
        panelHTML += "<div class=\"panel-body text-center\">";
        panelHTML += "<div class=\"row\">";

        //
        // if we are here, 
        // we are visualising the purpse dene of the telepathong

//				{
//				"Denes": [{
//				"Type": "Reporting",
//				"DeneWords": [{
//				"Required": "true",
//				"DeneWord Type": "Panel Data Source Pointer",
//				"Value": "@Sunflower:Purpose:External Data:Ra",
//				"Name": "Ambient Temperature",
//				"Value Type": "Dene Pointer"
//				}],
//				"Name": "Dene Data Source"
//				}],
//				"Name": "Ra"
//				}

//

        var sourceDataPointer = denes[0].DeneWords[0].Value;

        //console.log("in complete dene sourceDataPointer=" + sourceDataPointer)
        renderedDataSourceDene = getDeneByIdentityPointer(sourceDataPointer);
        //console.log("in complete dene renderedDataSourceDene=" + renderedDataSourceDene.toString(4))
        deneWords = renderedDataSourceDene.DeneWords;
        for(k2=0;k2<deneWords.length;k2++){
            deneWord = deneWords[k2];
            ////console.log("in complete dene deneWord=" + deneWord.toString(4))
            var unitsText=deneWord["Units"];
            if(unitsText==="" || unitsText===undefined)unitsText="&nbsp;&nbsp;&nbsp;&nbsp;";

            nameToDisplay = deneWord["Name"];
            nameToDisplay = deneWord["Name"].trim().replace( /([A-Z])/g, ' $1' );
            if(nameToDisplay.length>14){
                nameToDisplay="<span style=\"font-size:1em;\">"+nameToDisplay+"</span>"
            }
            //
            // nw see if you can break them into space
//					var words=nameToDisplay.split(" ");
//					if(words.length>1){
//						//
//						// there are more than one word
//						// make sure that each word does not have more than 7
//						nameToDisplay="";
//						var l8=0;
//						for( l8=0;l8<words.length;l8++){
//							if(words[l8]<9)nameToDisplay+=words[l8];
//							else nameToDisplay+=words[l8].substring(0,9);
//							nameToDisplay+=" ";
//						}
//
//					}
            panelHTML += "<div class=\"col-lg-4 col-md-4 col-sm3 col-xs-4\">";
            panelHTML += "<div class=\"panel panel-default\">";
            panelHTML += "<div class=\"panel-heading\"><h6>"+nameToDisplay+"</h6></div>";
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
        return panelHTML;
    }
}