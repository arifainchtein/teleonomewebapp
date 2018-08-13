class SearchPanel{

    

    
    constructor(){
    
    }

    process(){
        var panelHTML="";
        panelHTML += "<div class=\"resizable ui-widget-content container-fluid wrap\">";
        panelHTML += "                <div class=\"row-fluid\">";
        panelHTML += "                        <div id=\"UpdateArea\" class=\"pull-left TopButtons\"><div id=\"RefreshCounter\"></div><div id=\"RefreshCounterMessage\">Click to Pause</div></div>";
                            
        panelHTML += "                    <div id=\"TopButtons\" class=\"pull-right TopButtons\">";
        panelHTML += "                        <button class=\"btn btn-default\" type=\"button\" id=\"NewChart\" type=\"submit\" value=\"Submit\"><em class=\"glyphicon glyphicon-plus\"></em>New Chart</button>";
        panelHTML += "                        <button class=\"btn btn-default\" type=\"button\" id=\"ClearCharts\" type=\"submit\" value=\"Submit\"><em class=\"glyphicon glyphicon-remove\"></em>Clear Charts</button>";
        panelHTML += "                    </div>";
        panelHTML += "                </div>";

        panelHTML += "                <div class=\"modal fade bannerformmodal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"bannerformmodal\" aria-hidden=\"true\" id=\"bannerformmodal\">";
        panelHTML += "				    <div class=\"modal-dialog modal-xl\">";
        panelHTML += "				        <div class=\"modal-content\">";
        panelHTML += "				            <div class=\"modal-content\">";
        panelHTML += "				                <div class=\"modal-header \">";
        panelHTML += "				                    <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\" id=\"dismissbannerformmodal\">&times;</button>";
        panelHTML += "                                    <h4 class=\"modal-title\" id=\"DisplayPulseTitle\"></h4>";
        panelHTML += "                                    <button type=\"button\"   onclick=\"CopyToClipboard('DisplayPulseData')\" id=\"CopyPulseData\">Copy</button>  ";                                  
        panelHTML += "				                </div>";
        panelHTML += "				                <div id=\"DisplayPulseData\" class=\"modal-body\"></div>";
        panelHTML += "				                <div class=\"modal-footer\"></div>  ";   
        panelHTML += "				            </div>";
        panelHTML += "				        </div>";
        panelHTML += "				    </div>";
        panelHTML += "                </div>";
                       
        panelHTML += "                <div id=\"SearchConfigurator\"  class=\"SearchConfigurator row\" style=\"display:none\">";
        panelHTML += "                        <form >";
        panelHTML += "                                <div class=\"form-row\">";
        panelHTML += "                                        <label for=\"Identity\">Remembered DeneWords</label>";
        panelHTML += "                                    <select name=\"identity\" id=\"Identity\"></select><br>";
        panelHTML += "                                </div> ";                               
        panelHTML += "                                <div class=\"form-row\">";
        panelHTML += "                                        <label for=\"Teleonome\">Search Denome</label>";
        panelHTML += "                                    <select name=\"Teleonome\" id=\"Teleonome\" onchange=\"populateNuclei()\"></select>";
        panelHTML += "                                    <select name=\"Nucleus\" id=\"Nucleus\" onchange=\"populateDeneChain()\"></select>";
        panelHTML += "                                    <select name=\"DeneChain\" id=\"DeneChain\" onchange=\"populateDene()\"></select>";
        panelHTML += "                                    <select name=\"Dene\" id=\"Dene\" onchange=\"populateDeneWord()\"></select>";
        panelHTML += "                                    <select name=\"DeneWord\" id=\"DeneWord\" onchange=\"populateLookUpIdentity()\"></select>";
        panelHTML += "                                </div>";
        panelHTML += "                                <div  id=\"LookUpIdentity\" name=\"lookupUpIdentity\"></div><br>";                                 
        panelHTML += "                                <div class=\"form-row\">";
        panelHTML += "                                    <div class=\"form-group col-md-6\">";
        panelHTML += "                                        <label for=\"fromDate\">From</label>";
        panelHTML += "                                        <input type=\"DATE\" name=\"fromDate\" id=\"fromDate\">    <input type=\"time\" name=\"fromTime\" id=\"fromTime\">";
        panelHTML += "                                    </div>";
        panelHTML += "                                    <div class=\"form-group col-md-6\">";
        panelHTML += "                                            <label for=\"untilDate\">Until</label>";
        panelHTML += "                                        <input type=\"DATE\" name=\"untilDate\" id=\"untilDate\">    <input type=\"time\" name=\"untilTime\" id=\"untilTime\">";
        panelHTML += "                                    </div>";
        panelHTML += "                                </div>";
        panelHTML += "                                <div class=\"form-row\">";
        panelHTML += "                                    <div class=\"form-group col-md-6\">";
        panelHTML += "                                            <label for=\"VisualisationType\">View As</label>";
        panelHTML += "                                            <select name=\"VisualisationType\" id=\"VisualisationType\">";
        panelHTML += "                                                <option value=\"LineGraph\">Line Graph</option>";
        panelHTML += "                                                <option value=\"DataTable\">Data Table</option>";
        panelHTML += "                                            </select>";
        panelHTML += "                                    </div>";
        panelHTML += "                                    <div class=\"form-group col-md-6\">";
        panelHTML += "                                        <div class=\"form-check form-check-inline\">";
        panelHTML += "                                            <input class=\"form-check-input\" type=\"checkbox\" id=\"AppendChart\" >";
        panelHTML += "                                            <label class=\"form-check-label\" for=\"AppendChart\">Append</label>";
        panelHTML += "                                        </div>";
        panelHTML += "                                        <div class=\"form-check form-check-inline\">";
        panelHTML += "                                            <input class=\"form-check-input\" type=\"checkbox\" id=\"LiveUpdate\" value=\"option2\">";
        panelHTML += "                                            <label class=\"form-check-label\" for=\"LiveUpdate\">Live Update</label>";
        panelHTML += "                                        </div>";
        panelHTML += "                                    </div>";
        panelHTML += "                                </div>";
        panelHTML += "                                <div class=\"form-row\">";
        panelHTML += "                                    <div class=\"pull-right SearchConfiguratorButtons\">";
        panelHTML += "                                        <button id=\"CancelSearch\" class=\"btn btn-default\" type=\"button\" type=\"submit\" value=\"Submit\">Cancel</button>";
        panelHTML += "                                        <button id=\"GetDataSubmit\" class=\"btn btn-default\" type=\"button\" type=\"submit\" value=\"Submit\">Get Data</button>";
        panelHTML += "                                    </div>";
        panelHTML += "                                </div> ";
        panelHTML += "                         </form>";
        panelHTML += "                </div>";
        panelHTML += "  <div id=\"SearchGraphArea\"></div>";
        panelHTML += "         </div>";
        searchFunctions.loadNewVisualizerData();
        
        return panelHTML;
}



     processForm(formName,identityPointer, fromMillis , untilMillis, appendChart, visualizationStyle, liveUpdate){
        var identity = identityFactory.createIdentityByPointer(identityPointer);
        
        var anyTeleonomeName = identity.teleonomeName;
        var chartTitle = anyTeleonomeName + "-"+identity.deneWordName;
    
        $.ajax({
            type: "GET",
            url: "/TeleonomeServlet",
            data: {formName:formName, identity:identityPointer, from:fromMillis,until:untilMillis},
            success: function (data) {
                console.log("receiving data for" + identityPointer);
                if(!appendChart){
                    $("#EntryPoint").empty();
                } 
                var lastValue = data.Value[data.Value.length-1].Value;
                var rendLastValue = lastValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
                var units = data.Units.replace('"','');
                var chartTitleNoSpaces = chartTitle.replace(/\s/g, '');
                var lastValueMillis = data.Value[data.Value.length-1]["Pulse Timestamp in Milliseconds"];
                var lastValueTimestamp = new Date(lastValueMillis);
    
                var forHour;
                if(lastValueTimestamp.getHours()<10){
                    forHour="0" + lastValueTimestamp.getHours();
                }else{
                    forHour=lastValueTimestamp.getHours();
                }
    
                var forMin;
                if(lastValueTimestamp.getMinutes()<10){
                    forMin="0" + lastValueTimestamp.getMinutes();
                }else{
                    forMin=lastValueTimestamp.getMinutes();
                }
                var lastValueDisplayString = lastValueTimestamp.getDate()+"/" +  (lastValueTimestamp.getMonth()+1)+"/" + lastValueTimestamp.getFullYear()+" " + forHour+":" +forMin;
    console.log("painting " + chartTitle);
               // var newDiv ='<div class=\"Parent\" id=\"'+chartTitle+'Parent\"><div class="row-fluid \"><div class=\"col-xs-10 column\"> <div id=\"' +chartTitleNoSpaces + '\"></div></div><div class=\"col-xs-2 column LastValuePanel\"><div id=\"'+chartTitle+'LastValue\"><span class=\"lastValue\">'+lastValue +'</span><br><span class=\"lastValueUnits\"><span>'+units+'</span></div></div></div>';
                var panelHTML= "<div class=\"row\">";  
                panelHTML += "<div class=\"col-lg-6\">";   
                panelHTML += "<div class=\"bs-component\">";
                panelHTML +=     "<div class=\"panel panel-default\">";
                panelHTML +=         " <div class=\"panel-heading clearfix\"><span class=\"HeadingTitle\">"+ chartTitle +"</span><button data-charttitle=\"" + identityPointer + "_" + visualizationStyle +"_" + liveUpdate + "\" class=\"btn btn-default  pull-right RemoveChart\"  ><i class=\" glyphicon glyphicon-remove\"></i></button></div>";
                panelHTML +=         "<div class=\"panel-body text-center\">";
                panelHTML +=             "<div class=\"Parent\" id=\"'+chartTitle+'Parent\">";
                panelHTML +=                 "<div class=\"row-fluid \">";
                if(visualizationStyle=="LineGraph"){   
                    panelHTML +=                     "<div class=\"col-xs-10 column\"> ";
                    panelHTML +=                         "<div id=\"" +chartTitleNoSpaces + "\">";
                    panelHTML +=                         "</div>";
                    panelHTML +=                    "</div>";
                    panelHTML +=                    "<div class=\"col-xs-2 column LastValuePanel\">";            
                    panelHTML +=                        "<div id=\""+chartTitle+"LastValue\"><span class=\"lastValue\">"+rendLastValue +"</span><br><span class=\"lastValueUnits\"><span>"+units+"</span><br><span class=\"lastValueTimeString\"><span>"+lastValueDisplayString+"</span>";
                    panelHTML +=                    "</div>";
                }else if(visualizationStyle=="DataTable"){
                    
                    panelHTML += "<div class=\"col-xs-12 column\">";
                    panelHTML += '<table class=\"table table-striped\">';
                    panelHTML += "<thead class=\"thead-dark\">";
                    panelHTML += "<tr><th>Time</th><th>Value</th></tr></thead>"
                    
                    $.each(data, function() {
                        $.each(this, function(i,item) {
                            var formatedTime = new Date(item["Pulse Timestamp in Milliseconds"]);
                            var forMin;
                            if(formatedTime.getMinutes()<10){
                                forMin="0" + formatedTime.getMinutes();
                            }else{
                                forMin=formatedTime.getMinutes();
                            }
                            var ft = formatedTime.getDate()+"/" +  (formatedTime.getMonth()+1)+"/" + formatedTime.getFullYear()+" " + formatedTime.getHours()+":" +forMin;
                            
                            if(item.Value != undefined &&  !isNaN(formatedTime.getDate()) ){
                                        
                                panelHTML += '<tr><td><a href=\"#bannerformmodal\" data-target=\"#bannerformmodal\"  data-toggle=\"modal\" class=\"PulseTime\" data-time=\"' + item["Pulse Timestamp in Milliseconds"] + '\"  data-teleonomeName=\"'+ anyTeleonomeName +'\">' + ft + '</a></td><td>' + item.Value + '</td></tr>';
                            }
                        });
                    });
                    panelHTML += '</table></div>';
                }   
                panelHTML +=                   "</div>";
                panelHTML +=               "</div>";
                panelHTML +=           "</div>";
                panelHTML +=       "</div>";
                panelHTML +=   "</div>";
                panelHTML +="</div>";
                 panelHTML +="</div>";
                $("#EntryPoint").append(panelHTML);
                if(visualizationStyle=="LineGraph"){
                    drawTimeSeriesLineChart(chartTitleNoSpaces,data, "");
                   
                }
               
            },
            error: function(data){
                $('#WaitingWheel').hide();
                console.log("error getting log file:" + JSON.stringify(data));
                alert("Error getting log:" + JSON.stringify(data));
                return false;
            }
        }); 
    }
    
    
     
    
     
    
    
    
     getNumberOfSearchObjects(){
    	 return localStorageManager.getNumberOfObjectsByComponent(localStorageSearchKey);
        
    
    }
    
     allSearchStorage() {
    	return localStorageManager.getAllStorageForComponent(localStorageSearchKey);
    }
    
     
    
     displayPulse(teleonomeName, pulseMillis){
    
            $('#WaitingWheel').show();
            var formName="getOrganismPulseByTeleonomeNameAndTimestamp";
           
            
         $.ajax({
                    
                    type: "GET",
                    url: "/TeleonomeServlet",
                    data: {formName:formName, TeleonomeName:teleonomeName, PulseMillis:pulseMillis},
                    success: function (data) {
                       // console.log("data=" + JSON.stringify(data));
                       var pulseJson = JSON.stringify(data, null, 2);
                       var d =  new Date(pulseMillis);
                       var datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " +d.getHours() + ":" + d.getMinutes()+ ":" + d.getSeconds();
                        $('#DisplayPulseTitle').html(teleonomeName + " " + datestring);
                        $('#DisplayPulseData').html(pulseJson)
                        $('#WaitingWheel').hide();
                    },
                    error: function(data){
                        $('#WaitingWheel').hide();
                        console.log("error getting log file:" + JSON.stringify(data));
                        alert("Error getting log:" + JSON.stringify(data));
                        return false;
                    }
                });
    }
     populateNuclei(){
        $('#WaitingText').html("Please wait...");
        $('#WaitingWheel').show();
    
            var selectedTeleonome = $('#Teleonome').find(":selected").val();
            $('#Nucleus').empty();
            $('#DeneChain').empty();
            $('#Dene').empty();
            $('#DeneWord').empty();
    
    
            $.ajax({
                type: "GET",
                url: "/TeleonomeServlet",
                data: {formName:"GetNucleiNames",TeleonomeName:selectedTeleonome },
                success: function (data) {
                    $('#Nucleus').append($('<option>', {
                            value: "",
                            text : "Select A Nucleus"
                        }));
    
                    $.each(data, function (i, item) {
                        $('#Nucleus').append($('<option>', {
                            value: item,
                            text : item
                        }));
                    });
                    $('#WaitingWheel').hide();
                },
                error: function(data){
                    $('#WaitingWheel').hide();
                    console.log("error getting TeleonomeNames:" + JSON.stringify(data));
                    alert("Error getting list:" + JSON.stringify(data));
                    return false;
                }
            });
        }
    
     populateDeneChain(){
       
            $('#DeneChain').empty();
            $('#Dene').empty();
            $('#DeneWord').empty();
        $('#WaitingText').html("Please wait...");
        $('#WaitingWheel').show();
            var selectedTeleonome = $('#Teleonome').find(":selected").val();
            var selectedNucleus = $('#Nucleus').find(":selected").val();
            $.ajax({
                type: "GET",
                url: "/TeleonomeServlet",
                data: {formName:"GetDeneChainNames",TeleonomeName:selectedTeleonome, Nucleus:selectedNucleus },
                success: function (data) {
                    $('#DeneChain').append($('<option>', {
                            value: "",
                            text : "Select A DeneChain"
                        }));
    
                    $.each(data, function (i, item) {
                        $('#DeneChain').append($('<option>', {
                            value: item,
                            text : item
                        }));
                    });
                    $('#WaitingWheel').hide();
                },
                error: function(data){
                    $('#WaitingWheel').hide();
                    console.log("error getting TeleonomeNames:" + JSON.stringify(data));
                    alert("Error getting list:" + JSON.stringify(data));
                    return false;
                }
            });
        }
    
     populateDene(){
        $('#WaitingText').html("Please wait...");
        $('#WaitingWheel').show();
       
            $('#Dene').empty();
            $('#DeneWord').empty();
            var selectedTeleonome = $('#Teleonome').find(":selected").val();
            var selectedNucleus = $('#Nucleus').find(":selected").val();
            var selecteDeneChain = $('#DeneChain').find(":selected").val();
            $.ajax({
                type: "GET",
                url: "/TeleonomeServlet",
                data: {formName:"GetDeneNames",TeleonomeName:selectedTeleonome, Nucleus:selectedNucleus, DeneChain:selecteDeneChain },
                success: function (data) {
                    $('#Dene').append($('<option>', {
                            value: "",
                            text : "Select A Dene"
                        }));
    
                    $.each(data, function (i, item) {
                        $('#Dene').append($('<option>', {
                            value: item,
                            text : item
                        }));
                    });
                    $('#WaitingWheel').hide();
                },
                error: function(data){
                    $('#WaitingWheel').hide();
                    console.log("error getting Denes:" + JSON.stringify(data));
                    alert("Error getting list:" + JSON.stringify(data));
                    return false;
                }
            });
        }
    
    
     populateDeneWord(){
        $('#WaitingText').html("Please wait...");
        $('#WaitingWheel').show();
    
            $('#DeneWord').empty();
            var selectedTeleonome = $('#Teleonome').find(":selected").val();
            var selectedNucleus = $('#Nucleus').find(":selected").val();
            var selecteDeneChain = $('#DeneChain').find(":selected").val();
            var selecteDene = $('#Dene').find(":selected").val();
            $.ajax({
                type: "GET",
                url: "/TeleonomeServlet",
                data: {formName:"GetDeneWordNames",TeleonomeName:selectedTeleonome, Nucleus:selectedNucleus, DeneChain:selecteDeneChain, Dene:selecteDene },
                success: function (data) {
                    $('#DeneWord').append($('<option>', {
                            value: "",
                            text : "Select A Dene Word"
                        }));
    
                    $.each(data, function (i, item) {
                        $('#DeneWord').append($('<option>', {
                            value: item,
                            text : item
                        }));
                    });
                    $('#WaitingWheel').hide();
                },
                error: function(data){
                    $('#WaitingWheel').hide();
                    console.log("error getting Denes:" + JSON.stringify(data));
                    alert("Error getting list:" + JSON.stringify(data));
                    return false;
                }
            });
        }
    
         populateLookUpIdentity(){
            var selectedTeleonome = $('#Teleonome').find(":selected").val();
            var selectedNucleus = $('#Nucleus').find(":selected").val();
            var selecteDeneChain = $('#DeneChain').find(":selected").val();
            var selecteDene = $('#Dene').find(":selected").val();
            var selecteDeneWord = $('#DeneWord').find(":selected").val();
            $('#LookUpIdentity').html(selectedTeleonome + ":" + selectedNucleus + ":" + selecteDeneChain + ":" + selecteDene + ":" + selecteDeneWord);
        }
}