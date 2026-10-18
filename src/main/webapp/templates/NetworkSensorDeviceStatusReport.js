// Device list for whitelist cleanup, phone first (rewritten 2026-10-18 for Cleotilde).
// One card per device, laid out as a deck (a grid that fills the width, one column on a phone):
// known present devices first, then unknown ones (with a checkbox for "Add selected"),
// then the ones not seen in the last scan, collapsed (every device seen in the last 30 days, with
// when it was last here and a Forget button that deletes its history).
// IPs of present devices link to http://<ip>, in case the device has a web page.
// Vendor / Connection / Private MAC come from CleotildeMicroController; older Network
// Inspector denomes don't have them and the cards just leave them out.
// The selection lives in whiteListSelection (index.html) so it survives the re-render
// every pulse. Device names come from the devices themselves (DHCP hostnames), so
// everything is escaped before it goes into the HTML.
class NetworkSensorDeviceStatusReport{

	constructor(){
	}

	escape(s){
		return String(s === undefined || s === null ? "" : s)
			.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
	}

	// names saved before the framework stripped the router's ".lan" domain still carry it;
	// only the display drops it, data-name keeps the stored name so Add/Remove still match
	displayName(name){
		return String(name === undefined || name === null ? "" : name).replace(/\.lan$/i, "");
	}

	teleonomeAt(ip, organismIPInfoJsonData){
		for(var name in organismIPInfoJsonData){
			if(ip !== "" && organismIPInfoJsonData[name] == ip) return name;
		}
		return "";
	}

	// "First Seen" / "Last Seen" (millis) from CleotildeMicroController's device history
	seen(millis){
		var d = new Date(millis);
		var pad = function(n){ return (n < 10 ? "0" : "") + n; };
		var when = pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
		var minutes = Math.round((Date.now() - millis) / 60000);
		var ago = minutes < 60 ? minutes + " min ago" : (minutes < 2880 ? Math.round(minutes / 60) + " h ago" : Math.round(minutes / 1440) + " days ago");
		return ago + " (" + when + ")";
	}

	deck(){
		return "<div style=\"display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin-bottom:14px\">";
	}

	card(device, organismIPInfoJsonData, selectable){
		var name = device[DEVICE_NAME];
		var mac = device[MAC_ADDRESS] || "";
		var ip = device[IP_ADDRESS] || "";
		var known = device[WHITE_LIST_STATUS];
		var present = device[IS_DEVICE_PRESENT];
		var details = [];
		if(device["Vendor"]) details.push(this.escape(device["Vendor"]));
		// "sweep only": found by the Pi's ARP sweep, the router has no trace of it
		if(device["Connection"] == "sweep only") details.push("<span class=\"label label-danger\" title=\"Found by Cleotilde's sweep; the router can't see it\">sweep only</span>");
		else if(device["Connection"]) details.push(this.escape(device["Connection"]));
		if(ip && present) details.push("<a href=\"http://" + this.escape(ip) + "\" target=\"_blank\">" + this.escape(ip) + "</a>");
		else if(ip) details.push(this.escape(ip));
		var teleonome = this.teleonomeAt(ip, organismIPInfoJsonData);

		var border = known ? "#4caf50" : (present ? "#f9a825" : "#bbb");
		var html = "<div class=\"wl-card\" style=\"border-left:8px solid " + border + ";background:#fff;border-radius:6px;"
			+ "box-shadow:0 1px 3px rgba(0,0,0,.2);padding:12px 14px\">";
		html += "<div style=\"display:flex;align-items:center;gap:12px\">";
		if(selectable && mac){
			var checked = whiteListSelection[mac] ? " checked" : "";
			html += "<input type=\"checkbox\" class=\"wlSelect\" style=\"width:26px;height:26px;flex:none\""
				+ " data-name=\"" + this.escape(name) + "\" data-mac=\"" + this.escape(mac) + "\"" + checked + ">";
		}
		html += "<div style=\"flex:1;min-width:0\">";
		html += "<div style=\"font-size:21px;font-weight:bold;overflow-wrap:anywhere\">" + this.escape(this.displayName(name));
		if(teleonome) html += " <a href=\"http://" + this.escape(teleonome) + ".local\" target=\"_new\" class=\"label label-info\""
			+ " style=\"font-size:15px;vertical-align:middle\">" + this.escape(teleonome) + "</a>";
		html += "</div>";
		if(details.length > 0) html += "<div style=\"color:#555;font-size:17px\">" + details.join(" &middot; ") + "</div>";
		if(mac && mac !== name) html += "<div style=\"color:#888;font-size:15px;font-family:monospace\">" + this.escape(mac) + "</div>";
		if(!present && device["Last Seen"]) html += "<div style=\"color:#555;font-size:16px\">Last seen " + this.seen(device["Last Seen"]) + "</div>";
		else if(present && device["First Seen"]) html += "<div style=\"color:#888;font-size:15px\">First seen " + this.seen(device["First Seen"]) + "</div>";
		html += "</div>";

		var data = " data-name=\"" + this.escape(name) + "\" data-mac=\"" + this.escape(mac) + "\"";
		html += "<div style=\"display:flex;flex-direction:column;gap:6px;flex:none\">";
		if(known){
			html += "<a href=\"#\" class=\"btn btn-danger wlRemoveBtn\" style=\"flex:none\"" + data + ">"
				+ "<span class=\"glyphicon glyphicon-minus-sign\"></span> Remove</a>";
		}else if(mac){
			html += "<a href=\"#\" class=\"btn btn-success wlAddBtn\" style=\"flex:none\"" + data + ">"
				+ "<span class=\"glyphicon glyphicon-plus-sign\"></span> Add</a>";
		}
		if(!present){
			html += "<a href=\"#\" class=\"btn btn-default wlForgetBtn\" style=\"flex:none\"" + data + ">"
				+ "<span class=\"glyphicon glyphicon-trash\"></span> Forget</a>";
		}
		html += "</div></div></div>";
		return html;
	}

	process(organismIPInfoJsonData){
		var networkStatusSampleTimeStringPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_SENSOR_DATA + ":" + DENE_NETWORK_SENSOR_STATUS + ":" + NETWORK_SCAN_TIME_STRING;
		var scanTimeString = getDeneWordByIdentityPointer(networkStatusSampleTimeStringPointer, DENEWORD_VALUE_ATTRIBUTE);

		var deviceListPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_SENSOR_DATA + ":" + DENE_NETWORK_SENSOR_STATUS + ":" + DEVICE_LIST;
		var deviceList = JSON.parse(getDeneWordByIdentityPointer(deviceListPointer, DENEWORD_VALUE_ATTRIBUTE));

		var unknown = [], known = [], gone = [];
		for(var i = 0; i < deviceList.length; i++){
			var d = deviceList[i];
			if(!d[IS_DEVICE_PRESENT]) gone.push(d);
			else if(d[WHITE_LIST_STATUS]) known.push(d);
			else unknown.push(d);
		}
		var self = this;
		var byName = function(a, b){ return self.displayName(a[DEVICE_NAME]).localeCompare(self.displayName(b[DEVICE_NAME])); };
		unknown.sort(byName); known.sort(byName);
		gone.sort(function(a, b){ return (b["Last Seen"] || 0) - (a["Last Seen"] || 0); });

		// forget selections for devices that are no longer unknown (added, or gone)
		var stillUnknown = {};
		for(var u = 0; u < unknown.length; u++) stillUnknown[unknown[u][MAC_ADDRESS]] = true;
		for(var m in whiteListSelection){ if(!stillUnknown[m]) delete whiteListSelection[m]; }
		var selectedCount = Object.keys(whiteListSelection).length;

		var html = "<div class=\"col-lg-12\">";
		html += "<div class=\"well well-sm\"><h3 style=\"margin:0 0 6px\">Devices</h3>";
		html += "<div style=\"font-size:17px\">Scan " + this.escape(scanTimeString) + "</div>";
		html += "<div style=\"font-size:18px;margin-top:4px\"><span class=\"label label-success\">" + known.length + " known</span> "
			+ "<span class=\"label label-warning\">" + unknown.length + " unknown</span> "
			+ "<span class=\"label label-default\">" + gone.length + " not seen</span></div></div>";

		html += "<h4 style=\"color:#2e7d32\">Known (" + known.length + ")</h4>";
		html += this.deck();
		for(var k = 0; k < known.length; k++) html += this.card(known[k], organismIPInfoJsonData, false);
		html += "</div>";

		if(unknown.length > 0){
			html += "<h4 style=\"color:#b26a00\">Unknown (" + unknown.length + ")</h4>";
			html += "<div style=\"display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px\">";
			html += "<a href=\"#\" class=\"btn btn-success wlAddSelectedBtn\"" + (selectedCount == 0 ? " disabled" : "") + ">"
				+ "<span class=\"glyphicon glyphicon-ok\"></span> Add selected (<span id=\"wlSelectedCount\">" + selectedCount + "</span>)</a>";
			html += "<a href=\"#\" class=\"btn btn-default wlSelectAllBtn\">Select all</a>";
			html += "<a href=\"#\" class=\"btn btn-default wlSelectNoneBtn\">Clear</a>";
			html += "</div>";
			html += this.deck();
			for(var a = 0; a < unknown.length; a++) html += this.card(unknown[a], organismIPInfoJsonData, true);
			html += "</div>";
		}

		if(gone.length > 0){
			html += "<details style=\"margin-top:10px\"><summary style=\"cursor:pointer;font-size:18px;font-weight:bold;color:#777\">"
				+ "Not seen now (" + gone.length + ")</summary><div style=\"margin-top:8px\">";
			html += this.deck();
			for(var g = 0; g < gone.length; g++) html += this.card(gone[g], organismIPInfoJsonData, false);
			html += "</div></div></details>";
		}
		html += "</div>";
		return html;
	}
}
