class OrganismView{

    constructor(){

    }

    process(title){
        
        var panelHTML = "<div class=\"col-lg-12\">";
        panelHTML += "<div class=\"bs-component\">";
        panelHTML += "<div class=\"panel panel-default\">";
        panelHTML += " <div class=\"panel-heading\"><h4>"+title+"</h4></div>";
        panelHTML += "<div class=\"panel-body text-center\">";
        panelHTML += "<div id=\"OrganismView\" class=\"row\">";

        return panelHTML;
    }
}