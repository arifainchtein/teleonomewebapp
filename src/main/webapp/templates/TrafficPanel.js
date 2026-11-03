//
// Cleotilde's Traffic panel (added 2026-11-04; design: OpenWrtOne/documents/05-teleonome-design.md, section 7c).
// Who talks to where: per device bytes up/down, destinations with domain and country, DNS lookups, and the
// Suspicious Events the traffic rules raised, with Allow to silence known-good traffic.
// Data: GetTraffic (TrafficStore tables filled by TrafficWatcher); Allow / Remove: AllowTraffic.
// The page is redrawn every pulse, so the state lives in these globals and a 60 s timer refreshes it.
//
var trafficData = null;
var trafficDays = 1;
var trafficOpenMac = null;
var trafficDeviceData = null;
var trafficTimer = null;
var TRAFFIC_WATCHLIST = ["CN", "RU", "KP", "IR"];

class TrafficPanel {

	constructor() {
	}

	process() {
		var h = "<div class=\"col-lg-12\"><div class=\"bs-component\"><div class=\"panel panel-default\">";
		h += "<div class=\"panel-heading\"><h4><i class=\"glyphicon glyphicon-transfer\"></i> Traffic"
			+ "<span class=\"pull-right\">" + trafficPeriodButtons() + "</span></h4></div>";
		h += "<div class=\"panel-body\" id=\"TrafficPanelBody\">" + trafficBodyHTML() + "</div>";
		h += "</div></div></div>";
		if (trafficTimer == null) trafficTimer = setInterval(trafficRefresh, 60000);
		setTimeout(trafficRefresh, 0);
		return h;
	}
}

function trafficPeriodButtons() {
	var b = "";
	[[1, "Today"], [7, "7 days"], [30, "30 days"]].forEach(function (p) {
		b += " <button class=\"btn btn-xs " + (trafficDays == p[0] ? "btn-primary" : "btn-default") + "\" onclick=\"trafficSetDays(" + p[0] + ");return false;\">" + p[1] + "</button>";
	});
	return b;
}

function trafficSetDays(d) {
	trafficDays = d;
	trafficData = null;
	trafficDeviceData = null;
	$('#TrafficPanelBody').html(trafficBodyHTML());
	$('#TrafficPanelBody').closest('.panel').find('.panel-heading .pull-right').html(trafficPeriodButtons());
	trafficRefresh();
}

function trafficEscape(s) {
	return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function trafficBytes(b) {
	if (b == null) return "";
	if (b >= 1073741824) return (b / 1073741824).toFixed(2) + " GB";
	if (b >= 1048576) return (b / 1048576).toFixed(1) + " MB";
	if (b >= 1024) return Math.round(b / 1024) + " KB";
	return b + " B";
}

function trafficCountry(cc) {
	if (!cc) return "";
	var watch = TRAFFIC_WATCHLIST.indexOf(cc) >= 0;
	return "<span class=\"label " + (watch ? "label-danger" : "label-default") + "\">" + trafficEscape(cc) + "</span>";
}

function trafficTime(ms) {
	var d = new Date(ms);
	return trafficDays == 1 && d.toDateString() == new Date().toDateString() ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : d.toLocaleString();
}

function trafficBodyHTML() {
	if (trafficData == null) return "<p class=\"text-muted\">Loading...</p>";
	var h = "";
	var devices = trafficData.Devices || [];
	var up = 0, down = 0;
	devices.forEach(function (d) { up += d.Up; down += d.Down; });
	h += "<p><b>" + trafficBytes(up) + "</b> up, <b>" + trafficBytes(down) + "</b> down, " + devices.length + " devices";
	var countries = trafficData.Countries || {};
	var cc = Object.keys(countries);
	if (cc.length > 0) {
		h += " &middot; ";
		cc.slice(0, 12).forEach(function (c) {
			h += trafficCountry(c == "?" ? "" : c) + (c == "?" ? "<span class=\"label label-default\">?</span>" : "") + " <small>" + trafficBytes(countries[c].Up + countries[c].Down) + "</small> ";
		});
	}
	h += "</p>";
	h += trafficChart(trafficData.Hours || []);
	h += trafficEventsHTML(trafficData.Events || []);
	h += trafficDevicesHTML(devices);
	h += trafficDomainsHTML(trafficData.TopDomains || [], "Most looked-up domains (all devices)");
	h += trafficAllowlistHTML(trafficData.Allowlist || []);
	return h;
}

// up (orange) and down (blue) per hour, as one small inline SVG
function trafficChart(hours) {
	if (hours.length == 0) return "<p class=\"text-muted\">No traffic recorded yet. Is the router helper installed?</p>";
	var max = 1;
	hours.forEach(function (r) { max = Math.max(max, r[1], r[2]); });
	var w = 900, hgt = 90, n = hours.length, bw = Math.max(1, w / n);
	var s = "<svg viewBox=\"0 0 " + w + " " + (hgt + 14) + "\" preserveAspectRatio=\"none\" style=\"width:100%;height:110px\">";
	hours.forEach(function (r, i) {
		var x = i * bw;
		var hd = r[2] / max * hgt, hu = r[1] / max * hgt;
		s += "<rect x=\"" + x + "\" y=\"" + (hgt - hd) + "\" width=\"" + Math.max(1, bw * 0.45) + "\" height=\"" + hd + "\" fill=\"#3a87ad\"><title>"
			+ new Date(r[0]).toLocaleString() + " down " + trafficBytes(r[2]) + "</title></rect>";
		s += "<rect x=\"" + (x + bw * 0.5) + "\" y=\"" + (hgt - hu) + "\" width=\"" + Math.max(1, bw * 0.45) + "\" height=\"" + hu + "\" fill=\"#f89406\"><title>"
			+ new Date(r[0]).toLocaleString() + " up " + trafficBytes(r[1]) + "</title></rect>";
	});
	s += "<text x=\"0\" y=\"" + (hgt + 12) + "\" font-size=\"11\" fill=\"#999\">" + new Date(hours[0][0]).toLocaleString() + "</text>";
	s += "<text x=\"" + w + "\" y=\"" + (hgt + 12) + "\" font-size=\"11\" fill=\"#999\" text-anchor=\"end\">peak " + trafficBytes(max) + "/h &middot; blue down, orange up</text>";
	return s + "</svg>";
}

function trafficEventsHTML(events) {
	var h = "<h5 style=\"padding-top:10px\">Suspicious events (last " + Math.max(7, trafficDays) + " days)</h5>";
	if (events.length == 0) return h + "<p class=\"text-muted\">None.</p>";
	h += "<table class=\"table table-condensed\"><tr><th>When</th><th>Rule</th><th>What</th><th></th></tr>";
	events.slice(0, 30).forEach(function (e, i) {
		h += "<tr><td style=\"white-space:nowrap\">" + new Date(e.Time).toLocaleString() + "</td><td><span class=\"label label-danger\">" + trafficEscape(e.Rule)
			+ "</span></td><td>" + trafficEscape(e.Detail) + "</td><td><button class=\"btn btn-xs btn-default\" title=\"Stop alerting about this\" onclick=\"trafficAllowEvent(" + i + ");return false;\">Allow</button></td></tr>";
	});
	return h + "</table>";
}

function trafficDevicesHTML(devices) {
	var h = "<h5 style=\"padding-top:10px\">Devices</h5>";
	if (devices.length == 0) return h + "<p class=\"text-muted\">None yet.</p>";
	h += "<table class=\"table table-condensed table-hover\"><tr><th>Device</th><th class=\"text-right\">Up</th><th class=\"text-right\">Down</th><th class=\"text-right\">Destinations</th><th>Countries</th><th>Last</th></tr>";
	devices.forEach(function (d) {
		var open = trafficOpenMac == d.Mac;
		var cs = "";
		Object.keys(d.Countries || {}).slice(0, 6).forEach(function (c) { cs += trafficCountry(c) + " "; });
		h += "<tr style=\"cursor:pointer\" onclick=\"trafficToggleDevice('" + trafficEscape(d.Mac) + "')\"><td><i class=\"glyphicon glyphicon-chevron-" + (open ? "down" : "right") + "\"></i> "
			+ trafficEscape(d.Device) + " <small class=\"text-muted\">" + trafficEscape(d.Mac) + "</small></td><td class=\"text-right\">" + trafficBytes(d.Up) + "</td><td class=\"text-right\">"
			+ trafficBytes(d.Down) + "</td><td class=\"text-right\">" + d.Destinations + "</td><td>" + cs + "</td><td>" + trafficTime(d.Last) + "</td></tr>";
		if (open) h += "<tr><td colspan=\"6\" style=\"background:#fafafa\">" + trafficDeviceHTML() + "</td></tr>";
	});
	return h + "</table>";
}

function trafficDeviceHTML() {
	if (trafficDeviceData == null || trafficDeviceData.Mac != trafficOpenMac) return "<p class=\"text-muted\">Loading...</p>";
	var h = trafficChart(trafficDeviceData.Hours || []);
	var dest = trafficDeviceData.Destinations || [];
	h += "<b>Where it talks to</b>";
	if (dest.length == 0) {
		h += "<p class=\"text-muted\">Nothing.</p>";
	} else {
		h += "<table class=\"table table-condensed\"><tr><th>Domain</th><th>IP:port</th><th>Country</th><th class=\"text-right\">Up</th><th class=\"text-right\">Down</th><th class=\"text-right\">Conns</th><th>Last</th></tr>";
		dest.forEach(function (x) {
			h += "<tr><td>" + trafficEscape(x.Domain) + "</td><td>" + trafficEscape(x.IP) + ":" + x.Port + " <small class=\"text-muted\">" + trafficEscape(x.Proto) + "</small></td><td>"
				+ trafficCountry(x.Country) + "</td><td class=\"text-right\">" + trafficBytes(x.Up) + "</td><td class=\"text-right\">" + trafficBytes(x.Down)
				+ "</td><td class=\"text-right\">" + x.Connections + "</td><td>" + trafficTime(x.Last) + "</td></tr>";
		});
		h += "</table>";
	}
	h += trafficDomainsHTML(trafficDeviceData.Domains || [], "What it looked up");
	return h;
}

function trafficDomainsHTML(domains, title) {
	var h = "<h5 style=\"padding-top:10px\">" + title + "</h5>";
	if (domains.length == 0) return h + "<p class=\"text-muted\">None.</p>";
	h += "<table class=\"table table-condensed\"><tr><th>Domain</th><th class=\"text-right\">Lookups</th><th>Devices</th><th>Last</th></tr>";
	domains.forEach(function (d) {
		h += "<tr><td>" + trafficEscape(d.Domain) + "</td><td class=\"text-right\">" + d.Queries + "</td><td>"
			+ (d.Devices > 1 ? d.Devices + " devices" : trafficEscape(d.Device)) + "</td><td>" + trafficTime(d.Last) + "</td></tr>";
	});
	return h + "</table>";
}

function trafficAllowlistHTML(list) {
	var h = "<h5 style=\"padding-top:10px\">Allowed (no alerts)</h5>";
	if (list.length == 0) return h + "<p class=\"text-muted\">Nothing yet. Use Allow on an event.</p>";
	h += "<table class=\"table table-condensed\"><tr><th>Device</th><th>Rule</th><th>Country</th><th>Domain</th><th></th></tr>";
	list.forEach(function (a, i) {
		h += "<tr><td>" + trafficEscape(a.Mac || "any") + "</td><td>" + trafficEscape(a.Rule || "any") + "</td><td>" + trafficEscape(a.Country || "any")
			+ "</td><td>" + trafficEscape(a.Domain || "any") + "</td><td><button class=\"btn btn-xs btn-default\" onclick=\"trafficRemoveAllow(" + i + ");return false;\">Remove</button></td></tr>";
	});
	return h + "</table>";
}

function trafficToggleDevice(mac) {
	trafficOpenMac = trafficOpenMac == mac ? null : mac;
	$('#TrafficPanelBody').html(trafficBodyHTML());
	if (trafficOpenMac != null) trafficRefreshDevice();
}

function trafficRefresh() {
	if ($('#TrafficPanelBody').length == 0) return;	// another page is on screen
	$.ajax({
		type: "GET",
		url: "/TeleonomeServlet",
		data: { formName: "GetTraffic", View: "overview", Days: trafficDays },
		dataType: "json",
		success: function (data) {
			trafficData = data;
			$('#TrafficPanelBody').html(trafficBodyHTML());
			if (trafficOpenMac != null) trafficRefreshDevice();
		}
	});
}

function trafficRefreshDevice() {
	var mac = trafficOpenMac;
	$.ajax({
		type: "GET",
		url: "/TeleonomeServlet",
		data: { formName: "GetTraffic", View: "device", Days: trafficDays, Mac: mac },
		dataType: "json",
		success: function (data) {
			if (trafficOpenMac != mac) return;
			trafficDeviceData = data;
			$('#TrafficPanelBody').html(trafficBodyHTML());
		}
	});
}

// Allow on an event: this device + this rule, narrowed to the event's country (and domain, if it had one)
function trafficAllowEvent(i) {
	var e = (trafficData.Events || [])[i];
	if (!e) return;
	var what = e.Rule + " for " + e.Device + (e.Country ? ", country " + e.Country : "") + (e.Domain ? ", domain " + e.Domain : "");
	var domain = e.Domain || "";
	if (domain) {
		// offer the parent domain, so a1.tuya.com covers every tuya.com server
		var parts = domain.split(".");
		var parent = parts.length > 2 ? parts.slice(-2).join(".") : domain;
		var answer = prompt("Stop alerting: " + what + ".\nDomain to allow (subdomains included):", parent);
		if (answer == null) return;
		domain = answer.trim();
	} else if (!confirm("Stop alerting: " + what + "?")) {
		return;
	}
	trafficPostAllow({ Action: "add", Mac: e.Mac, Rule: e.Rule, Country: e.Rule == "Unknown Device" || e.Rule == "Night Upload" ? "" : e.Country, Domain: domain });
}

function trafficRemoveAllow(i) {
	if (!confirm("Alert about this again?")) return;
	trafficPostAllow({ Action: "remove", Index: i });
}

function trafficPostAllow(data) {
	data.formName = "AllowTraffic";
	$.ajax({
		type: "POST",
		url: "/TeleonomeServlet",
		data: data,
		dataType: "json",
		success: function (r) {
			if (r.error) alert(r.error);
			trafficRefresh();
		},
		error: function () {
			alert("Cleotilde did not answer");
		}
	});
}
