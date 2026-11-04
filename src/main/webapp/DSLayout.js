//
// Compact Digital Stables layout (Cleotilde redesign, 2026-11-04).
//
// Switched on per Teleonome by the denome: when Human Interface Control Parameters has a dene named "Header",
// body gets the ds-theme class (css/digitalstables.css) and this file draws
//   - the header: logo, the Data / Status lamps, Last Pulse, the counter since the last pulse (the existing
//     #TeleonomeDataStatus, #TeleonomeStatus, #PulseTimestamp and #TimeSinceLastPulse elements are moved in,
//     so the code that colours and fills them is unchanged), plus one value group on the right (e.g. WAN speed);
//   - the emergency banner and the amber warning note, from the rule denes of the chain "Status Rules Pointer"
//     points at (the Status Well): a rule with "Emergency Title" that is in alarm is an emergency, the lowest
//     "Emergency Position" wins (so router before modem before ISP: it says where it broke);
//   - footer badges ("Nav Badge Pointer" on a page dene in Control Parameters).
// It also holds the new panel styles: Compact Value Card, Compact Line Chart and Power Panel.
// Without a Header dene nothing here runs and the page looks as before.
//
// Header dene (Control Parameters):  Logo Image = images/Cleotilde.svg
//                                    Header Value Title = WAN
//                                    Header Value Pointer = @T:Human Interface:Header Values   (Display Name + Panel Data Source Pointer per dene)
//                                    Status Rules Pointer = @T:Human Interface:Cleotilde Status Well
//

var dsHeaderDene = null;
var dsEmergencyAcked = {};		// emergency title -> true, this browser only
var dsChartHours = 24;
var dsPendingCharts = [];		// [{id, chain}] drawn after the page HTML is on screen
var dsChartCache = {};			// identity + hours -> {at, rows}

function dsEsc(s) {
	return String(s === undefined || s === null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function dsWord(dene, name) {
	if (!dene || !dene.DeneWords) return undefined;
	for (var i = 0; i < dene.DeneWords.length; i++) if (dene.DeneWords[i].Name === name) return dene.DeneWords[i].Value;
	return undefined;
}

function dsWordByType(dene, type) {
	if (!dene || !dene.DeneWords) return undefined;
	for (var i = 0; i < dene.DeneWords.length; i++) if (dene.DeneWords[i]["DeneWord Type"] === type) return dene.DeneWords[i].Value;
	return undefined;
}

// the DeneWord a panel dene's "Panel Data Source Pointer" points at (undefined when it has none)
function dsSourceWord(dene) {
	var pointer = dsWordByType(dene, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER);
	return pointer ? getDeneWordByIdentityPointer(pointer, COMPLETE) : undefined;
}

function dsControlParameters() {
	return getDeneChainByIdentityPointer("@" + teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":" + DENECHAIN_TYPE_HUMAN_INTERFACE_CONTROL_PARAMETERS);
}

// Called by RefreshInterface before the page is drawn.
function dsApplyLayout() {
	dsHeaderDene = null;
	var cp = dsControlParameters();
	if (cp && cp.Denes) {
		for (var i = 0; i < cp.Denes.length; i++) if (cp.Denes[i].Name === DS_HEADER_DENE) dsHeaderDene = cp.Denes[i];
	}
	$('body').toggleClass('ds-theme', dsHeaderDene != null);
	if (dsHeaderDene) dsRenderHeader();
}

function dsActive() { return dsHeaderDene != null; }

// value + units, made readable: seconds as 6h 9m, True/False as Yes/No
function dsDuration(sec) {
	sec = Math.round(sec);
	var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
	return (d ? d + "d " : "") + (d || h ? h + "h " : "") + m + "m";
}

function dsFormat(word) {
	var v = word ? word.Value : "N.A.", u = word && word.Units ? word.Units : "";
	if (u === "seconds" && !isNaN(parseFloat(v))) return { v: dsDuration(parseFloat(v)), u: "" };
	if (u === "millisec" || u === "ms") { if (!isNaN(parseFloat(v))) v = Math.round(parseFloat(v)); u = "ms"; }
	if (u === "kbytes/sec") u = "kB/s";
	if (u === "C") u = "°C";
	if (v === true || v === "True" || v === "true") v = "Yes"; else if (v === false || v === "False" || v === "false") v = "No";
	return { v: v, u: u };
}

function dsHHMM(ms) {
	var d = new Date(ms);
	return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
}

// ------------------------------------------------------------------ header

function dsRenderHeader() {
	var h = $('#DSHeader');
	if (!h.find('.ds-logo').length) {
		h.html('<img class="ds-logo" alt="">'
			+ '<div class="ds-hcell"><div class="ds-lamps" id="DSLamps"></div><div class="ds-cap"><span>Data</span><span>Status</span></div></div>'
			+ '<div class="ds-hcell"><div class="ds-cap">Last Pulse</div><div class="ds-big" id="DSPulse"></div></div>'
			+ '<div class="ds-hcell"><div class="ds-cap">Since last pulse</div><div class="ds-big" id="DSSince"></div></div>'
			+ '<span class="ds-alert" id="DSAlert" style="display:none"></span>'
			+ '<div class="ds-hcell ds-hvalue"><div class="ds-cap" id="DSHValueTitle"></div><div class="ds-big" id="DSHValue"></div></div>');
		// the existing elements move in; the code that fills and colours them keeps working
		$('#TeleonomeDataStatus').appendTo('#DSLamps');
		$('#TeleonomeStatus').appendTo('#DSLamps');
		$('#PulseTimestamp').appendTo('#DSPulse');
		$('#TimeSinceLastPulse').appendTo('#DSSince');
	}
	h.find('.ds-logo').attr('src', dsWord(dsHeaderDene, DS_HEADER_LOGO_IMAGE) || '').attr('alt', teleonomeName);
	$('#TeleonomeDataStatus, #TeleonomeStatus').show();

	// the value group on the right (WAN speed on Cleotilde)
	var title = dsWord(dsHeaderDene, DS_HEADER_VALUE_TITLE) || "";
	var chainPointer = dsWord(dsHeaderDene, DS_HEADER_VALUE_POINTER);
	var html = "", units = "";
	var chain = chainPointer ? getDeneChainByIdentityPointer(chainPointer) : null;
	if (chain && chain.Denes) {
		dsSortByPosition(chain.Denes).forEach(function (d) {
			var w = dsSourceWord(d);
			var f = dsFormat(w);
			html += (html ? " &nbsp;" : "") + dsEsc(dsWord(d, "Display Name") || "") + " " + dsEsc(f.v);
			units = f.u;
		});
	}
	$('#DSHValueTitle').text(title);
	$('#DSHValue').html(html + (units ? ' <small>' + dsEsc(units) + '</small>' : ''));
	dsRenderStatusRules();
}

function dsSortByPosition(denes) {
	return denes.slice().sort(function (a, b) {
		return (parseFloat(dsWord(a, "Panel In Panel Position")) || 0) - (parseFloat(dsWord(b, "Panel In Panel Position")) || 0);
	});
}

// The Status Well's rules: an emergency banner for the first emergency rule in alarm, an amber note for the rest.
function dsRenderStatusRules() {
	var pointer = dsWord(dsHeaderDene, DS_HEADER_STATUS_RULES_POINTER);
	var chain = pointer ? getDeneChainByIdentityPointer(pointer) : null;
	var emergency = null, notes = [], level = "";
	if (chain && chain.Denes) {
		chain.Denes.forEach(function (d) {
			if (!deneHasDeneWordProperty(d, "Rule Source Pointer")) return;
			var r = panelRuleResult(d);
			if (!r.level) return;
			var title = dsWord(d, DS_EMERGENCY_TITLE);
			if (title && r.level === "danger") {
				var pos = parseFloat(dsWord(d, DS_EMERGENCY_POSITION)) || 99;
				if (!emergency || pos < emergency.pos) emergency = { pos: pos, title: title, advice: dsWord(d, DS_EMERGENCY_ADVICE) || "", reason: r.reason };
			} else {
				notes.push(r.reason);
				if (level !== "danger") level = r.level;
			}
		});
	}
	var el = $('#DSEmergency');
	if (emergency) {
		var acked = dsEmergencyAcked[emergency.title];
		el.html('<div class="ds-emerg' + (acked ? ' acked' : '') + '"><div class="ds-in"><span class="ds-ic glyphicon glyphicon-alert"></span>'
			+ '<div><div class="ds-t">' + dsEsc(emergency.title) + '</div><div class="ds-d">' + dsEsc(emergency.reason) + ' · <b>' + dsEsc(emergency.advice) + '</b></div></div>'
			+ '<div class="ds-acts">' + (acked ? '<small>acknowledged · stays until fixed</small>'
				: '<button class="btn btn-sm" onclick="dsEmergencyAcked[\'' + dsEsc(emergency.title).replace(/'/g, "\\'") + '\']=true;dsRenderStatusRules();return false;">Acknowledge</button>')
			+ '</div></div></div>');
		document.title = "⚠ " + emergency.title + " · " + teleonomeName;
		$('#DSAlert').hide();   // the banner says it better
	} else {
		el.empty();
		document.title = teleonomeName;
		if (notes.length) $('#DSAlert').removeClass('danger').addClass(level === "danger" ? "danger" : "").text(notes.join(" · ")).show();
		else $('#DSAlert').hide();
	}
}

// ------------------------------------------------------------------ footer

// extra HTML for a page's footer button: a badge from "Nav Badge Pointer" when it is above 0
function dsNavBadge(pageDene) {
	if (!dsActive()) return "";
	var pointer = dsWord(pageDene, DS_NAV_BADGE_POINTER);
	if (!pointer) return "";
	try {
	var v = parseFloat(getDeneWordByIdentityPointer(pointer, DENEWORD_VALUE_ATTRIBUTE));
	return v > 0 ? '<span class="badge">' + v + '</span>' : "";
	} catch (e) { return ""; }
}

// ------------------------------------------------------------------ Compact Value Card

// One Human Interface chain (Internet, WAN, Router...) as a small card: one row per dene, coloured by the dene's
// Warning / Alarm rules (panelRuleResult). Leaves 5 divs open: renderPageByPointer closes them.
class CompactValueCard {
	process(title, panelDeneChain) {
		var level = "", rows = "";
		var sorted = sortDenesInASingleValuePanel(panelDeneChain)["_map"];
		for (var k in sorted) {
			var d = sorted[k];
			var pointer = dsWordByType(d, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER);
			if (!pointer) continue;
			var w = getDeneWordByIdentityPointer(pointer, COMPLETE);
			var r = panelRuleResult(d);
			if (r.level === "danger" || (r.level === "warning" && level !== "danger")) level = r.level;
			var f = dsFormat(w);
			rows += '<div class="ds-kv ' + r.level + '"' + (r.reason ? ' title="' + dsEsc(r.reason) + '"' : '') + '><span class="k">' + dsEsc(dsWord(d, "Display Name"))
				+ '</span><span class="v">' + dsEsc(f.v) + (f.u ? '<span class="u">' + dsEsc(f.u) + '</span>' : '') + '</span></div>';
		}
		return '<div class="col-lg-2 col-md-4 col-sm-4 col-xs-6"><div class="ds-card ' + level + '"><h5>' + dsEsc(title) + '</h5><div><div><div>' + rows;   // 5 open: col, card, 3 here
	}
}

// ------------------------------------------------------------------ Compact Line Chart

// A chart chain: one dene per line (Display Name, Panel Data Source Pointer, Color, optional Warning Above /
// Alarm Above drawn as dashed lines). History from remembereddenewords (HippocampusQuery rememberedReport),
// so every value needs a "Remember ..." Mnemosycon. Leaves 5 divs open.
class CompactLineChart {
	process(title, panelDeneChain, id) {
		var denes = dsSortByPosition(panelDeneChain.Denes || []);
		var units = "";
		var legend = denes.map(function (d) {
			var w = dsSourceWord(d);
			if (w && w.Units) units = dsFormat(w).u;
			return '<i style="background:' + dsEsc(dsWord(d, DS_CHART_COLOR) || "#2da040") + '"></i>' + dsEsc(dsWord(d, "Display Name"));
		}).join("");
		var buttons = [6, 24].map(function (hr) {
			return '<button class="btn ' + (dsChartHours === hr ? 'btn-primary' : 'btn-default') + '" onclick="dsChartHours=' + hr + ';renderPageToDisplay();return false;">' + hr + 'h</button>';
		}).join("");
		dsPendingCharts.push({ id: id, chain: panelDeneChain, units: units });
		return '<div class="col-lg-6 col-xs-12"><div class="ds-block ds-chart"><h5><span>' + dsEsc(title) + ' <small class="ds-sub">' + dsEsc(units) + '</small><span class="ds-legend">' + legend + '</span></span>'
			+ '<span class="btn-group btn-group-xs">' + buttons + '</span></h5><div class="ds-plot" id="' + id + '"><div><div>';   // 5 open: col, block, plot, 2 here
	}
}

// draw every chart the page just rendered (called by renderPageByPointer after the HTML is appended)
function dsDrawPendingCharts() {
	var list = dsPendingCharts;
	dsPendingCharts = [];
	list.forEach(function (c) {
		var denes = dsSortByPosition(c.chain.Denes || []);
		var series = denes.map(function (d) {
			return { name: dsWord(d, "Display Name"), color: dsWord(d, DS_CHART_COLOR) || "#2da040",
				identity: dsWordByType(d, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER),
				warning: parseFloat(dsWord(d, "Warning Above")), alarm: parseFloat(dsWord(d, "Alarm Above")), pts: null };
		});
		var left = series.length;
		series.forEach(function (s) {
			dsFetchHistory(s.identity, dsChartHours, function (rows) {
				s.pts = rows;
				if (--left === 0) dsDrawChart(c.id, series, c.units);
			});
		});
	});
}

function dsFetchHistory(identity, hours, callback) {
	var key = identity + "|" + hours, hit = dsChartCache[key];
	if (hit && Date.now() - hit.at < 60000) { callback(hit.rows); return; }
	$.ajax({
		type: "POST", url: "/TeleonomeServlet", dataType: "json",
		data: { formName: "HippocampusQuery", command: "rememberedReport", identity: identity, rangeMs: hours * 3600000 },
		success: function (r) {
			var rows = (r.data || []).filter(function (p) { return p.Value !== null && p.Value !== "" && !isNaN(+p.Value); })
				.map(function (p) { return [p["Pulse Timestamp in Milliseconds"], +p.Value]; })
				.sort(function (a, b) { return a[0] - b[0]; });
			dsChartCache[key] = { at: Date.now(), rows: rows };
			callback(rows);
		},
		error: function () { callback([]); }
	});
}

function dsDrawChart(id, series, units) {
	var el = document.getElementById(id);
	if (!el || typeof d3 === "undefined") return;
	el.innerHTML = "";
	var all = [].concat.apply([], series.map(function (s) { return s.pts || []; }));
	if (!all.length) {
		el.innerHTML = '<div class="ds-nodata">No history yet.<br>Cleotilde has to remember these values (a "Remember ..." Mnemosycon).</div>';
		return;
	}
	var to = Date.now(), from = to - dsChartHours * 3600e3;
	var W = el.clientWidth || 600, H = 170, m = { t: 10, r: 12, b: 22, l: 40 };
	var ymax = d3.max(all, function (p) { return p[1]; });
	series.forEach(function (s) { if (!isNaN(s.warning)) ymax = Math.max(ymax, s.warning * 1.05); });
	var x = d3.scaleTime().domain([from, to]).range([m.l, W - m.r]);
	var y = d3.scaleLinear().domain([0, (ymax * 1.1) || 1]).nice().range([H - m.b, m.t]);
	var svg = d3.select(el).append("svg").attr("viewBox", "0 0 " + W + " " + H);
	// inline styles: index.html has a page-wide "path { stroke: steelblue; fill: none }" for the old charts
	svg.append("g").attr("transform", "translate(0," + (H - m.b) + ")").call(d3.axisBottom(x).ticks(6).tickSizeOuter(0)).style("color", "#aaa");
	svg.append("g").attr("transform", "translate(" + m.l + ",0)").call(d3.axisLeft(y).ticks(4).tickSize(-(W - m.l - m.r))).style("color", "#aaa")
		.call(function (g) { g.select(".domain").remove(); g.selectAll(".tick line").style("stroke", "#eee"); });
	series.forEach(function (s) {
		[["warning", "#f9a825"], ["alarm", "#e53935"]].forEach(function (rc) {
			var v = s[rc[0]];
			if (isNaN(v) || v > y.domain()[1]) return;
			svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(v)).attr("y2", y(v)).style("stroke", rc[1]).style("stroke-dasharray", "4 3");
		});
		var pts = (s.pts || []).filter(function (p) { return p[0] >= from; });
		svg.append("path").datum(pts).attr("d", d3.line().x(function (p) { return x(p[0]); }).y(function (p) { return y(p[1]); }))
			.style("fill", "none").style("stroke", s.color).style("stroke-width", 1.5);
	});
	var tip = d3.select(el).append("div").attr("class", "ds-tip");
	var vline = svg.append("line").attr("y1", m.t).attr("y2", H - m.b).style("stroke", "#999").style("display", "none");
	var bis = d3.bisector(function (p) { return p[0]; }).center;
	svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", H - m.t - m.b).style("fill", "transparent").style("stroke", "none")
		.on("mousemove", function (ev) {
			var px = d3.pointer(ev)[0], t = +x.invert(px), html = dsHHMM(t);
			series.forEach(function (s) {
				if (!s.pts || !s.pts.length) return;
				var p = s.pts[bis(s.pts, t)];
				html += '<br><span style="color:' + s.color + '">■</span> ' + dsEsc(s.name) + ' ' + p[1] + ' ' + dsEsc(units);
			});
			vline.style("display", null).attr("x1", px).attr("x2", px);
			tip.style("display", "block").style("left", Math.min(px + 12, W - 150) + "px").html(html);
		})
		.on("mouseleave", function () { tip.style("display", "none"); vline.style("display", "none"); });
}

// ------------------------------------------------------------------ Power Panel

// Restart / Turn off, moved from Settings. Same button ids, so index.html's handlers (6-digit code) do the work.
class PowerPanel {
	process() {
		return '<div class="col-lg-12"><div class="ds-block"><h5><span><i class="glyphicon glyphicon-off"></i> Power</span></h5>'
			+ '<div style="padding:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
			+ '<button id="RestartButton" class="btn btn-default"><i class="glyphicon glyphicon-repeat"></i> Restart</button>'
			+ '<button id="ShutdownButton" class="btn btn-danger"><i class="glyphicon glyphicon-off"></i> Turn off safely</button>'
			+ '<span class="ds-sub">Both ask for the 6-digit code.</span><div><div>';   // 5 open: col, block, button row, 2 here
	}
}
