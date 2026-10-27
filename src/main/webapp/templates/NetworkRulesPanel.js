//
// Cleotilde's Network Rules panel (added 2026-10-27; design: OpenWrtOne/documents/07-network-rules-design.md).
// Shows the router's tunnel firewall rules: the gate (lets the WireGuard tunnel in) and the doors (one tunnel
// peer to one LAN host and port). Read-only for now; opening and closing comes with the rpcd cleotilde plugin.
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
	h += "<table class=\"table table-condensed\"><tr><th>Rule</th><th>Kind</th><th>Who</th><th>To</th><th>Port</th><th>State</th></tr>";
	for (var i = 0; i < rules.length; i++) {
		var r = rules[i];
		var who = r.FromName ? doorbellEscape(r.FromName) + (r.From ? " <span class=\"text-muted\">" + doorbellEscape(r.From) + "</span>" : "") : doorbellEscape(r.From);
		var port = (r.Ports ? doorbellEscape(r.Ports) + " " : "") + "<span class=\"text-muted\">" + doorbellEscape(r.Protocol) + "</span>";
		var state = !r.Enabled ? "<span class=\"label label-default\">off</span>"
			: r.Target == "ACCEPT" ? "<span class=\"label label-success\">open</span>"
			: "<span class=\"label label-warning\">" + doorbellEscape(r.Target) + "</span>";
		h += "<tr><td>" + doorbellEscape(networkRuleLabel(r.Name)) + "</td><td>" + doorbellEscape(r.Kind) + "</td><td>" + who
			+ "</td><td>" + doorbellEscape(r.To) + "</td><td>" + port + "</td><td>" + state + "</td></tr>";
	}
	return h + "</table>";
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
