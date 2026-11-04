//
// Presence for Cleotilde's Devices page (added 2026-11-05; design: OpenWrtOne 05-teleonome-design.md section 8), drawn
// by the Network Map (NetworkMap.js):
//   its "Arrivals and departures" / "Who was here" buttons   that list instead of the map
//   a selected device                                        its 24 h bar, the share of scans it was in, its comings and goings
// Tapping a name in a list opens that device (and brings the map back). A device has left after missing 3 scans that really ran.
// Data: GetPresence (also the critical list behind the map's stars and Critical filter), refreshed every 60 s
// while the map is on screen; the page is redrawn every pulse and draws from the last answer.
//
var dsPresence = null;
var dsPresenceTimer = null;
var dsPresenceLoading = false;
var dsFeedFilter = "all";
var dsTimelineFilter = "all";

function dsPresenceStart() {
	if (dsPresenceTimer == null) dsPresenceTimer = setInterval(dsPresenceRefresh, 60000);
	if (dsPresence == null) setTimeout(dsPresenceRefresh, 0);
}

function dsPresenceRefresh() {
	if (!$("#DSMap").length || dsPresenceLoading) return;	// another page is on screen
	dsPresenceLoading = true;
	$.ajax({
		type: "GET",
		url: "/TeleonomeServlet",
		data: { formName: "GetPresence", Hours: 24 },
		dataType: "json",
		success: function (data) {
			dsPresence = data;
			dsMapRender();
			// the Device Table's stars
			$("#DSDevTable .wlCriticalBtn").each(function () {
				var on = dsIsCritical(this.getAttribute("data-mac"));
				$(this).toggleClass("on", on).attr("data-critical", String(!on)).find("i").attr("class", "glyphicon glyphicon-star" + (on ? "" : "-empty"));
			});
		},
		complete: function () { dsPresenceLoading = false; }
	});
}

function dsKindOf(mac) {
	var n = (dsMapLast || []).find(function (x) { return x.mac === mac; });
	return n ? n.kind : "unknown";
}

function dsAgo(ms) {
	var m = Math.max(0, Math.round((Date.now() - ms) / 60000));
	return m < 1 ? "a moment" : m < 60 ? m + " min" : m < 1440 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : Math.round(m / 1440) + " days";
}

function dsClock(ms) {
	var d = new Date(ms);
	return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

function dsDisplay(name, mac) {
	name = String(name || "").replace(/\.lan$/i, "");
	return !name || name === mac ? mac : name;
}

function dsPresenceWaiting() {
	return '<p class="ds-sub">Loading…</p>';
}

// ------------------------------------------------------------------ the lists

function dsFilterButtons(current, variable, target, options) {
	return '<span class="btn-group btn-group-xs">' + options.map(function (o) {
		return '<button class="btn ' + (current === o[0] ? 'btn-primary' : 'btn-default') + '" onclick="' + variable + '=\'' + o[0] + '\';$(\'#' + target + '\').html(' + target.replace("DS", "ds") + 'HTML());return false;">' + o[1] + '</button>';
	}).join("") + '</span>';
}

function dsFeedHTML() {
	var e = dsEsc;
	var h = '<h6>Arrivals and departures <span class="ds-sub">24 h</span> ' + dsFilterButtons(dsFeedFilter, "dsFeedFilter", "DSFeed", [["all", "All"], ["unknown", "Unknown"], ["critical", "Critical"]]) + '</h6>';
	if (!dsPresence) return h + dsPresenceWaiting();
	var list = dsPresence.Events.filter(function (v) { return dsFeedFilter === "all" || (dsFeedFilter === "unknown" ? !v.Known : v.Critical); });
	if (!list.length) return h + '<p class="ds-sub">Nobody came or went.</p>';
	return h + '<div class="ds-feed">' + dsEventRows(list.slice(0, 80), true) + '</div>';
}

function dsEventRows(list, withNames) {
	var e = dsEsc, h = "", day = "";
	list.forEach(function (v) {
		var d = new Date(v.Time).toDateString();
		if (d !== day) {
			day = d;
			h += '<div class="ds-feedday">' + (d === new Date().toDateString() ? "Today" : e(new Date(v.Time).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" }))) + '</div>';
		}
		var arrived = v.Type === "arrived";
		h += '<div class="ds-feedrow' + (!v.Known && arrived ? ' warn' : '') + (v.Critical && !arrived ? ' bad' : '') + (withNames ? ' ds-click" onclick="dsMapSelect(\'' + e(v.Mac) + '\')' : '') + '">'
			+ '<span class="ds-feedtime">' + dsClock(v.Time) + '</span>'
			+ '<span class="ds-feeddir ' + (arrived ? 'in' : 'out') + '">' + (arrived ? '→' : '←') + '</span>'
			+ (withNames ? dsIconSVG(dsKindOf(v.Mac), 16) + '<span class="ds-feedname"><span class="ds-dot ' + (v.Known ? 'known' : 'unknown') + '"></span>' + e(dsDisplay(v.Name, v.Mac))
				+ (v.Critical ? ' <span class="ds-staricon">★</span>' : '') + '</span>' : '<span class="ds-feedname"></span>')
			+ '<span class="ds-sub">' + (arrived ? 'arrived' : 'left') + (v.IP ? ' · ' + e(v.IP) : '') + '</span></div>';
	});
	return h;
}

// the hour ticks (every 3 h, on the clock) and the no-scan gaps, shared by the timeline and a device's bar
function dsTimeScale() {
	var since = dsPresence.Since, span = Math.max(1, dsPresence.Now - since);
	var pos = function (t) { return Math.max(0, Math.min(100, (t - since) * 100 / span)); };
	var ticks = "", t = new Date(since);
	t.setMinutes(0, 0, 0);
	t.setHours(t.getHours() + 1);
	for (; t.getTime() < dsPresence.Now; t.setHours(t.getHours() + 1)) {
		if (t.getHours() % 3) continue;
		ticks += '<span style="left:' + pos(t.getTime()).toFixed(2) + '%">' + ("0" + t.getHours()).slice(-2) + '</span>';
	}
	var gaps = dsPresence.Gaps.map(function (g) {
		return '<i class="gap" style="left:' + pos(g[0]).toFixed(2) + '%;width:' + (pos(g[1]) - pos(g[0])).toFixed(2) + '%" title="no scans ' + dsClock(g[0]) + '–' + dsClock(g[1]) + '"></i>';
	}).join("");
	return { pos: pos, ticks: ticks, gaps: gaps };
}

function dsBars(d, scale) {
	return d.Intervals.map(function (iv) {
		var end = iv[1] || dsPresence.Now;
		return '<i class="' + (d.Known ? 'known' : 'unknown') + '" style="left:' + scale.pos(iv[0]).toFixed(2) + '%;width:' + Math.max(0.4, scale.pos(end) - scale.pos(iv[0])).toFixed(2) + '%" title="'
			+ dsClock(iv[0]) + '–' + (iv[1] ? dsClock(iv[1]) : 'now') + '"></i>';
	}).join("");
}

function dsTimelineHTML() {
	var e = dsEsc;
	var h = '<h6>Who was here <span class="ds-sub">last 24 h</span> ' + dsFilterButtons(dsTimelineFilter, "dsTimelineFilter", "DSTimeline", [["all", "All"], ["known", "Known"], ["unknown", "Unknown"], ["critical", "Critical"]]) + '</h6>';
	if (!dsPresence) return h + dsPresenceWaiting();
	var scale = dsTimeScale();
	var rows = dsPresence.Devices.filter(function (d) {
		return dsTimelineFilter === "all" || (dsTimelineFilter === "known" ? d.Known : dsTimelineFilter === "unknown" ? !d.Known : d.Critical);
	});
	rows.sort(function (a, b) { return (b.Critical - a.Critical) || (b.Known - a.Known) || dsDisplay(a.Name, a.Mac).localeCompare(dsDisplay(b.Name, b.Mac)); });
	h += '<div class="ds-tl"><div class="ds-tlrow ds-tlaxis"><span class="ds-tlname"></span><span class="ds-tlbar">' + scale.ticks + '</span></div>';
	rows.forEach(function (d) {
		h += '<div class="ds-tlrow ds-click" onclick="dsMapSelect(\'' + e(d.Mac) + '\')"><span class="ds-tlname" title="' + e(d.Mac + (d.IP ? " · " + d.IP : "")) + '">' + dsIconSVG(dsKindOf(d.Mac), 14)
			+ (d.Critical ? '<span class="ds-staricon">★</span>' : '') + e(dsDisplay(d.Name, d.Mac)) + '</span><span class="ds-tlbar">' + scale.gaps + dsBars(d, scale) + '</span></div>';
	});
	if (!rows.length) h += '<p class="ds-sub">Nobody.</p>';
	return h + '</div>';
}

// ------------------------------------------------------------------ one device

function dsDevicePresenceHTML(mac) {
	if (!dsPresence) return dsPresenceWaiting();
	var d = dsPresence.Devices.find(function (x) { return x.Mac === mac; });
	if (!d) return '<p class="ds-sub">Not seen in the last 24 h.</p>';
	var scale = dsTimeScale(), h = "";
	var c = dsPresence.Critical.find(function (x) { return x.Mac === mac; });
	var minutes = 0;
	d.Intervals.forEach(function (iv) { minutes += ((iv[1] || dsPresence.Now) - iv[0]) / 60000; });
	h += '<div class="ds-tl ds-tlone"><div class="ds-tlrow ds-tlaxis"><span class="ds-tlbar">' + scale.ticks + '</span></div>'
		+ '<div class="ds-tlrow"><span class="ds-tlbar">' + scale.gaps + dsBars(d, scale) + '</span></div></div>';
	h += '<p class="ds-sub">Here about ' + (minutes >= 60 ? Math.floor(minutes / 60) + " h " : "") + Math.round(minutes % 60) + ' min of the last 24 h'
		+ (c ? ' · in ' + Math.round(c.Availability * 1000) / 10 + '% of scans' + (c.Down ? ' · <b class="text-danger">DOWN' + (c.LastSeen ? ', last seen ' + dsAgo(c.LastSeen) + ' ago' : '') + '</b>' : '') : '') + '</p>';
	var events = dsPresence.Events.filter(function (v) { return v.Mac === mac; });
	if (events.length) h += '<div class="ds-feed" style="max-height:240px">' + dsEventRows(events, false) + '</div>';
	return h;
}
