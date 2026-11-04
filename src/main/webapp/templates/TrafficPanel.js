//
// Cleotilde's Traffic panel (added 2026-11-04; design: OpenWrtOne/documents/05-teleonome-design.md, section 7c).
// Who talks to where: per device bytes up/down, destinations with domain and country, DNS lookups, and the
// Suspicious Events the traffic rules raised, with Allow to silence known-good traffic.
// Data: GetTraffic (TrafficStore tables filled by TrafficWatcher); Allow / Remove: AllowTraffic.
// The page is redrawn every pulse, so the state lives in these globals and a 60 s timer refreshes it.
// Two tabs (2026-11-04): Map (countries shaded by traffic, click one for who talks to it and where) and Table
// (events, devices, domains, allowlist). The map uses d3 v7 (loaded by index.html) and
// templates/world-countries-110m.json (Natural Earth 1:110m, public domain, only ISO code and name kept).
//
var trafficData = null;
var trafficDays = 1;
var trafficOpenMac = null;
var trafficDeviceData = null;
var trafficTimer = null;
var TRAFFIC_WATCHLIST = ["CN", "RU", "KP", "IR"];
var trafficTab = "map";
var trafficWorld = null;
var trafficWorldLoading = false;
var trafficMapCountry = null;
var trafficCountryData = null;
// countries too small for the 1:110m outlines: a dot at [longitude, latitude]
var TRAFFIC_SMALL_COUNTRIES = {
	SG: [103.82, 1.35], HK: [114.17, 22.32], MO: [113.55, 22.19], BH: [50.56, 26.07], MT: [14.44, 35.9],
	LU: [6.13, 49.61], MC: [7.42, 43.74], LI: [9.55, 47.16], AD: [1.52, 42.51], SM: [12.46, 43.94], VA: [12.45, 41.9],
	MV: [73.5, 4.17], MU: [57.55, -20.3], SC: [55.45, -4.68], GI: [-5.35, 36.14], IM: [-4.5, 54.23], JE: [-2.13, 49.21],
	GG: [-2.58, 49.45], KY: [-81.25, 19.31], BM: [-64.75, 32.3], BB: [-59.6, 13.1], AW: [-69.97, 12.52], CW: [-68.99, 12.17],
	PF: [-149.4, -17.65], WS: [-172.1, -13.76], TO: [-175.2, -21.18], FJ: [178.0, -17.7], KI: [173.0, 1.4], PW: [134.5, 7.5],
	MH: [171.18, 7.13], FM: [158.2, 6.9], CV: [-23.6, 15.1], KM: [43.3, -11.7], RE: [55.5, -21.1], ST: [6.6, 0.2],
	BN: [114.7, 4.5], TL: [125.7, -8.8], PS: [35.2, 31.9], CY: [33.4, 35.1], QA: [51.2, 25.3], AE: [54.3, 24.0]
};

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
	trafficCountryData = null;
	trafficRender();
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
	h += "<ul class=\"nav nav-tabs\" style=\"margin-bottom:12px\">";
	[["map", "glyphicon-globe", "Map"], ["table", "glyphicon-list", "Table"]].forEach(function (t) {
		h += "<li" + (trafficTab == t[0] ? " class=\"active\"" : "") + "><a href=\"#\" onclick=\"trafficSetTab('" + t[0] + "');return false;\">"
			+ "<i class=\"glyphicon " + t[1] + "\"></i> " + t[2] + "</a></li>";
	});
	h += "</ul>";
	if (trafficTab == "map") return h + trafficMapHTML();
	h += trafficChart(trafficData.Hours || []);
	h += trafficEventsHTML(trafficData.Events || []);
	h += trafficDevicesHTML(devices);
	h += trafficDomainsHTML(trafficData.TopDomains || [], "Most looked-up domains (all devices)");
	h += trafficAllowlistHTML(trafficData.Allowlist || []);
	return h;
}

// The body, and the map when it is on screen (d3 draws into the element the HTML just made).
function trafficRender() {
	$('#TrafficPanelBody').html(trafficBodyHTML());
	if (trafficTab == "map" && trafficData != null) trafficDrawMap();
}

function trafficSetTab(tab) {
	trafficTab = tab;
	trafficRender();
}

// ------------------------------------------------------------------ the map tab

function trafficCountryName(cc) {
	if (trafficWorld) {
		for (var i = 0; i < trafficWorld.features.length; i++) {
			if (trafficWorld.features[i].properties.cc == cc) return trafficWorld.features[i].properties.name;
		}
	}
	try {
		return new Intl.DisplayNames(["en"], { type: "region" }).of(cc) || cc;
	} catch (e) {
		return cc;
	}
}

// bytes per country as {cc: total}, without the unknown ("?") bucket
function trafficCountryTotals() {
	var countries = (trafficData && trafficData.Countries) || {}, totals = {};
	Object.keys(countries).forEach(function (cc) {
		if (cc != "?" && cc != "") totals[cc] = countries[cc].Up + countries[cc].Down;
	});
	return totals;
}

// shade 0..1 on a log scale, so a country with a few KB still shows next to one with GBs
function trafficShade(v, max) {
	return v <= 0 ? 0 : Math.log(1 + v) / Math.log(1 + Math.max(max, 1));
}

function trafficFill(cc, v, max) {
	if (!v) return "#f2f2f2";
	var t = trafficShade(v, max);
	return TRAFFIC_WATCHLIST.indexOf(cc) >= 0 ? d3.interpolateReds(0.45 + 0.55 * t) : d3.interpolateBlues(0.2 + 0.8 * t);
}

function trafficMapHTML() {
	var h = "<div class=\"row\">";
	h += "<div class=\"col-md-9\"><div id=\"TrafficMap\" style=\"position:relative;width:100%\">"
		+ (typeof d3 === "undefined" ? "<p class=\"text-muted\">The map needs d3, which did not load (no internet?). The Table tab has everything.</p>" : "<p class=\"text-muted\">Loading the map...</p>")
		+ "</div><p class=\"text-muted\" style=\"font-size:12px\">Darker = more traffic (log scale). Red = a watchlist country ("
		+ TRAFFIC_WATCHLIST.join(", ") + "). Click a country for the devices that talk to it.</p></div>";
	h += "<div class=\"col-md-3\">" + trafficCountryListHTML() + "</div>";
	h += "</div>";
	h += "<div id=\"TrafficCountryDetail\">" + trafficCountryDetailHTML() + "</div>";
	return h;
}

function trafficCountryListHTML() {
	var countries = (trafficData && trafficData.Countries) || {};
	var totals = trafficCountryTotals();
	var ccs = Object.keys(totals).sort(function (a, b) { return totals[b] - totals[a]; });
	if (ccs.length == 0) return "<p class=\"text-muted\">No countries yet.</p>";
	var max = totals[ccs[0]];
	var h = "<table class=\"table table-condensed table-hover\" style=\"font-size:13px\"><tr><th>Country</th><th class=\"text-right\">Traffic</th><th class=\"text-right\">Devices</th></tr>";
	ccs.slice(0, 25).forEach(function (cc) {
		var sel = cc == trafficMapCountry;
		h += "<tr style=\"cursor:pointer" + (sel ? ";background:#e8f0fe" : "") + "\" onclick=\"trafficSelectCountry('" + trafficEscape(cc) + "')\"><td>"
			+ "<span style=\"display:inline-block;width:10px;height:10px;margin-right:5px;background:" + trafficFill(cc, totals[cc], max) + ";border:1px solid #999\"></span>"
			+ trafficCountry(cc) + " " + trafficEscape(trafficCountryName(cc)) + "</td><td class=\"text-right\">" + trafficBytes(totals[cc])
			+ "</td><td class=\"text-right\">" + (countries[cc].Devices || "") + "</td></tr>";
	});
	if (countries["?"]) {
		h += "<tr><td class=\"text-muted\">unknown</td><td class=\"text-right text-muted\">" + trafficBytes(countries["?"].Up + countries["?"].Down) + "</td><td></td></tr>";
	}
	return h + "</table>";
}

function trafficDrawMap() {
	var el = document.getElementById("TrafficMap");
	if (!el || typeof d3 === "undefined") return;
	if (trafficWorld == null) {
		if (!trafficWorldLoading) {
			trafficWorldLoading = true;
			$.getJSON("templates/world-countries-110m.json", function (w) {
				trafficWorld = w;
				trafficRender();  // country names in the list come from the map file too
			}).fail(function () {
				trafficWorldLoading = false;
				$("#TrafficMap").html("<p class=\"text-muted\">Could not load the world map.</p>");
			});
		}
		return;
	}
	var totals = trafficCountryTotals(), countries = trafficData.Countries || {};
	var max = 0;
	Object.keys(totals).forEach(function (cc) { max = Math.max(max, totals[cc]); });
	// colours as inline styles: index.html has a page-wide "path { stroke: steelblue; fill: none }" for the
	// charts, and CSS beats SVG presentation attributes
	var W = 960, H = 480;
	var projection = d3.geoNaturalEarth1().fitExtent([[4, 4], [W - 4, H - 4]], { type: "Sphere" });
	var path = d3.geoPath(projection);
	var container = d3.select(el).html("");
	var svg = container.append("svg").attr("viewBox", "0 0 " + W + " " + H).style("width", "100%").style("height", "auto").style("display", "block");
	var tip = container.append("div").style("position", "absolute").style("pointer-events", "none").style("display", "none")
		.style("background", "rgba(0,0,0,0.8)").style("color", "#fff").style("padding", "4px 8px").style("border-radius", "4px").style("font-size", "12px");
	function showTip(event, cc) {
		var c = countries[cc];
		var rect = el.getBoundingClientRect();
		tip.style("display", "block").style("left", (event.clientX - rect.left + 12) + "px").style("top", (event.clientY - rect.top + 12) + "px")
			.html("<b>" + trafficEscape(trafficCountryName(cc)) + "</b> (" + trafficEscape(cc) + ")"
				+ (c ? "<br>\u2191 " + trafficBytes(c.Up) + " \u2193 " + trafficBytes(c.Down) + "<br>" + c.Devices + " device" + (c.Devices == 1 ? "" : "s") : "<br>no traffic"));
	}
	svg.append("path").datum({ type: "Sphere" }).attr("d", path).style("fill", "#eaf4fb").style("stroke", "#c8d6e0");
	svg.append("path").datum(d3.geoGraticule10()).attr("d", path).style("fill", "none").style("stroke", "#dde8f0").style("stroke-width", 0.5);
	var drawn = {};
	svg.append("g").selectAll("path").data(trafficWorld.features).join("path")
		.attr("d", path)
		.style("fill", function (f) { drawn[f.properties.cc] = true; return trafficFill(f.properties.cc, totals[f.properties.cc], max); })
		.style("stroke", function (f) { return f.properties.cc == trafficMapCountry ? "#000" : "#b8b8b8"; })
		.style("stroke-width", function (f) { return f.properties.cc == trafficMapCountry ? 1.6 : 0.5; })
		.style("cursor", function (f) { return totals[f.properties.cc] ? "pointer" : "default"; })
		.on("mousemove", function (event, f) { if (f.properties.cc) showTip(event, f.properties.cc); })
		.on("mouseleave", function () { tip.style("display", "none"); })
		.on("click", function (event, f) { if (totals[f.properties.cc]) trafficSelectCountry(f.properties.cc); });
	// small countries without an outline, and the selected country drawn on top
	var dots = Object.keys(totals).filter(function (cc) { return !drawn[cc] && TRAFFIC_SMALL_COUNTRIES[cc]; });
	svg.append("g").selectAll("circle").data(dots).join("circle")
		.attr("cx", function (cc) { return projection(TRAFFIC_SMALL_COUNTRIES[cc])[0]; })
		.attr("cy", function (cc) { return projection(TRAFFIC_SMALL_COUNTRIES[cc])[1]; })
		.attr("r", function (cc) { return 3 + 5 * trafficShade(totals[cc], max); })
		.style("fill", function (cc) { return trafficFill(cc, totals[cc], max); })
		.style("stroke", function (cc) { return cc == trafficMapCountry ? "#000" : "#555"; })
		.style("stroke-width", function (cc) { return cc == trafficMapCountry ? 1.6 : 0.7; })
		.style("cursor", "pointer")
		.on("mousemove", function (event, cc) { showTip(event, cc); })
		.on("mouseleave", function () { tip.style("display", "none"); })
		.on("click", function (event, cc) { trafficSelectCountry(cc); });
}

function trafficSelectCountry(cc) {
	trafficMapCountry = trafficMapCountry == cc ? null : cc;
	trafficCountryData = null;
	trafficRender();
	if (trafficMapCountry != null) trafficRefreshCountry();
}

function trafficRefreshCountry() {
	var cc = trafficMapCountry;
	$.ajax({
		type: "GET",
		url: "/TeleonomeServlet",
		data: { formName: "GetTraffic", View: "country", Days: trafficDays, Country: cc },
		dataType: "json",
		success: function (data) {
			if (trafficMapCountry != cc) return;
			trafficCountryData = data;
			$("#TrafficCountryDetail").html(trafficCountryDetailHTML());
		}
	});
}

function trafficCountryDetailHTML() {
	if (trafficMapCountry == null) return "";
	var h = "<h5 style=\"padding-top:6px\">" + trafficCountry(trafficMapCountry) + " " + trafficEscape(trafficCountryName(trafficMapCountry))
		+ " <a href=\"#\" style=\"font-size:12px;margin-left:8px\" onclick=\"trafficSelectCountry('" + trafficEscape(trafficMapCountry) + "');return false;\">close</a></h5>";
	if (trafficCountryData == null || trafficCountryData.Country != trafficMapCountry) return h + "<p class=\"text-muted\">Loading...</p>";
	var devices = trafficCountryData.Devices || [], dest = trafficCountryData.Destinations || [];
	h += "<div class=\"row\"><div class=\"col-md-5\"><b>Devices talking to it</b>";
	h += "<table class=\"table table-condensed\"><tr><th>Device</th><th class=\"text-right\">Up</th><th class=\"text-right\">Down</th><th class=\"text-right\">Conns</th></tr>";
	devices.forEach(function (d) {
		h += "<tr><td>" + trafficEscape(d.Device) + " <small class=\"text-muted\">" + trafficEscape(d.Mac) + "</small></td><td class=\"text-right\">"
			+ trafficBytes(d.Up) + "</td><td class=\"text-right\">" + trafficBytes(d.Down) + "</td><td class=\"text-right\">" + d.Connections + "</td></tr>";
	});
	h += "</table></div><div class=\"col-md-7\"><b>Where there</b>";
	h += "<table class=\"table table-condensed\"><tr><th>Domain</th><th>IP:port</th><th>Devices</th><th class=\"text-right\">Up</th><th class=\"text-right\">Down</th><th>Last</th></tr>";
	dest.forEach(function (x) {
		h += "<tr><td>" + trafficEscape(x.Domain) + "</td><td>" + trafficEscape(x.IP) + ":" + x.Port + "</td><td>" + trafficEscape(x.Devices)
			+ "</td><td class=\"text-right\">" + trafficBytes(x.Up) + "</td><td class=\"text-right\">" + trafficBytes(x.Down) + "</td><td>" + trafficTime(x.Last) + "</td></tr>";
	});
	return h + "</table></div></div>";
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
	trafficRender();
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
			trafficRender();
			if (trafficOpenMac != null) trafficRefreshDevice();
			if (trafficMapCountry != null) trafficRefreshCountry();
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
			trafficRender();
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
