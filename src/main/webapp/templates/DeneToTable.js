class DeneToTable{

    constructor(){
        
    }
    

    /**
     * This method takes a pointer to a dene and returns the Dene rendered as HTML, display the name and value in two columns
     * @param {JSON} dene 
     */
    process(denePointer){
        
        renderedDataSourceDene = getDeneByIdentityPointer(denePointer);        
		panelHTML += "<div class=\"col-lg-6\">";
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading\"><h4>"+renderedDataSourceDene.Name+"</h4></div>";
        panelHTML += "<div class=\"panel-body text-center\">";
        panelHTML += "<div class=\"row\">";
        deneWords = renderedDataSourceDene.DeneWords;
        panelHTML += "<table class=\"table table-stripped\">";
        for(k2=0;k2<deneWords.length;k2++){
            deneWord = deneWords[k2];
            ////console.log("in complete dene deneWord=" + deneWord.toString(4))
            var unitsText=deneWord["Units"];
            if(unitsText==="" || unitsText===undefined)unitsText="&nbsp";
			panelHTML += "<tr><td>"+ deneWord.Name +"</td><td>" + deneWord.Value +"&nbsp" + unitsText + "</td></tr>";
        }
        panelHTML += "</tbody></table>";
		panelHTML += "</div>";
        return panelHTML;
        
        panelHTML += "</div>";
	}
}