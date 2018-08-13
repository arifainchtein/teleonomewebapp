function count(obj) { return Object.keys(obj).length; }

function CopyToClipboard(containerid) {
	if (document.selection) { 
	    var range = document.body.createTextRange();
	    range.moveToElementText(document.getElementById(containerid));
	    range.select().createTextRange();
	    document.execCommand("copy"); 	
	} else if (window.getSelection) {
	    var range = document.createRange();
        range.selectNode(document.getElementById(containerid));
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);	
	    document.execCommand("copy");
	    alert("Data copied to clipboard") 
	}
}

function generateAllGraphs(){
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
function getISOStringWithoutSecsAndMillisecs(date) {
	  const dateAndTime = date.toISOString().split('T')
	  const time = dateAndTime[1].split(':')
	  
	  return dateAndTime[0]+' '+time[0]+':'+time[1]
	}

function convertUTCDateToLocalDate(date) {
    var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);
    var offset = date.getTimezoneOffset() / 60;
    var hours = date.getHours();
    newDate.setHours(hours - offset);
    return newDate;   
    //return date;
}

function msToTime(duration) {
	var milliseconds = parseInt((duration%1000)/100)
	, seconds = parseInt((duration/1000)%60)
	, minutes = parseInt((duration/(1000*60))%60)
	, hours = parseInt((duration/(1000*60*60))%24);

	hours = (hours < 10) ? "0" + hours : hours;
	minutes = (minutes < 10) ? "0" + minutes : minutes;
	seconds = (seconds < 10) ? "0" + seconds : seconds;

	return hours + ":" + minutes + ":" + seconds ;
}


var HashMap = function(){
	this._size = 0;
	this._map = {};
}


HashMap.prototype = {
		put: function(key, value){
			if(!this.containsKey(key)){
				this._size++;
			}
			this._map[key] = value;
		},

		remove:function(key){
			if(this.containsKey(key)){
				this._size--;
				var value = this._map[key];
				delete this._map[key];
				return value;
			}
			else{
				return null;
			}
		},

		containsKey: function(key){
			return this._map.hasOwnProperty(key);
		},

		containsValue: function(value){
			for(var key in this._map){
				if(this._map.hasOwnProperty(key)){
					if(this._map[key] === value){
						return true;
					}
				}
			}
			return false;
		},

		get: function(key){
			return this.containsKey(key) ? this._map[key] : null;
		},

		clear: function(key){
			this.size = 0;
			this._map= {};
		},

		keys: function(){
			var keys = [];
			for(var keys in this._map){
				if(this._map.hasOwnProperty(key)){
					keys.push(key);
				}
			}
			return keys;
		},

		values: function(){
			var values=[];
			for(var key in this._map){
				if(this._map.hasOwnProperty(key)){
					values.push(this._map[key]);
				}
			}
		},

		size: function(){
			return this._size;
		}
};

function sortHashMap(o) {
	var sorted = {},
	key, a = [];

	for (key in o) {
		if (o.hasOwnProperty(key)) {
			a.push(key);
		}
	}

	a.sort();

	for (key = 0; key < a.length; key++) {
		sorted[a[key]] = o[a[key]];
	}
	return sorted;
}
