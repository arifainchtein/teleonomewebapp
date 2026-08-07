class TelepathonPanel{

    constructor(){

    }

    process(title){

        var panelHTML = '<div class="col-lg-12">';
        panelHTML += '<div class="bs-component">';
        panelHTML += '<div class="panel panel-default">';
        panelHTML += '<div class="panel-heading" style="display:flex;align-items:center;justify-content:space-between;">';
        panelHTML += '<h4 style="margin:0;">'+title+'</h4>';
        panelHTML += '<div>';
        panelHTML += '<button type="button" id="registryStatusBtn" class="btn btn-sm btn-default" ' +
            'style="margin-right:6px;" onclick="openRegistryStatusModal()">Registry Status</button>';
        var qaColor = (typeof queueAnalysisButtonColor === 'function') ? queueAnalysisButtonColor() : '#777';
        panelHTML += '<button type="button" id="queueAnalysisBtn" class="btn btn-sm" ' +
            'style="background-color:'+qaColor+';border-color:'+qaColor+';color:#fff;" ' +
            'onclick="openQueueAnalysisModal()">Queue Analysis</button>';
        panelHTML += '</div>';
        panelHTML += '</div>';
        panelHTML += '<div class="panel-body text-center">';
        panelHTML += '<div id="TelepathonsView" class="row">';
        panelHTML += refreshTelepathonsView();
        return panelHTML;
    }
}