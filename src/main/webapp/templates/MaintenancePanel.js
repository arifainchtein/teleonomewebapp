//
// Maintenance: stop, fertilize, start (Diagnostics bar, 2026-11-19).
//   Stop Hypothalamus  asks for the code as before and also sends a token made here (kept in this tab, sessionStorage).
//                      The Hypothalamus checks the code, writes HypothalamusStopped.info with the token and an end
//                      time, and exits at the end of its cycle. While that file is there the Medula does not restart
//                      it and does not touch Teleonome.denome.
//   then, in this tab: "Fertilizer" opens below the bar (the sperms in ~/Teleonome/avocado: Dry run, Fertilize, Undo
//                      last), and "Stop Hypothalamus" becomes "Start Hypothalamus", which starts it with the new Denome.
// Everything goes through the Maintenance form (MaintenanceProcessingHandler.java), which does nothing without the
// token or while the Hypothalamus process is still alive.
//
var DS_MAINT_KEY = "dsMaintenanceToken";
var dsMaintStatus = null, dsMaintTimer = null, dsMaintLog = [];

function dsMaintToken() { try { return sessionStorage.getItem(DS_MAINT_KEY); } catch (e) { return null; } }
function dsMaintNewToken() {
	var a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a);
	var t = Array.prototype.map.call(a, function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
	try { sessionStorage.setItem(DS_MAINT_KEY, t); } catch (e) {}
	return t;
}
function dsMaintEsc(s) { return String(s === undefined || s === null ? "" : s).replace(/[&<>"]/g, function (c) { return {"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]; }); }

function dsMaintCall(action, extra) {
	return $.ajax({type: action === "status" ? "GET" : "POST", url: "/TeleonomeServlet", dataType: "json",
		data: $.extend({formName: "Maintenance", action: action, token: dsMaintToken() || ""}, extra || {})});
}

// Ask how things stand and draw the buttons; while stopping or starting, ask again every few seconds.
function dsMaintRefresh() {
	clearTimeout(dsMaintTimer);
	dsMaintCall("status").done(function (s) {
		dsMaintStatus = s;
		if (dsMaintStarting && s["Hypothalamus Running"]) dsMaintStarting = false;   // it is back
		if (s.Stopped) dsMaintStoppingUntil = 0;
		dsMaintDrawButtons();
		var stopping = s.Stopped && s.Mine && s["Hypothalamus Running"];
		if (stopping || dsMaintStarting || Date.now() < dsMaintStoppingUntil) dsMaintTimer = setTimeout(dsMaintRefresh, 3000);
	});
}
var dsMaintStarting = false, dsMaintStoppingUntil = 0;
// index.html's Stop handler, once the request is queued: show "Stopping…" until the file appears (3 minutes at most:
// a wrong code never writes it)
function dsMaintStopRequested() { dsMaintStoppingUntil = Date.now() + 180000; dsMaintRefresh(); }

function dsMaintDrawButtons() {
	var s = dsMaintStatus || {}, box = $("#DSMaintenance");
	var stop = $("#StopHypothalamusButton");
	box.empty();
	if (s.Stopped && s.Mine) {
		var until = new Date(s.Until), hm = ("0" + until.getHours()).slice(-2) + ":" + ("0" + until.getMinutes()).slice(-2);
		if (s["Hypothalamus Running"]) {
			stop.addClass("disabled").html('<i class="glyphicon glyphicon-hourglass"></i> Stopping at the end of this cycle…');
			return;
		}
		stop.hide();
		box.html('<span class="dg-maint-note">Stopped for maintenance until ' + hm + '</span>'
			+ '<button id="FertilizerButton" class="btn btn-primary"><i class="glyphicon glyphicon-grain"></i> Fertilizer</button>'
			+ '<button id="StartHypothalamusButton" class="btn btn-success"><i class="glyphicon glyphicon-play"></i> Start Hypothalamus</button>');
	} else if (s.Stopped) {
		stop.hide();
		box.html('<span class="dg-maint-note">Stopped for maintenance from another browser until ' + dsMaintEsc(s["Until Text"]) + '</span>');
	} else if (Date.now() < dsMaintStoppingUntil) {
		stop.show().addClass("disabled").html('<i class="glyphicon glyphicon-hourglass"></i> Stopping at the end of this cycle…');
	} else if (dsMaintStarting) {
		stop.hide();
		box.html('<span class="dg-maint-note"><i class="glyphicon glyphicon-hourglass"></i> Starting the Hypothalamus…</span>');
	} else {
		stop.show().removeClass("disabled").html('<i class="glyphicon glyphicon-stop"></i> Stop Hypothalamus');
	}
}

// ---- the Fertilizer, below the bar ----

function dsMaintOpenFertilizer() {
	var s = dsMaintStatus || {}, w = $("#DiagnosticsWorkArea");
	dsDiagCurrent = "Fertilizer";
	$(".dg-btn").removeClass("on");
	var h = '<div class="dg-fert"><h4>Fertilizer <small>a sperm adds to this Teleonome\'s Denome; nothing changes until you press Fertilize</small></h4>';
	var sperms = s.Sperms || [];
	if (!sperms.length) h += '<p class="text-muted">There are no sperms in ~/Teleonome/avocado. Copy the .sperm files there first.</p>';
	h += '<div class="dg-sperms">' + sperms.map(function (sp, i) {
		return '<label class="dg-sperm"><input type="radio" name="dgSperm" value="' + dsMaintEsc(sp.Name) + '"' + (i === 0 ? ' checked' : '') + '>'
			+ '<span><b>' + dsMaintEsc(sp.Name) + '</b><small>' + dsMaintEsc(sp.Description) + '</small></span></label>';
	}).join("") + '</div>';
	h += '<div class="dg-fert-actions">'
		+ '<button class="btn btn-default" id="DgDryRun"' + (sperms.length ? '' : ' disabled') + '><i class="glyphicon glyphicon-eye-open"></i> Dry run</button>'
		+ '<button class="btn btn-primary" id="DgFertilize"' + (sperms.length ? '' : ' disabled') + '><i class="glyphicon glyphicon-grain"></i> Fertilize</button>'
		+ '<button class="btn btn-default" id="DgUndo"' + (s["Can Undo"] ? '' : ' disabled') + '><i class="glyphicon glyphicon-share-alt"></i> Undo last</button></div>';
	h += '<div id="DgFertDone">' + dsMaintLogHTML() + '</div><div id="DgFertResult"></div></div>';
	w.html(h).show();
}

function dsMaintLogHTML() {
	if (!dsMaintLog.length) return "";
	return '<p class="dg-fert-log"><b>This stop:</b> ' + dsMaintLog.map(dsMaintEsc).join(" → ") + '. Press Start Hypothalamus to run with it.</p>';
}

function dsMaintResultHTML(r) {
	if (r.error) return '<div class="alert alert-danger">' + dsMaintEsc(r.error) + '</div>';
	var ok = r.OK, h = '<div class="alert ' + (ok ? (r.Written ? "alert-success" : "alert-info") : "alert-danger") + '">'
		+ (ok ? (r.Written ? "Fertilized <b>" + dsMaintEsc(r.Sperm) + "</b> into Teleonome.denome (the Denome from before is kept: " + dsMaintEsc(r.Backup) + ")."
			: "Dry run of <b>" + dsMaintEsc(r.Sperm) + "</b>: nothing was written.")
			: "<b>" + dsMaintEsc(r.Sperm) + "</b> was refused: " + dsMaintEsc(r.Failure) + " Nothing was written.") + '</div>';
	var changes = r.Changes || [], problems = r["Introduced Problems"] || [];
	h += '<p><b>' + changes.length + ' change' + (changes.length === 1 ? '' : 's') + '</b>'
		+ (r["Problems Before"] ? ' <span class="text-muted">(the Denome already had ' + r["Problems Before"] + ' problems of its own; only new ones stop a fertilization)</span>' : '') + '</p>';
	if (changes.length) h += '<table class="table table-condensed dg-fert-table"><tr><th>What</th><th>Where</th></tr>'
		+ changes.map(function (c) { return '<tr><td>' + dsMaintEsc(c.Type) + '</td><td>' + dsMaintEsc(c.Path) + (c.Attribute ? ' · ' + dsMaintEsc(c.Attribute) : '') + '</td></tr>'; }).join("") + '</table>';
	if (problems.length) h += '<p><b>New problems</b></p><ul>' + problems.map(function (p) { return '<li>' + dsMaintEsc(typeof p === "string" ? p : JSON.stringify(p)) + '</li>'; }).join("") + '</ul>';
	if ((r.Messages || []).length) h += '<details><summary>Fertilizer messages</summary><pre class="dg-fert-pre">' + dsMaintEsc(r.Messages.join("\n")) + '</pre></details>';
	return h;
}

function dsMaintFertilize(action) {
	var sperm = $("input[name=dgSperm]:checked").val();
	if (!sperm) return;
	if (action === "fertilize" && !confirm("Fertilize " + sperm + " into this Teleonome's Denome?")) return;
	$("#DgFertResult").html('<p class="text-muted"><i class="glyphicon glyphicon-hourglass"></i> ' + (action === "dryrun" ? "Trying" : "Fertilizing") + ' ' + dsMaintEsc(sperm) + '…</p>');
	$(".dg-fert-actions button").prop("disabled", true);
	dsMaintCall(action, {sperm: sperm}).done(function (r) {
		if (r.Written) dsMaintLog.push(sperm);
		$("#DgFertDone").html(dsMaintLogHTML());
		$("#DgFertResult").html(dsMaintResultHTML(r));
	}).fail(function (x) {
		$("#DgFertResult").html('<div class="alert alert-danger">The Teleonome did not answer (' + x.status + ').</div>');
	}).always(function () {
		dsMaintCall("status").done(function (s) { dsMaintStatus = s; $(".dg-fert-actions button").prop("disabled", false); $("#DgUndo").prop("disabled", !s["Can Undo"]); });
	});
}

$(document).on("click", "#FertilizerButton", function (e) { e.preventDefault(); dsMaintOpenFertilizer(); });
$(document).on("click", "#DgDryRun", function (e) { e.preventDefault(); dsMaintFertilize("dryrun"); });
$(document).on("click", "#DgFertilize", function (e) { e.preventDefault(); dsMaintFertilize("fertilize"); });
$(document).on("click", "#DgUndo", function (e) {
	e.preventDefault();
	if (!confirm("Put back the Denome from before the last fertilization?")) return;
	dsMaintCall("undo").done(function (r) {
		if (!r.error) dsMaintLog.pop();
		$("#DgFertDone").html(dsMaintLogHTML());
		$("#DgFertResult").html(r.error ? dsMaintResultHTML(r) : '<div class="alert alert-info">Undone: the Denome from before ' + dsMaintEsc(r.Undone) + ' is back.</div>');
		dsMaintCall("status").done(function (s) { dsMaintStatus = s; $("#DgUndo").prop("disabled", !s["Can Undo"]); });
	});
});
$(document).on("click", "#StartHypothalamusButton", function (e) {
	e.preventDefault();
	if (!confirm("Start the Hypothalamus" + (dsMaintLog.length ? " with the fertilized Denome" : "") + "?")) return;
	dsMaintCall("start").done(function (r) {
		if (r.error) { alert(r.error); return; }
		try { sessionStorage.removeItem(DS_MAINT_KEY); } catch (err) {}
		dsMaintLog = [];
		dsMaintStarting = true;
		$("#DiagnosticsWorkArea").hide().empty();
		dsDiagCurrent = null;
		dsMaintRefresh();
	});
});
