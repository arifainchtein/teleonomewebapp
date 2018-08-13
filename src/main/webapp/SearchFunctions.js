class SearchFunctions{
	
	refreshSearchPage(){
        if(!refreshCounterStatus){
            return false;
        }
    
        //var allGraphs = allSearchStorage();
        var allGraphs = localStorageManager.getAllStorageForComponent(localStorageSearchKey);
        if(allGraphs.length==0){
            console.log('no refresh since there are no visuzliaers');
            $("#RefreshCounter").html("");
            refreshCounter=0;
            return false;
        } 
       // location.reload();
       console.log("about to refresh");
      
        $("#EntryPoint").empty();
        
        $('#WaitingText').html("Updating...");
       $('#WaitingWheel').show();
    
       this.generateAllGraphs();
    
       
        
        $('#WaitingWheel').hide();
        refreshCounter=30;
        $("#RefreshCounter").html(refreshCounter);
        
    }
	
	 refreshCounterUpdate(){
	        if(!refreshCounterStatus){
	            $("#RefreshCounter").html("||");
	            $("#RefreshCounterMessage").html("Click to Start");
	            return false;
	        }
	        var allGraphs = localStorageManager.getAllStorageForComponent(localStorageSearchKey);
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
		    var allGraphs = localStorageManager.getAllStorageForComponent(localStorageSearchKey);

		    if(allGraphs.length>0){
		        //
		        // do it backwards to display the correct order
		        //
		       //for(var i=allGraphs.length-1;i>-1;i--){
		           var reqData=[];

		        for(var i=0;i<allGraphs.length;i++){
		            var graphData = JSON.parse(allGraphs[i]);
		            var visualizationStyle = graphData.visualizationStyle;
		            var identityPointer = graphData.identityPointer;
		            var fromMillis = graphData.fromMillis;
		            var untilMillis = graphData.untilMillis;
		            var formName=graphData.formName;
		            var appendChart = graphData.appendChart;
		            var chartTitle = graphData.chartTitle;
		            var liveUpdate = graphData.liveUpdate;
		            console.log("graphData.chartTitle="+ graphData.chartTitle + " position=" + graphData.position);
		            if(liveUpdate){ 
		               // if its live udpdate, ignore the times stored and set tthe to be the last 24 hour    
		                var fromDate = new Date();
		                fromDate.setDate(fromDate.getDate()-1);
		                fromMillis = fromDate.getTime();
		                untilMillis = new Date().getTime();
		            }
		            $("#AppendChart").prop('checked', appendChart);
		            $("#LiveUpdate").prop('checked', liveUpdate);
		          
		            var serverRequest = {};
		            serverRequest.identity=identityPointer;
		            serverRequest.from=fromMillis;
		            serverRequest.until=untilMillis;
		            serverRequest.formName=formName;
		            serverRequest.chartTitle=chartTitle;
		            reqData[i]=serverRequest;
		        }

		        var dataToSend = JSON.stringify(reqData);
		        $.ajax({
		            type: "GET",
		            url: "/TeleonomeServlet",
		            data: {formName:"RefreshCurrentView", data:dataToSend},
		            success: function (dataString) {
		                console.log("receiving data for refresh" );
		               // if(!appendChart){
		                    $("#EntryPoint").empty();
		                //} 
		                var allData = JSON.parse(dataString);
		                var panelHTML="";
		                for(var j=0;j<allData.length;j++){
		                    var data = allData[j];
		                    var chartTitle = data.chartTitle;
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
		                    panelHTML = "<div class=\"row\">";  
		                    panelHTML += "<div class=\"col-lg-12\">";   
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
		}
	
	
	loadNewVisualizerData(){
		$('#WaitingText').html("Please Wait...");
        $('#WaitingWheel').show();
        $("#SearchConfigurator").hide();
        $.ajax({
            type: "GET",
            url: "/TeleonomeServlet",
            data: {formName:"GetRememberDeneWordList"},
            success: function (data) {
               // console.log("data=" + JSON.stringify(data));
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
                // $.each(data, function (i, item) {
                //     $('#Identity').append($('<option>', {
                //         value: item.value,
                //         text : item.text
                //     }));
                // });
            },
            error: function(data){
                console.log("error getting remembered denewords list:" + JSON.stringify(data));
                alert("Error getting list:" + JSON.stringify(data));
                return false;
            }
        });
    
        $.ajax({
            type: "GET",
            url: "/TeleonomeServlet",
            data: {formName:"GetTeleonomeDateAvailable"},
            success: function (data) {
                $('#Teleonome').append($('<option>', {
                        value: "",
                        text : "Select A Teleonome"
                    }));
    
                $.each(data, function (i, item) {
                    var textValue = item.Name;
                    if(item.hasOwnProperty('TimeMin') && item.hasOwnProperty('TimeMax')){
                        var minDate = convertUTCDateToLocalDate(new Date(item.TimeMin));
                        var maxDate = convertUTCDateToLocalDate(new Date(item.TimeMax));
                        textValue+=   " (From:" + getISOStringWithoutSecsAndMillisecs(minDate) + "    Until:" + getISOStringWithoutSecsAndMillisecs(maxDate)  + ")";
                    }
                    $('#Teleonome').append($('<option>', {
                        value: item.Name,
                        text : textValue
                    }));
                });
            },
            error: function(data){
                console.log("error getting TeleonomeNames:" + JSON.stringify(data));
                alert("Error getting list:" + JSON.stringify(data));
                return false;
            }
        });
	}
}