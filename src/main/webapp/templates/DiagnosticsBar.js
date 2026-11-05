//
// Diagnostics Bar (Cleotilde Diagnostics page, 2026-11-05): one panel instead of Power Panel + Diagnostics Info +
// the always-on memory chart.
//   line 1   the diagnostic buttons on the left (same ids and data-panelpointer as DiagnosticsInfo.js, so index.html's
//            handlers draw into #DiagnosticsWorkArea as before), Stop Hypothalamus / Restart / Turn off on the right
//            (#StopHypothalamusButton, #RestartButton, #ShutdownButton: index.html asks for the 6-digit code)
//   line 2   Organs: Cerebellum, Hippocampus, Heart, each with a dot from its status file (GetOrganStatus form);
//            their views are drawn here
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
			+ '<button id="StopHypothalamusButton" class="btn btn-warning" title="Stops the Hypothalamus cleanly between pulses, so you can work on it without corrupting the denome"><i class="glyphicon glyphicon-stop"></i> Stop Hypothalamus</button>'
			+ '<button id="RestartButton" class="btn btn-default"><i class="glyphicon glyphicon-repeat"></i> Restart</button>'
			+ '<button id="ShutdownButton" class="btn btn-danger"><i class="glyphicon glyphicon-off"></i> Turn off</button>'
			+ '</div></div>';
		h += '<h5 class="dg-organhead"><span>Organs <small class="ds-sub">the processes beside the Hypothalamus</small></span></h5>';
		h += '<div class="dg-bar" id="DSOrganButtons">' + dsOrganButtonsHTML() + '</div>';
		h += '<div id="DiagnosticsWorkArea" class="dg-work"' + (dsDiagCurrent ? '' : ' style="display:none"') + '>' + (DS_ORGAN_VIEWS[dsDiagCurrent] ? DS_ORGAN_VIEWS[dsDiagCurrent]() : '') + '</div>';
		h += '<div><div><div>';   // 5 open: col, block, 3 here
		// the page is redrawn every pulse: a diagnostic view (not an organ) is drawn by its handler, so draw it again
		if (dsDiagCurrent && !DS_ORGAN_VIEWS[dsDiagCurrent] && dsDiagCurrent !== "JsonDenome") setTimeout(function () { $("#" + dsDiagCurrent).trigger("click", [true]); }, 0);
		if (dsDiagCurrent === "Heart") setTimeout(dsHeartViewReady, 0);
		return h;
	}
}

function dsOrganState(name) {
	if (name === "Heart") return ["", "running"];
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
			if (dsDiagCurrent === "Cerebellum" || dsDiagCurrent === "Hippocampus") $("#DiagnosticsWorkArea").html(DS_ORGAN_VIEWS[dsDiagCurrent]());
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
		if (!closing) dsOrganRefresh();
	} else if (closing) {
		setTimeout(function () { $("#DiagnosticsWorkArea").hide().empty(); }, 0);
	}
});

function dsKv(rows) {
	return '<div class="dg-kv">' + rows.filter(function (r) { return r[1] !== "" && r[1] != null; }).map(function (r) { return '<div><span>' + r[0] + '</span>' + r[1] + '</div>'; }).join("") + '</div>';
}

var DS_ORGAN_VIEWS = {
	Cerebellum: function () {
		var e = dsEsc, s = dsOrganStatus && dsOrganStatus.Cerebellum, st = dsOrganState("Cerebellum");
		var tasks = ((getDeneChainByIdentityPointer("@" + teleonomeName + ":" + NUCLEI_INTERNAL + ":" + DENECHAIN_INTERNAL_CEREBELLUM) || {}).Denes || [])
			.filter(function (d) { return d.DeneType === DENE_TYPE_CEREBELLUM_TASK || d["Dene Type"] === DENE_TYPE_CEREBELLUM_TASK; });
		var outputs = ((getDeneChainByIdentityPointer("@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + DENECHAIN_PURPOSE_CEREBELLUM) || {}).Denes || []);
		var h = '<h4><span class="dg-dot ' + st[0] + '"></span>Cerebellum <small>analyses the data and reports what it finds</small></h4>';
		h += dsKv([["Process", s ? "running, pid " + e(s.cerebellumPid) : "no status file"], ["Last sign of life", st[1]], ["Tasks", "<b>" + tasks.length + "</b>"]]);
		if (!tasks.length) return h + '<div class="dg-note">The Cerebellum is running but has no tasks in the denome yet, so it analyses nothing. Once tasks are added, each one shows here with what it found.</div>';
		h += '<table class="table table-condensed"><tr><th>Task</th><th>Active</th><th>Runs</th><th>Output</th></tr>';
		tasks.forEach(function (t) {
			var w = {};
			(t.DeneWords || []).forEach(function (x) { w[x.Name] = x.Value; });
			var out = outputs.find(function (o) { return o.Name === w["Telepathon Type"] || o.Name === t.Name; });
			var outHtml = out ? '<table class="table table-condensed dg-out">' + (out.DeneWords || []).map(function (x) { return '<tr><td>' + e(x.Name) + '</td><td><b>' + e(x.Value) + '</b></td></tr>'; }).join("") + '</table>' : '<span class="ds-sub">nothing yet</span>';
			h += '<tr><td><b>' + e(t.Name) + '</b></td><td>' + e(w.Active) + '</td><td class="ds-sub">' + e(w["Execution Frequency"] || w["Execution Time"] || w.Expression || "") + '</td><td>' + outHtml + '</td></tr>';
		});
		return h + '</table>';
	},
	Hippocampus: function () {
		var e = dsEsc, s = dsOrganStatus && dsOrganStatus.Hippocampus, st = dsOrganState("Hippocampus"), w = {};
		((s && s.DeneWords) || []).forEach(function (x) { w[x.Name] = x.Value; });
		var h = '<h4><span class="dg-dot ' + st[0] + '"></span>Hippocampus <small>keeps recent Telepathon data in memory, for the charts</small></h4>';
		if (!s) return h + '<p class="ds-sub">No status file.</p>';
		h += dsKv([["Status", e(w.Status)], ["Process", "running, pid " + e(s.hippocampusPid)], ["Last sign of life", st[1]],
			["Points used", e(w.PointsUsed) + " of " + Number(w.PointsAvailable || 0).toLocaleString() + " (" + e(w.PercentageUsed) + "%)"],
			["Preload", w["Preload Data"] ? "yes, " + e(w["Preload Hours"]) + " h · took " + e(w["Pre Load Duration"]) : "no"],
			["Recommended -Xmx", w["Recommended XMX"] ? e(w["Recommended XMX"]) + " MB" : ""], ["Sacrificed points", e(w["Sacrificed Points"])]]);
		if (!Number(w.PointsUsed)) h += '<div class="dg-note">Empty: the Hippocampus holds Telepathon history (Annabelle, Daffodil…), and this Teleonome has none. Its own charts come from the database.</div>';
		return h;
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
