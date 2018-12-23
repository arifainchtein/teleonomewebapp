class SearchFunctions{
	
	constructor(){
		
	}
	
	displayMnemosyconRulesDetails(mnemosyconName, pulseMillis){
		$('#WaitingWheel').show();
        var formName="GetMnemosyconRulesDetails";
       
        
     $.ajax({
                
                type: "GET",
                url: "/TeleonomeServlet",
                data: {formName:formName, MnemosyconName:mnemosyconName, PulseMillis:pulseMillis},
                success: function (rulesDetails) {
                   // // console.log("data=" + JSON.stringify(data));
                  // var rulesDetails = JSON.parse(data);
                   var rulesDetailsRenderedHTML=renderMnemosyconsRules(mnemosyconName,rulesDetails);
                   
                   var d =  new Date(pulseMillis);
                   var datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " +d.getHours() + ":" + d.getMinutes()+ ":" + d.getSeconds();
                    $('#DisplayPulseTitle').html(mnemosyconName+ " " + datestring);
                    $('#DisplayPulseData').html(rulesDetailsRenderedHTML);
                    $('#WaitingWheel').hide();
                },
                error: function(data){
                    $('#WaitingWheel').hide();
                    // console.log("error getting log file:" + JSON.stringify(data));
                    alert("Error getting log:" + JSON.stringify(data));
                    return false;
                }
            });
	}
	
	
	displayPulse(teleonomeName, pulseMillis){
	    
        $('#WaitingWheel').show();
        var formName="GetOrganismPulseByTeleonomeNameAndTimestamp";
       
        
     $.ajax({
                
                type: "GET",
                url: "/TeleonomeServlet",
                data: {formName:formName, TeleonomeName:teleonomeName, PulseMillis:pulseMillis},
                success: function (data) {
                   // // console.log("data=" + JSON.stringify(data));
                   var pulseJson = JSON.stringify(data, null, 2);
                   var d =  new Date(pulseMillis);
                   var datestring = d.getDate()  + "-" + (d.getMonth()+1) + "-" + d.getFullYear() + " " +d.getHours() + ":" + d.getMinutes()+ ":" + d.getSeconds();
                    $('#DisplayPulseTitle').html(teleonomeName + " " + datestring);
                    $('#DisplayPulseData').html(pulseJson);
                    $('#WaitingWheel').hide();
                },
                error: function(data){
                    $('#WaitingWheel').hide();
                    // console.log("error getting log file:" + JSON.stringify(data));
                    alert("Error getting log:" + JSON.stringify(data));
                    return false;
                }
            });
}
	
	
	refreshSearchPage(){
        if(!refreshCounterStatus){
            return false;
        }
        
        //var allGraphs = allSearchStorage();
        var allGraphs = localStorageManager.getAllStorageForComponent(LOCAL_STORAGE_SEARCH_KEY);
        if(allGraphs.length==0){
            // console.log('no refresh since there are no visuzliaers');
            $("#RefreshCounter").html("");
            $("#SearchGraphArea").empty();
            refreshCounter=0;
            return false;
        } 
       // location.reload();
       // console.log("about to refresh");
      
       
        
       
    
       searchFunctions.generateAllGraphs();
        
    }
	
	 refreshCounterUpdate(){
	        if(!refreshCounterStatus){
	            $("#RefreshCounter").html("||");
	            $("#RefreshCounterMessage").html("Click to Start");
	            return false;
	        }
	        var allGraphs = localStorageManager.getAllStorageForComponent(LOCAL_STORAGE_SEARCH_KEY);
	        refreshCounter--;
	        
	        if(allGraphs.length==0){
	            $("#RefreshCounter").html("");
	            $("#RefreshCounterMessage").html("");
	        }else{
	            $("#RefreshCounter").html(refreshCounter);
	            $("#RefreshCounterMessage").html("Click to Pause");
	        }
	    }
	 
	generateAllGraphs(){
		    var allGraphs = localStorageManager.getAllStorageForComponent(LOCAL_STORAGE_SEARCH_KEY);

		    if(allGraphs.length>0){
		        //
		        // do it backwards to display the correct order
		        //
		       //for(var i=allGraphs.length-1;i>-1;i--){
		           var reqData=[];
                $('#WaitingText').html("Please Wait...");
                $('#WaitingWheel').show();

		        for(var i=0;i<allGraphs.length;i++){
		            var graphData = JSON.parse(allGraphs[i]);
		            var visualizationStyle = graphData.visualizationStyle;
		            var identityPointer = graphData.identityPointer;
		            var fromMillis = graphData.fromMillis;
		            var untilMillis = graphData.untilMillis;
		            var formName=graphData.formName;
		            var showMax=graphData.showMax;
		            var showMin=graphData.showMin;
		            var showAvg=graphData.showAvg;
		            
		            var appendChart = graphData.appendChart;
                    var chartTitle = graphData.chartTitle;
                    var chartDivId = graphData.chartDivId;
                    var liveUpdate = graphData.liveUpdate;
                    var liveUpdateMinutes = graphData.liveUpdateMinutes;
                    
                    var localStoreageKey = graphData.localStoreageKey;
		            // console.log("graphData.chartTitle="+ graphData.chartTitle + " position=" + graphData.position);
		            if(liveUpdate){ 
		               // if its live udpdate, ignore the times stored and set tthe to be the last 24 hour    
		                 fromMillis = new Date().getTime()-liveUpdateMinutes*60000;
		                 untilMillis = new Date().getTime();
		            }
		            $("#AppendChart").prop('checked', appendChart);
		            $("#LiveUpdate").prop('checked', liveUpdate);
		          
		            var serverRequest = {};
		            serverRequest.identity=identityPointer;
		            serverRequest.fromMillis=fromMillis;
		            serverRequest.untilMillis=untilMillis;
		            serverRequest.visualizationStyle=visualizationStyle;
                    serverRequest.localStoreageKey=localStoreageKey;
                    serverRequest.formName=formName;
                    serverRequest.chartDivId=chartDivId ;
                    serverRequest.showMax=showMax ;
                    serverRequest.showMin=showMin ;
                    serverRequest.showAvg=showAvg ;
                    
                    serverRequest.liveUpdateMinutes=liveUpdateMinutes;
                    serverRequest.liveUpdate=liveUpdate;
                    serverRequest.chartTitle=chartTitle;
		            reqData[i]=serverRequest;
		        }

                var dataToSend = JSON.stringify(reqData);
                

		        $.ajax({
		            type: "GET",
		            url: "/TeleonomeServlet",
		            data: {formName:"RefreshCurrentView", data:dataToSend},
		            success: function (dataString) {
		                // console.log("receiving data for refresh" );
		               // if(!appendChart){
		                    
		                //} 
		                var allData = JSON.parse(dataString);
		                $("#SearchGraphArea").empty();
		                var panelHTML="";
		                for(var j=0;j<allData.length;j++){
		                    var data = allData[j];
                            var chartTitle = data.chartTitle;
                            var chartDivId = data.chartDivId;
                            var fromMillis = data.fromMillis;
                            var untilMillis = data.untilMillis;
                            var localStoreageKey = data.localStoreageKey;

                            if(data.Value.length==0){
                                continue;
                            }
		                    var lastValue = data.Value[data.Value.length-1].Value;
		                    var rendLastValue = lastValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		                    var anyTeleonomeName = data.TeleonomeName;
		                    var units = data.Units.replace('"','');
                            var liveUpdate = data.liveUpdate;
                            var liveUpdateMinutes=data.liveUpdateMinutes;
		                    var lastValueMillis = data.Value[data.Value.length-1]["Pulse Timestamp in Milliseconds"];
		                    
		                    
		                    var lastValueTimestamp = new Date(lastValueMillis);
		                    var visualizationStyle =data.VisualizationStyle;
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
                            
		                    var showMax=data.showMax;
				            var showMin=data.showMin;
				            var showAvg=data.showAvg;
				            var statsColumnWidth=0;
				            var maxValue=0;
				            var maxValueTimeString="";
				            if(showMax){
				            	statsColumnWidth++;
				            	var maxDataMillis = data.maxDataInfo["Pulse Timestamp in Milliseconds"];
				            	var maxDate =  new Date(maxDataMillis);
				            	maxValueTimeString = getISOStringWithoutSecsAndMillisecs(maxDate)
				                maxValue = data.maxDataInfo.Value;
				            }

				            var minValue=0;
				            var minValueTimeString="";
				            if(showMin){
				            	statsColumnWidth++;
				            	var minDataMillis = data.minDataInfo["Pulse Timestamp in Milliseconds"];
				            	var minDate =  new Date(minDataMillis);
				            	minValueTimeString = getISOStringWithoutSecsAndMillisecs(minDate)
				                minValue = data.minDataInfo.Value;
				            }

				            var avgValue=0;
				            if(showAvg){
				            	statsColumnWidth++;
				                minValue = data.avgDataInfo.Value;
				            }

				            if(statsColumnWidth>0){
				            	statsColumnWidth = 12/statsColumnWidth;
				            }
				            
		                    var lastValueDisplayString = lastValueTimestamp.getDate()+"/" +  (lastValueTimestamp.getMonth()+1)+"/" + lastValueTimestamp.getFullYear()+" " + forHour+":" +forMin;
		                    // console.log("painting " + chartTitle);
		                    panelHTML = "<div class=\"row\">";  
		                    panelHTML += "<div class=\"col-lg-12 col-md-12 col-sm-12 col-xs-12\">";   
		                    panelHTML += "<div class=\"bs-component\">";
		                    panelHTML +=     "<div class=\"panel panel-default\">";
		                    panelHTML +=         " <div class=\"panel-heading clearfix\"><span class=\"HeadingTitle\">"+ chartTitle +"</span><button data-charttitle=\"" + localStoreageKey + "\" class=\"btn btn-default  pull-right RemoveChart\"  ><i class=\" glyphicon glyphicon-remove\"></i></button></div>";
		                    panelHTML +=         "<div class=\"panel-body text-center\">";
		                    panelHTML +=             "<div class=\"Parent\" id=\"'+chartTitle+'Parent\">";
		                    var screensize = document.documentElement.clientWidth;
		                    
		                    
		                    panelHTML +=                 "<div class=\"row-fluid \">";
		                    if(visualizationStyle=="LineGraph"){  
		                    	
		                    	if(screensize<500){
		                    		panelHTML +=                     "<div class=\"col-xs-12 column\"> ";
			                        panelHTML +=                         "<div id=\"" +chartDivId + "\">";
			                        panelHTML +=                         "</div>";
			                        panelHTML +=                    "</div>";
			                     // closing the row and moving the last value to a new row
                                    panelHTML +=                    "</div>"; 
                                    if(liveUpdate){
                                        panelHTML +=                 "<div class=\"row-fluid \">";
                                        panelHTML +=                    "<div class=\"col-xs-12 column label label-primary LastValuePanelSmall\">";            
                                        panelHTML +=                        "<div id=\""+chartTitle+"LastValue\"><span class=\"lastValueSmall\">"+rendLastValue +"</span><span class=\"lastValueUnitsSmall\"><span>"+units+"</span><span class=\"lastValueTimeStringSmall\">"+lastValueDisplayString+"</span>";
                                        panelHTML +=                    "</div>";
                                    }
                                    if(statsColumnWidth>0){
                                    	panelHTML +=                 "<div class=\"row-fluid \">";
                                    	
                                    	
                                    	if(showMax){
	                                        panelHTML +=                    "<div class=\"col-xs-12 column label label-primary LastValuePanelSmall\">";            
	                                        panelHTML +=                        "<div id=\""+chartTitle+"MaxValue\"><span class=\"lastValueSmall\">Maximum:<strong>"+maxValue +"</strong></span><span class=\"lastValueUnitsSmall\"><span>"+units+"</span><span class=\"lastValueTimeStringSmall\">"+maxValueTimeString+"</span>";
	                                        panelHTML +=                    "</div>";
                                    	}
                                    	if(showMin){
	                                        panelHTML +=                    "<div class=\"col-xs-12 column label label-primary LastValuePanelSmall\">";            
	                                        panelHTML +=                        "<div id=\""+chartTitle+"MinValue\"><span class=\"lastValueSmall\">Minimum:<strong>"+minValue +"</strong></span><span class=\"lastValueUnitsSmall\"><span>"+units+"</span><span class=\"lastValueTimeStringSmall\">"+minValueTimeString+"</span>";
	                                        panelHTML +=                    "</div>";
                                    	}
       
                                    	if(showAvg){
	                                        panelHTML +=                    "<div class=\"col-xs-12 column label label-primary LastValuePanelSmall\">";            
	                                        panelHTML +=                        "<div id=\""+chartTitle+"AvgValue\"><span class=\"lastValueSmall\">Minimum:<strong>"+avgValue +"</strong></span><span class=\"lastValueUnitsSmall\"><span>"+units+"</span>";
	                                        panelHTML +=                    "</div>";
                                    	}
                                    	
                                    	panelHTML +=                    "</div>";
                                    }
                                    
			                    }else{
                                    if(liveUpdate){
                                        panelHTML +=                     "<div class=\"col-xs-10 column\"> ";
                                        panelHTML +=                         "<div id=\"" +chartDivId + "\">";
                                        panelHTML +=                         "</div>";
                                        panelHTML +=                    "</div>";
                                        panelHTML +=                    "<div class=\"col-xs-2 column LastValuePanel\">";            
                                        panelHTML +=                        "<div id=\""+chartTitle+"LastValue\"><span class=\"lastValue\">"+rendLastValue +"</span><br><span class=\"lastValueUnits\"><span>"+units+"</span><br><span class=\"lastValueTimeString\"><span>"+lastValueDisplayString+"</span>";
                                        panelHTML +=                    "</div>";
                                    }else{
                                        panelHTML +=                     "<div class=\"col-xs-12 column\"> ";
                                        panelHTML +=                         "<div id=\"" +chartDivId + "\">";
                                        panelHTML +=                         "</div>";
                                        panelHTML +=                    "</div>";
                                    }
			                    	
			                    }
		                    	
		                    	
		                        
		                    }else if(visualizationStyle=="DataTable"){
		                        
		                        panelHTML += "<div class=\"col-xs-12 column\">";
		                        panelHTML += '<table class=\"table table-striped\">';
		                        panelHTML += "<thead class=\"thead-dark\">";
		                        panelHTML += "<tr><th>Time</th><th>Value</th></tr></thead>"
		                        var values = data.Value;
		                    
		                            $.each(values, function(i,item) {
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
		                        
		                        panelHTML += '</table></div>';
		                    }   
		                    
		                    
		                    
		                    
		                    
		                    
		                    
		                    
		                    panelHTML +=                   "</div>";
		                    panelHTML +=               "</div>";
		                    panelHTML +=           "</div>";
		                    panelHTML +=       "</div>";
		                    panelHTML +=   "</div>";
		                    panelHTML +="</div>";
		                    panelHTML +="</div>";
		                   
                           
		                    $("#SearchGraphArea").append(panelHTML);
		                    if(visualizationStyle=="LineGraph"){
		                        drawTimeSeriesLineChart(chartDivId,data, "");
		                       
		                    }

		                }
                        refreshCounter=30;
                        $("#RefreshCounter").html(refreshCounter);
                        $('#WaitingWheel').hide();
		               
		               
		            },
		            error: function(data){
		                $('#WaitingWheel').hide();
		                // console.log("error getting log file:" + JSON.stringify(data));
		                alert("Error getting log:" + JSON.stringify(data));
		                return false;
		            }
		        }); 


		    }
		}

    
	
	loadNewVisualizerData(){
		$('#WaitingText').html("Please Wait...");
        $('#WaitingWheel').show();
        $("#SearchConfigurator").hide();
        $('#Teleonome').empty();
        $('#Identity').empty();
        $.ajax({
            type: "GET",
            url: "/TeleonomeServlet",
            data: {formName:"GetRememberDeneWordList"},
            success: function (data) {
               // // console.log("data=" + JSON.stringify(data));
                $('#Identity').append($('<option>', {
                        value: "",
                        text : "Remember a DeneWord"
                    }));
                var number=  count(data);
                for(var i=0;i<number;i++){
                    var item = data["option" + (i+1)];
                    $('#Identity').append($('<option>', {
                        value: item.value,
                        text : item.text
                    }));
                }    
                $('#WaitingWheel').hide();
                // $.each(data, function (i, item) {
                //     $('#Identity').append($('<option>', {
                //         value: item.value,
                //         text : item.text
                //     }));
                // });
            },
            error: function(data){
                $('#WaitingWheel').hide();
                // console.log("error getting remembered denewords list:" + JSON.stringify(data));
                alert("Error getting list:" + JSON.stringify(data));
                return false;
            }
        });
    
        // $.ajax({
        //     type: "GET",
        //     url: "/TeleonomeServlet",
        //     data: {formName:"GetTeleonomeDateAvailable"},
        //     success: function (data) {
        //         $('#Teleonome').append($('<option>', {
        //                 value: "",
        //                 text : "Select A Teleonome1"
        //             }));
    
        //         $.each(data, function (i, item) {
        //             var textValue = item.Name;
        //             if(item.hasOwnProperty('TimeMin') && item.hasOwnProperty('TimeMax')){
        //             	var minDate =  new Date(Date.parse(item.TimeMin));
        //             	var maxDate =  new Date(Date.parse(item.TimeMax));
        //             	//// console.log("m=" +m);
        //                 //var minDate = convertUTCDateToLocalDate(min);
        //                 //var maxDate = convertUTCDateToLocalDate(max);
        //                 var screensize = document.documentElement.clientWidth;
        //                 if(screensize>500){
        
        //                 	textValue+=   " (From:" + getISOStringWithoutSecsAndMillisecs(minDate) + "    Until:" + getISOStringWithoutSecsAndMillisecs(maxDate)  + ")";
        //                 }else{
        //                 	textValue+=   " (" + getISOStringDateOnly(minDate) + "-" + getISOStringDateOnly(maxDate)  + ")";
        //                 }
                        
        //             }
        //             $('#Teleonome').append($('<option>', {
        //                 value: item.Name,
        //                 text : textValue
        //             }));
        //         });
        //     },
        //     error: function(data){
        //         // console.log("error getting TeleonomeNames:" + JSON.stringify(data));
        //         alert("Error getting list:" + JSON.stringify(data));
        //         return false;
        //     }
        // });
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
                    // console.log("error getting TeleonomeNames:" + JSON.stringify(data));
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
                    // console.log("error getting TeleonomeNames:" + JSON.stringify(data));
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
                    // console.log("error getting Denes:" + JSON.stringify(data));
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
                    // console.log("error getting Denes:" + JSON.stringify(data));
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