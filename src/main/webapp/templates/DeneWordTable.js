class DeneWordTable{
	
	constructor(){
        
    }
	
	process(panelTitle, denes){
		var panelHTML = "<div class=\"col-lg-6\">";
		panelHTML += "<div class=\"bs-component\">";
		panelHTML += "<div class=\"panel panel-default\">";
		//panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
		panelHTML += " <div class=\"panel-heading\"><h4>"+panelTitle+"</h4></div>";
		panelHTML += "<div class=\"panel-body text-center\">";
		panelHTML += "<div class=\"row\">";
		panelHTML += "<table class=\"table table-stripped text-center\"><tbody>";
		
		//
		// the denechain that has this  panel  style always has two denes, one that describes the panel 
		// and one that has the denewords that will go into the table.  Because of that, all we need to do
		// to discover the dene that has the denewords is to pass  each dene to the function below
		var dene;
		var deneWordRows;
		var deneWordRowPointer;
		var renderedDeneWordRow;
		for(k2=0;k2<denes.length;k2++){
			dene = denes[k2];
			deneWordRows = getAllDeneWordAttributeByDeneWordTypeFromDene(dene,DENEWORD_TYPE_DISPLAY_TABLE_DENEWORD_POINTER,DENEWORD_VALUE_ATTRIBUTE);				
			panelHTML += "<table class=\"table table-stripped\">";
			if(deneWordRows.length>0){
				
				for(var l2=0; l2<deneWordRows.length;l2++) {
					deneWordRowPointer = deneWordRows[l2];
					renderedDeneWordRow = getDeneWordByIdentityPointer(deneWordRowPointer, COMPLETE);
					console.log("deneWordRowPointer=" + deneWordRowPointer +  " renderedDeneWordRow=" + renderedDeneWordRow)
					panelHTML += "<tr><td>"+ renderedDeneWordRow.Name +"</td><td>" + renderedDeneWordRow.Value +"</td></tr>";
				}
			}
		}
					
		panelHTML += "</tbody></table>";
		panelHTML += "</div>";
		return panelHTML;
	}
}