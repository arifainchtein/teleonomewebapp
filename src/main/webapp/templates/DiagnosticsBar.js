//
// Diagnostics Bar (Cleotilde Diagnostics page, 2026-11-05): one panel instead of Power Panel + Diagnostics Info +
// the always-on memory chart.
//   line 1   the diagnostic buttons on the left (same ids and data-panelpointer as DiagnosticsInfo.js, so index.html's
//            handlers draw into #DiagnosticsWorkArea as before), Stop Hypothalamus / Restart / Turn off on the right
//            (#StopHypothalamusButton, #RestartButton, #ShutdownButton: index.html asks for the 6-digit code)
//   line 2   Organs: Cerebellum, Hippocampus, Heart, each with a dot from its status file (GetOrganStatus form);
//            their views are drawn here; the Hippocampus view is the Organs panel's (hippocampusViewBodyHTML(),
//            RenderingEngine.js: Telepathons Registry/Temporary List + Data), kept alive across the pulse redraws;
//            the Cerebellum view is the Organs panel's too (cerebellumViewHTML(): one pill per task)
//   below    #DiagnosticsWorkArea: empty until a button is pressed; the same button again hides it
// Leaves 5 divs open: renderPageByPointer closes them.
//
var dsDiagCurrent = null;
var dsOrganStatus = null;

var DS_DIAG_BUTTONS = [
	["JsonDenome", "", "tree-conifer", "JSON"],
	["Analysis", "Analysis Panel", "list-alt", "Analysis"],
	["Memory", "Memory Panel", "signal", "Memory"],
	["Mnemosycons", "Mnemosycons Panel", "erase", "Mnemosycons"],
	["Synchronous", "Synchronous Panel", "time", "Synchronous"],
	["Asynchronous", "Asynchronous Panel", "flash", "Asynchronous"],
	["SystemDiagnostics", "System Diagnostics Panel", "dashboard", "System"]
];
var DS_ORGANS = [
	["Hypothalamus", "flash", "the pulse"],
	["Cerebellum", "cog", "analysis"],
	["Hippocampus", "hdd", "Telepathon memory"],
	["Heart", "heart", "messages between organs"]
];

class DiagnosticsBar extends DiagnosticsInfo {

	process() {
		dsOrganRefresh();
		var h = '<div class="col-lg-12"><div class="ds-block dg-block">';
		h += '<div class="dg-bar"><div class="dg-group">' + DS_DIAG_BUTTONS.map(function (b) {
			return '<div id="' + b[0] + '"' + (b[1] ? ' data-panelpointer="' + b[1] + '"' : '') + ' class="dg-btn' + (dsDiagCurrent === b[0] ? ' on' : '') + '" data-dg="' + b[0] + '">'
				+ '<i class="glyphicon glyphicon-' + b[2] + '"></i>' + b[3] + '</div>';
		}).join("") + '</div>'
			+ '<div class="dg-power">'
			+ '<span id="DSMaintenance" class="dg-maint"></span>'
			+ '<button id="StopHypothalamusButton" class="btn btn-warning" title="Stops the Hypothalamus cleanly between pulses, so you can work on it without corrupting the denome"><i class="glyphicon glyphicon-stop"></i> Stop Hypothalamus</button>'
			+ '<button id="RestartButton" class="btn btn-default"><i class="glyphicon glyphicon-repeat"></i> Restart Pi</button>'
			+ '<button id="ShutdownButton" class="btn btn-danger"><i class="glyphicon glyphicon-off"></i> Turn Off Pi</button>'
			+ '</div></div>';
		h += '<h5 class="dg-organhead"><span>Organs <small class="ds-sub">the processes beside the Hypothalamus</small></span></h5>';
		h += '<div class="dg-bar" id="DSOrganButtons">' + dsOrganButtonsHTML() + '</div>';
		h += '<div id="DiagnosticsWorkArea" class="dg-work"' + (dsDiagCurrent ? '' : ' style="display:none"') + '>' + (DS_ORGAN_VIEWS[dsDiagCurrent] ? DS_ORGAN_VIEWS[dsDiagCurrent]() : '') + '</div>';
		h += '<div><div><div>';   // 5 open: col, block, 3 here
		// the page is redrawn every pulse: a diagnostic view (not an organ) is drawn by its handler, so draw it again
		if (dsDiagCurrent && !DS_ORGAN_VIEWS[dsDiagCurrent] && dsDiagCurrent !== "JsonDenome") setTimeout(function () { $("#" + dsDiagCurrent).trigger("click", [true]); }, 0);
		if (dsDiagCurrent === "Heart") setTimeout(dsHeartViewReady, 0);
		if (dsDiagCurrent === "Hippocampus") setTimeout(function () { dsHippocampusViewReady(false); }, 0);
		if (dsDiagCurrent === "Cerebellum") setTimeout(dsCerebellumRestoreTab, 0);
		if (dsDiagCurrent === "Fertilizer") dsDiagCurrent = null;   // pulses again: the Hypothalamus runs, nothing to fertilize
		if (typeof dsMaintRefresh === "function") setTimeout(dsMaintRefresh, 0);   // stopped for maintenance? (MaintenancePanel.js)
		return h;
	}
}

function dsHM(ms) { var d = new Date(ms); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }

function dsOrganState(name) {
	if (name === "Heart") return ["", "running"];
	if (name === "Hypothalamus") {
		var hy = dsOrganStatus && dsOrganStatus.Hypothalamus;
		if (!hy) return ["bad", dsOrganStatus ? "no status" : "…"];
		var since = hy["Last Pulse Milliseconds"] ? (dsOrganStatus.Now - hy["Last Pulse Milliseconds"]) / 1000 : null;
		var last = since === null ? "" : " · last pulse " + (since < 90 ? Math.round(since) + " s ago" : Math.round(since / 60) + " min ago");
		if (hy["Stopped Until"]) return ["warn", (hy.Running ? "stopping" : "stopped for maintenance until " + dsHM(hy["Stopped Until"])) + last];
		if (!hy.Running) return ["bad", "not running" + last];
		return [since !== null && since > 600 ? "warn" : "", "pulsing" + last];
	}
	var s = dsOrganStatus && dsOrganStatus[name];
	if (!s) return ["bad", dsOrganStatus ? "no status file" : "…"];
	var age = (dsOrganStatus.Now - s["Timestamp Milliseconds"]) / 1000;
	return [age < 120 ? "" : age < 600 ? "warn" : "bad", "alive " + (age < 90 ? Math.round(age) + " s ago" : Math.round(age / 60) + " min ago")];
}

function dsOrganButtonsHTML() {
	return DS_ORGANS.map(function (o) {
		var st = dsOrganState(o[0]);
		return '<div id="Organ' + o[0] + '" class="dg-btn dg-organ' + (dsDiagCurrent === o[0] ? ' on' : '') + '" data-dg="' + o[0] + '"><i class="glyphicon glyphicon-' + o[1] + '"></i>'
			+ '<div><b><span class="dg-dot ' + st[0] + '"></span>' + o[0] + '</b><small>' + o[2] + ' · ' + st[1] + '</small></div></div>';
	}).join("");
}

function dsOrganRefresh() {
	$.ajax({ type: "GET", url: "/TeleonomeServlet", dataType: "json", data: { formName: "GetOrganStatus" },
		success: function (data) {
			dsOrganStatus = data;
			$("#DSOrganButtons").html(dsOrganButtonsHTML());
			if (dsDiagCurrent === "Cerebellum") { $("#DiagnosticsWorkArea").html(DS_ORGAN_VIEWS.Cerebellum()); dsCerebellumRestoreTab(); }
			if (dsDiagCurrent === "Hippocampus") $("#dg-hippo-head").html(dsHippocampusHeadHTML());
			if (dsDiagCurrent === "Hypothalamus") $("#DiagnosticsWorkArea").html(DS_ORGAN_VIEWS.Hypothalamus());
		} });
}

// a button: draw its view, or hide it if it was already open (index.html's handlers draw the diagnostic views;
// they are bound later, so the hiding waits for them)
$(document).on("click", ".dg-btn", function (e, redraw) {
	var which = this.getAttribute("data-dg");
	if (redraw) return;
	if (which === "JsonDenome") return;	// opens a window
	var closing = dsDiagCurrent === which;
	dsDiagCurrent = closing ? null : which;
	$(".dg-btn").each(function () { $(this).toggleClass("on", this.getAttribute("data-dg") === dsDiagCurrent); });
	if (DS_ORGAN_VIEWS[which]) {
		$("#DiagnosticsWorkArea").html(closing ? "" : DS_ORGAN_VIEWS[which]()).toggle(!closing);
		if (!closing && which === "Heart") dsHeartViewReady();
		if (which === "Hippocampus") { if (closing) dsHippoNode = null; else dsHippocampusViewReady(true); }
		if (which === "Cerebellum") dsCerebTab = null;
		if (!closing) dsOrganRefresh();
	} else if (closing) {
		setTimeout(function () { $("#DiagnosticsWorkArea").hide().empty(); }, 0);
	}
});

function dsKv(rows) {
	return '<div class="dg-kv">' + rows.filter(function (r) { return r[1] !== "" && r[1] != null; }).map(function (r) { return '<div><span>' + r[0] + '</span>' + r[1] + '</div>'; }).join("") + '</div>';
}

var DS_ORGAN_VIEWS = {
	// the Hypothalamus: its state, and while stopped for maintenance the same buttons as in the bar
	Hypothalamus: function () {
		var hy = (dsOrganStatus && dsOrganStatus.Hypothalamus) || {}, st = dsOrganState("Hypothalamus");
		return '<h4><span class="dg-dot ' + st[0] + '"></span>Hypothalamus <small>runs the pulse: reads the microcontrollers, evaluates, acts, writes the Denome</small></h4>'
			+ dsKv([["State", dsEsc(st[1])], ["Process", hy.Running ? "pid " + dsEsc(hy.Pid) : "not running"],
				["Last pulse", hy["Last Pulse Milliseconds"] ? new Date(hy["Last Pulse Milliseconds"]).toLocaleString() : ""],
				["Stopped until", hy["Stopped Until"] ? new Date(hy["Stopped Until"]).toLocaleString() + " (then the Medula starts it again)" : ""]]);
	},
	// the Organs panel's Cerebellum (one pill per task and what it found), under a line with the process status
	Cerebellum: function () {
		var e = dsEsc, s = dsOrganStatus && dsOrganStatus.Cerebellum, st = dsOrganState("Cerebellum");
		var h = '<h4><span class="dg-dot ' + st[0] + '"></span>Cerebellum <small>analyses the data and reports what it finds'
			+ (s ? ' · pid ' + e(s.cerebellumPid) + ' · ' + st[1] : ' · no status file') + '</small></h4>';
		$("#cerebellumModal").remove();	// same pane ids as this view
		return h + '<div id="dg-cereb-view">' + (typeof cerebellumViewHTML === "function" ? cerebellumViewHTML() : "") + '</div>';
	},
	// the Organs panel's Hippocampus: dsHippocampusViewReady() puts the view itself into #dg-hippo-body
	Hippocampus: function () {
		return '<div id="dg-hippo-head">' + dsHippocampusHeadHTML() + '</div><div id="dg-hippo-body"></div>';
	},
	Heart: function () {
		return '<h4><span class="dg-dot"></span>Heart <small>the messages this page has received from the organs</small>'
			+ ' <button class="btn btn-xs btn-default" onclick="heartLogDownload();return false;">Download</button></h4>'
			+ '<select id="heart-log-filter" class="form-control input-sm" onchange="heartLogApplyFilter()" style="max-width:320px;margin-bottom:6px"><option value="">Show all</option></select>'
			+ '<div id="heart-log-view" class="dg-heartlog"></div><div id="heart-stats-view" style="padding-top:8px"></div>';
	}
};

function dsHeartViewReady() {
	if (typeof heartLogBuildHtml !== "function") return;
	$("#heart-log-view").html(heartLogBuildHtml());
	heartMessageLog.forEach(function (x) { if (heartLogTopics.indexOf(x.topic) === -1) heartLogTopics.push(x.topic); });
	heartLogTopics.sort();
	heartLogUpdateFilterOptions();
	refreshHeartStatsView();
}

// Hippocampus organ view (2026-11-17): the same view as the Organs panel's Hippocampus button (Telepathons:
// Registry/Temporary List from the Hippocampus itself, Data: memory charts, Stats, Contents). The page is redrawn
// every pulse, so the view's node is kept (dsHippoNode) and put back after each redraw: tabs, filters and the
// loaded registry survive, and only the Data pane is filled again from the new pulse.
var dsHippoNode = null;

function dsHippocampusHeadHTML() {
	var e = dsEsc, s = dsOrganStatus && dsOrganStatus.Hippocampus, st = dsOrganState("Hippocampus"), w = {};
	((s && s.DeneWords) || []).forEach(function (x) { w[x.Name] = x.Value; });
	return '<h4><span class="dg-dot ' + st[0] + '"></span>Hippocampus <small>keeps recent Telepathon data in memory, for the charts'
		+ (s ? ' · ' + e(w.Status) + ' · pid ' + e(s.hippocampusPid) + ' · ' + st[1] : ' · no status file') + '</small></h4>';
}

function dsHippocampusViewReady(fresh) {
	if (typeof hippocampusViewBodyHTML !== "function") return;
	// the Organs panel's modal uses the same ids: only one of the two may be in the page
	$("#hippocampusModal").remove();
	if (fresh || !dsHippoNode) {
		dsHippoNode = $('<div id="dg-hippo-view">' + hippocampusViewBodyHTML() + '</div>');
		$("#dg-hippo-body").empty().append(dsHippoNode);
		loadHippocampusTelepathonsTab();
	} else {
		$("#dg-hippo-body").empty().append(dsHippoNode);
	}
	renderHippocampusDataPane();
}

// Cerebellum organ view: the page is redrawn every pulse, which would put the task pills back on the first task;
// remember the one chosen and choose it again after each redraw
var dsCerebTab = null;
$(document).on("click", "#dg-cereb-view .nav-pills > li", function () {
	var m = /teleonomeShowTab\('([^']+)'/.exec(this.getAttribute("onclick") || "");
	if (m) dsCerebTab = m[1];
});
function dsCerebellumRestoreTab() {
	if (!dsCerebTab || !$("#" + dsCerebTab).length) return;
	var li = $("#dg-cereb-view .nav-pills > li").filter(function () { return (this.getAttribute("onclick") || "").indexOf("'" + dsCerebTab + "'") !== -1; }).first();
	if (li.length) teleonomeShowTab(dsCerebTab, li);
}


// The page is redrawn by the pulse; with the Hypothalamus stopped there is none, so while the Diagnostics bar is on the
// page its organ boxes and the maintenance buttons are refreshed every 15 s as well (2026-11-19)
setInterval(function () {
	if (document.hidden || !document.getElementById("DSOrganButtons")) return;
	dsOrganRefresh();
	if (typeof dsMaintRefresh === "function") dsMaintRefresh();
}, 15000);
