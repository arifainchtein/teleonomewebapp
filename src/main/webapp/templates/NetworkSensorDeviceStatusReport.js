// Device list for whitelist cleanup, phone first (rewritten 2026-10-18 for Cleotilde).
// One card per device: unknown present devices first (with a checkbox for "Add selected"),
// then known present devices, then the ones not seen in the last scan, collapsed.
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

	teleonomeAt(ip, organismIPInfoJsonData){
		for(var name in organismIPInfoJsonData){
			if(ip !== "" && organismIPInfoJsonData[name] == ip) return name;
		}
		return "";
	}

	card(device, organismIPInfoJsonData, selectable){
		var name = device[DEVICE_NAME];
		var mac = device[MAC_ADDRESS] || "";
		var ip = device[IP_ADDRESS] || "";
		var known = device[WHITE_LIST_STATUS];
		var present = device[IS_DEVICE_PRESENT];
		var details = [];
		if(device["Vendor"]) details.push(this.escape(device["Vendor"]));
		if(device["Connection"]) details.push(this.escape(device["Connection"]));
		if(ip) details.push(this.escape(ip));
		var teleonome = this.teleonomeAt(ip, organismIPInfoJsonData);

		var border = known ? "#4caf50" : (present ? "#f9a825" : "#bbb");
		var html = "<div class=\"wl-card\" style=\"border-left:6px solid " + border + ";background:#fff;border-radius:4px;"
			+ "box-shadow:0 1px 2px rgba(0,0,0,.15);padding:10px 12px;margin-bottom:8px\">";
		html += "<div style=\"display:flex;align-items:center;gap:10px\">";
		if(selectable && mac){
			var checked = whiteListSelection[mac] ? " checked" : "";
			html += "<input type=\"checkbox\" class=\"wlSelect\" style=\"width:22px;height:22px;flex:none\""
				+ " data-name=\"" + this.escape(name) + "\" data-mac=\"" + this.escape(mac) + "\"" + checked + ">";
		}
		html += "<div style=\"flex:1;min-width:0\">";
		html += "<div style=\"font-size:16px;font-weight:bold;overflow-wrap:anywhere\">" + this.escape(name);
		if(teleonome) html += " <a href=\"http://" + this.escape(teleonome) + ".local\" target=\"_new\" class=\"label label-info\">" + this.escape(teleonome) + "</a>";
		html += "</div>";
		if(details.length > 0) html += "<div style=\"color:#555;font-size:13px\">" + details.join(" &middot; ") + "</div>";
		if(mac && mac !== name) html += "<div style=\"color:#999;font-size:12px;font-family:monospace\">" + this.escape(mac) + "</div>";
		html += "</div>";

		var data = " data-name=\"" + this.escape(name) + "\" data-mac=\"" + this.escape(mac) + "\"";
		if(known){
			html += "<a href=\"#\" class=\"btn btn-danger btn-sm wlRemoveBtn\" style=\"flex:none\"" + data + ">"
				+ "<span class=\"glyphicon glyphicon-minus-sign\"></span> Remove</a>";
		}else if(mac){
			html += "<a href=\"#\" class=\"btn btn-success btn-sm wlAddBtn\" style=\"flex:none\"" + data + ">"
				+ "<span class=\"glyphicon glyphicon-plus-sign\"></span> Add</a>";
		}
		html += "</div></div>";
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
		var byName = function(a, b){ return String(a[DEVICE_NAME]).localeCompare(String(b[DEVICE_NAME])); };
		unknown.sort(byName); known.sort(byName); gone.sort(byName);

		// forget selections for devices that are no longer unknown (added, or gone)
		var stillUnknown = {};
		for(var u = 0; u < unknown.length; u++) stillUnknown[unknown[u][MAC_ADDRESS]] = true;
		for(var m in whiteListSelection){ if(!stillUnknown[m]) delete whiteListSelection[m]; }
		var selectedCount = Object.keys(whiteListSelection).length;

		var html = "<div class=\"col-lg-12\">";
		html += "<div class=\"well well-sm\"><h4 style=\"margin:0 0 4px\">Devices</h4>";
		html += "<div>Scan " + this.escape(scanTimeString) + "</div>";
		html += "<div><span class=\"label label-warning\">" + unknown.length + " unknown</span> "
			+ "<span class=\"label label-success\">" + known.length + " known</span> "
			+ "<span class=\"label label-default\">" + gone.length + " not seen</span></div></div>";

		if(unknown.length > 0){
			html += "<div style=\"display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px\">";
			html += "<a href=\"#\" class=\"btn btn-success wlAddSelectedBtn\"" + (selectedCount == 0 ? " disabled" : "") + ">"
				+ "<span class=\"glyphicon glyphicon-ok\"></span> Add selected (<span id=\"wlSelectedCount\">" + selectedCount + "</span>)</a>";
			html += "<a href=\"#\" class=\"btn btn-default wlSelectAllBtn\">Select all</a>";
			html += "<a href=\"#\" class=\"btn btn-default wlSelectNoneBtn\">Clear</a>";
			html += "</div>";
			html += "<h5 style=\"color:#b26a00\">Unknown (" + unknown.length + ")</h5>";
			for(var a = 0; a < unknown.length; a++) html += this.card(unknown[a], organismIPInfoJsonData, true);
		}

		html += "<h5 style=\"color:#2e7d32\">Known (" + known.length + ")</h5>";
		for(var k = 0; k < known.length; k++) html += this.card(known[k], organismIPInfoJsonData, false);

		if(gone.length > 0){
			html += "<details style=\"margin-top:10px\"><summary style=\"cursor:pointer;font-weight:bold;color:#777\">"
				+ "Not seen in the last scan (" + gone.length + ")</summary><div style=\"margin-top:8px\">";
			for(var g = 0; g < gone.length; g++) html += this.card(gone[g], organismIPInfoJsonData, false);
			html += "</div></details>";
		}
		html += "</div>";
		return html;
	}
}
