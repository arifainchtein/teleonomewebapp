class WellSingleValuePanel{

    constructor(){
        
    }

    process(sourceDataPointer){
        
        //var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(sourceDataPointer);
        var valueToDisplay = getDeneWordByIdentityPointer(sourceDataPointer, DENEWORD_VALUE_ATTRIBUTE);
        var nameToDisplay = getDeneWordByIdentityPointer(sourceDataPointer, DENEWORD_NAME_ATTRIBUTE);
        var panelHTML = "<div class=\"col-lg-12\">";
        panelHTML += "<div  class=\"well well-sm\">";
        panelHTML += "<h5>"+nameToDisplay+":<strong>"+valueToDisplay +"</strong></h5>";
        panelHTML += "</div>";
        panelHTML += "</div>";
//panelHTML += "</div>";    // closing row
        
        rowPanelCounter+=2;
        return panelHTML;
    }
}