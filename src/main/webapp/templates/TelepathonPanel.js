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
        panelHTML += '<span style="display:inline-flex;align-items:center;margin-right:6px;padding:2px 8px;background:#eef3fa;border-radius:4px;">';
        panelHTML += '<span style="font-size:12px;font-weight:bold;color:#2c3e50;margin-right:6px;">Temperature Chart</span>';
        panelHTML += '<button type="button" class="btn btn-xs btn-default telepathon-registry-temperature-chart" data-range="3600000" style="margin-right:3px;">1h</button>';
        panelHTML += '<button type="button" class="btn btn-xs btn-default telepathon-registry-temperature-chart" data-range="86400000" style="margin-right:3px;">24h</button>';
        panelHTML += '<button type="button" class="btn btn-xs btn-default telepathon-registry-temperature-chart hidden-xs" data-range="604800000">7d</button>';
        panelHTML += '</span>';
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