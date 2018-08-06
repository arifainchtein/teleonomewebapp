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
