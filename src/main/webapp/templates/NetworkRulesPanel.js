//
// Cleotilde's Network Rules panel (added 2026-10-27; design: OpenWrtOne/documents/07-network-rules-design.md).
// Shows the router's tunnel firewall rules: the gate (lets the WireGuard tunnel in) and the doors (one tunnel
// peer to one LAN host and port). The doors Cleotilde made (2026-11-05: a device's page, "Reach from outside") can be
// closed and removed from anywhere and opened again from the home network (index.html's .doorBtn handler, SetDoor
// form, the router's cleotilde-doors). The doors made by hand on the router are shown read-only.
// The rules are read live from the router through the GetNetworkRules form and never go into the denome,
// which is public. The page is redrawn every pulse, so the data lives in networkRules and its own 30 s timer
// refreshes it.
//
var networkRules = null;
var networkRulesTimer = null;

class NetworkRulesPanel {

	constructor() {
	}

	process() {
		var panelHTML = "";
		panelHTML += "<div class=\"col-lg-12\"><div class=\"bs-component\"><div class=\"panel panel-default\">";
		panelHTML += "<div class=\"panel-heading\"><h4><i class=\"glyphicon glyphicon-lock\"></i> Network Rules</h4></div>";
		panelHTML += "<div class=\"panel-body\" id=\"NetworkRulesPanelBody\">" + networkRulesBodyHTML() + "</div>";
		panelHTML += "</div></div></div>";
		if (networkRulesTimer == null) networkRulesTimer = setInterval(networkRulesRefresh, 30000);
		setTimeout(networkRulesRefresh, 0);
		return panelHTML;
	}
}

function networkRulesBodyHTML() {
	if (networkRules == null) return "<p class=\"text-muted\">Loading...</p>";
	var h = "";
	if (networkRules.Error) h += "<p><span class=\"label label-danger\">router</span> " + doorbellEscape(networkRules.Error) + "</p>";
	var rules = networkRules.Rules || [];
	if (rules.length == 0) return h + (networkRules.Error ? "" : "<p class=\"text-muted\">The router has no tunnel rules.</p>");
	h += "<table class=\"table table-condensed\"><tr><th>Rule</th><th>Kind</th><th>Who</th><th>To</th><th>Port</th><th>State</th><th></th></tr>";
	for (var i = 0; i < rules.length; i++) {
		var r = rules[i];
		var who = r.FromName ? doorbellEscape(r.FromName) + (r.From ? " <span class=\"text-muted\">" + doorbellEscape(r.From) + "</span>" : "") : doorbellEscape(r.From);
		var port = (r.Ports ? doorbellEscape(r.Ports) + " " : "") + "<span class=\"text-muted\">" + doorbellEscape(r.Protocol) + "</span>";
		var state = !r.Enabled ? "<span class=\"label label-default\">off</span>"
			: r.Target == "ACCEPT" ? "<span class=\"label label-success\">open</span>"
			: "<span class=\"label label-warning\">" + doorbellEscape(r.Target) + "</span>";
		h += "<tr><td>" + doorbellEscape(networkRuleLabel(r.Name)) + "</td><td>" + doorbellEscape(r.Kind) + "</td><td>" + who
			+ "</td><td>" + doorbellEscape(r.To) + "</td><td>" + port + "</td><td>" + state + doorTimeLeft(r)
			+ "</td><td class=\"text-right\" style=\"white-space:nowrap\">" + (r.Managed ? doorButtons(r, networkRules.Home) : "<span class=\"text-muted\" title=\"made by hand on the router\">fixed</span>") + "</td></tr>";
	}
	h += "</table>";
	if (!networkRules.Home) h += "<p class=\"text-muted\" style=\"font-size:12px\">You are on " + doorbellEscape(networkRules.ClientIp) + ": doors can be closed from here, and opened only from the home network.</p>";
	return h;
}

// "Cleotilde-Door-PhotoChat" -> "PhotoChat"
function networkRuleLabel(name) {
	return String(name || "").replace(/^Cleotilde-(Door|Gate)-/, "");
}

function networkRulesRefresh() {
	if ($('#NetworkRulesPanelBody').length == 0) return;	// another page is on screen
	$.ajax({
		type: "GET",
		url: "/TeleonomeServlet",
		data: { formName: "GetNetworkRules" },
		dataType: "json",
		success: function (data) {
			networkRules = data;
			$('#NetworkRulesPanelBody').html(networkRulesBodyHTML());
		},
		error: function () {
			networkRules = { Rules: [], Error: "Cleotilde did not answer" };
			$('#NetworkRulesPanelBody').html(networkRulesBodyHTML());
		}
	});
}

// " · 1 h 20 min left" / " · until closed", for an open door Cleotilde manages
function doorTimeLeft(r) {
	if (!r.Managed || !r.Enabled) return "";
	if (!r.Expires) return " <span class=\"text-muted\" style=\"font-size:12px\">until closed</span>";
	var m = Math.max(0, Math.round((r.Expires - Date.now()) / 60000));
	return " <span class=\"text-muted\" style=\"font-size:12px\">" + (m >= 1440 ? Math.floor(m / 1440) + " d " + Math.floor((m % 1440) / 60) + " h" : m >= 60 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : m + " min") + " left</span>";
}

// Close / Open again / Remove for a door Cleotilde manages (index.html's .doorBtn handler does the work)
function doorButtons(r, home) {
	var e = doorbellEscape, label = r.Name || r.To;
	var data = " data-mac=\"" + e(r.Mac) + "\" data-label=\"" + e(label) + "\"";
	var h = "";
	if (r.Enabled) h += "<a href=\"#\" class=\"btn btn-xs btn-warning doorBtn\" data-action=\"close\"" + data + ">Close</a> ";
	else if (home) h += "<a href=\"#\" class=\"btn btn-xs btn-success doorBtn\" data-action=\"open\"" + data + " data-ip=\"" + e(r.To) + "\" data-ports=\"" + e(String(r.Ports).trim().replace(/\s+/g, ",")) + "\" data-source=\"" + e(r.From || "any") + "\">Open again</a> ";
	else h += "<span class=\"text-muted\" style=\"font-size:12px\" title=\"only from the home network\">open from home</span> ";
	return h + "<a href=\"#\" class=\"btn btn-xs btn-default doorBtn\" data-action=\"remove\"" + data + " title=\"Remove the door\"><i class=\"glyphicon glyphicon-trash\"></i></a>";
}
