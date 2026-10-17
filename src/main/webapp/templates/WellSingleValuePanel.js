class WellSingleValuePanel{

    constructor(){
        
    }

    // denes (optional): the whole panel chain. Any dene in it with Warning/Alarm denewords
    // (see panelRuleLevel in GeneralFunctions.js) turns the well yellow or red.
    process(sourceDataPointer, denes){

        //var sourceDataPointerIdentity = identityFactory.createIdentityByPointer(sourceDataPointer);
        var valueToDisplay = getDeneWordByIdentityPointer(sourceDataPointer, DENEWORD_VALUE_ATTRIBUTE);
        var nameToDisplay = getDeneWordByIdentityPointer(sourceDataPointer, DENEWORD_NAME_ATTRIBUTE);
        var level = denes ? worstPanelLevel(denes) : "";
        var style = "";
        if(level==="warning") style = " style=\"background:rgb(255,235,59);color:#000;border-color:rgb(230,200,0)\"";
        if(level==="danger") style = " style=\"background:rgb(211,47,47);color:#fff;border-color:rgb(160,20,20)\"";

        // A summary like "Internet UP 14 ms · Router up 2d 3h · ..." wraps between its sections
        // instead of mid-phrase on a phone.
        var parts = String(valueToDisplay).split(" · ");
        var valueHTML = "";
        for(var i=0;i<parts.length;i++){
            valueHTML += "<span style=\"display:inline-block;white-space:nowrap;margin-right:10px\">" + parts[i] + "</span>";
        }

        var panelHTML = "<div class=\"col-lg-12\">";
        panelHTML += "<div  class=\"well well-sm\"" + style + ">";
        panelHTML += "<h5>"+nameToDisplay+": <strong>"+valueHTML +"</strong></h5>";
        panelHTML += "</div>";
        panelHTML += "</div>";
//panelHTML += "</div>";    // closing row
        
        rowPanelCounter+=2;
        return panelHTML;
    }
}