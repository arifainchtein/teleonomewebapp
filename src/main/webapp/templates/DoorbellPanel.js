//
// Cleotilde's Doorbell panel (added 2026-10-20; design: OpenWrtOne/documents/07-network-rules-design.md).
// Shows the doorbell rings that came through Zhinu and the board's lock: after 5 wrong codes in an hour
// the board refuses every code (Cleotilde's own commands too). Release clears it; there is no code to
// type because the locked board would refuse it, and only the home network reaches this page.
// The page is redrawn every pulse, so the data lives in doorbellStatus and its own 5 s timer refreshes it.
//
var doorbellStatus = null;
var doorbellTimer = null;

class DoorbellPanel {

	constructor() {
	}

	process() {
		var panelHTML = "";
		panelHTML += "<div class=\"col-lg-12\"><div class=\"bs-component\"><div class=\"panel panel-default\">";
		panelHTML += "<div class=\"panel-heading\"><h4><i class=\"glyphicon glyphicon-bell\"></i> Doorbell</h4></div>";
		panelHTML += "<div class=\"panel-body\" id=\"DoorbellPanelBody\">" + doorbellBodyHTML() + "</div>";
		panelHTML += "</div></div></div>";
		if (doorbellTimer == null) doorbellTimer = setInterval(doorbellRefresh, 5000);
		setTimeout(doorbellRefresh, 0);
		return panelHTML;
	}
}

function doorbellEscape(s) {
	return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function doorbellBodyHTML() {
	if (doorbellStatus == null) return "<p class=\"text-muted\">Loading...</p>";
	var status = doorbellStatus.Status || {};
	var wrong = status.WrongCodesLastHour;
	var h = "<p>";
	if (status.Locked) {
		h += "<span class=\"label label-danger\" style=\"font-size:100%\">LOCKED</span> 5 wrong codes in the last hour: the board refuses every code until you release it.";
	} else {
		h += "<span class=\"label label-success\" style=\"font-size:100%\">open</span> ";
		h += wrong == undefined || wrong < 0 ? "" : wrong + " of 5 wrong codes in the last hour.";
	}
	h += "</p>";
	if (doorbellStatus.ReleasePending) {
		h += "<p><span class=\"label label-info\">release on its way, within 10 s</span></p>";
	} else {
		h += "<button class=\"btn " + (status.Locked ? "btn-danger" : "btn-default") + "\" onclick=\"doorbellRelease();return false;\">"
			+ "<i class=\"glyphicon glyphicon-repeat\"></i> Release lock</button>";
	}
	if (status.LastRelease > 0) {
		h += " <span class=\"text-muted\">last released " + new Date(status.LastRelease).toLocaleString() + " (" + doorbellEscape(status.LastReleaseResult) + ")</span>";
	}
	var rings = (doorbellStatus.Messages || []).slice().reverse();
	h += "<h5 style=\"padding-top:15px\">Recent rings</h5>";
	if (rings.length == 0) return h + "<p class=\"text-muted\">None yet.</p>";
	h += "<table class=\"table table-condensed\"><tr><th>Received</th><th>Services</th><th>Hours</th><th>Result</th><th>Open until</th><th>Left</th></tr>";
	for (var i = 0; i < rings.length && i < 10; i++) {
		var r = rings[i];
		var label = r.Result == "valid" ? "label-success" : r.Result == "expired" ? "label-warning" : "label-danger";
		var services = (r.Services || []).join(", ");
		// a valid ring opens its services for Minutes from when it was accepted
		var expiry = r.Result == "valid" && r.Received ? r.Received + (r.Minutes || 0) * 60000 : null;
		h += "<tr><td>" + new Date(r.Received).toLocaleString() + "</td><td>" + doorbellEscape(services == "" ? "(code test)" : services)
			+ "</td><td>" + Math.round((r.Minutes || 0) / 60 * 10) / 10 + "</td><td><span class=\"label " + label + "\">" + doorbellEscape(r.Result) + "</span>"
			+ "</td><td>" + (expiry == null ? "" : new Date(expiry).toLocaleString())
			+ "</td><td>" + (expiry == null ? "" : doorbellRemaining(expiry)) + "</td></tr>";
	}
	return h + "</table>";
}

function doorbellRemaining(expiry) {
	var left = expiry - Date.now();
	if (left <= 0) return "ended";
	var minutes = Math.ceil(left / 60000);
	return (minutes >= 60 ? Math.floor(minutes / 60) + " h " : "") + (minutes % 60) + " min left";
}

function doorbellRefresh() {
	if ($('#DoorbellPanelBody').length == 0) return;	// another page is on screen
	$.ajax({
		type: "GET",
		url: "/TeleonomeServlet",
		data: { formName: "GetDoorbellStatus" },
		dataType: "json",
		success: function (data) {
			doorbellStatus = data;
			$('#DoorbellPanelBody').html(doorbellBodyHTML());
		}
	});
}

function doorbellRelease() {
	$.ajax({
		type: "POST",
		url: "/TeleonomeServlet",
		data: { formName: "ReleaseDoorbellLock" },
		dataType: "json",
		success: function (data) {
			if (data.error) alert(data.error);
			doorbellRefresh();
		},
		error: function () {
			alert("Cleotilde did not answer");
		}
	});
}
