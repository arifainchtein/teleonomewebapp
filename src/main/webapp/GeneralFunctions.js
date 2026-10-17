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

function getISOStringDateOnly(date) {
//	  const dateAndTime = date.toISOString().split('T');
//	  const time = dateAndTime[1].split(':');
	//const dateAndTime = date..split(' ');
	var currentDateAsString = date.getFullYear() + "/" + (date.getMonth()+1) + "/"  + date.getDate();
    
	  return currentDateAsString;
	}

function getISOStringWithoutSecsAndMillisecs(date) {
	var newDate = convertUTCDateToLocalDate(date) ;
	  const dateAndTime = newDate.toISOString().split('T');
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

//
// Contextual colour for a panel value (added 2026-10-17 for Cleotilde). A panel dene may carry
// these optional denewords; with none of them nothing changes:
//   "Rule Source Pointer"          value to test (default: the dene's Panel Data Source Pointer)
//   "Warning Above", "Warning Below", "Alarm Above", "Alarm Below"   numeric thresholds
//   "Warning If", "Alarm If"       exact value, e.g. false or none
// Returns "danger", "warning" or "" - the suffixes of the panel-heading-* classes in index.html.
//
function panelRuleLevel(dene){
	var sourcePointer = deneHasDeneWordProperty(dene, "Rule Source Pointer")
		? getDeneWordAttributeByDeneWordNameFromDene(dene, "Rule Source Pointer", DENEWORD_VALUE_ATTRIBUTE)
		: getDeneWordAttributeByDeneWordTypeFromDene(dene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER, DENEWORD_VALUE_ATTRIBUTE);
	if(sourcePointer===undefined || sourcePointer===null) return "";
	var value = getDeneWordByIdentityPointer(sourcePointer, DENEWORD_VALUE_ATTRIBUTE);
	if(value===undefined || value===null) return "";
	var rule = function(name){
		return deneHasDeneWordProperty(dene, name) ? getDeneWordAttributeByDeneWordNameFromDene(dene, name, DENEWORD_VALUE_ATTRIBUTE) : undefined;
	};
	var number = parseFloat(value);
	var test = function(prefix){
		var above = rule(prefix + " Above"), below = rule(prefix + " Below"), equals = rule(prefix + " If");
		if(equals!==undefined && String(value)===String(equals)) return true;
		if(!isNaN(number) && above!==undefined && number > parseFloat(above)) return true;
		if(!isNaN(number) && below!==undefined && number < parseFloat(below)) return true;
		return false;
	};
	if(test("Alarm")) return "danger";
	if(test("Warning")) return "warning";
	return "";
}

// The worst level of several rule denes (e.g. all the denes of a Well panel's chain).
function worstPanelLevel(denes){
	var worst = "";
	for(var i=0;i<denes.length;i++){
		var level = panelRuleLevel(denes[i]);
		if(level==="danger") return "danger";
		if(level==="warning") worst = "warning";
	}
	return worst;
}
