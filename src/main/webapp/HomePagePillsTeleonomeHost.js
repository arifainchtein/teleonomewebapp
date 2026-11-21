// Home Page Pills (2026-11-19): the Teleonome's side of deviceviews-tabs.js, so Annabelle's Home page shows the same
// pills as devices.digitalstables.com: Map, Weather, then the pages a person makes, then "+ New tab".
//
// Everything comes from the Denome (sperm HumanInterfacePages, Avocado hud/HumanInterfacePages.hud):
//   Human Interface:Home Page:Home Page Pills Panel  style "Home Page Pills", points at the chain below
//   Human Interface:Home Page Pills                 "Map" (Built In Pill, Pill View "Telepathon Map"),
//                                                   "Pill Settings" (Allow New Pages, the three mutations' names)
// A tab is a Human Interface page (agreed 2026-11-08, DevicesDigitalStables/docs/annabelle_greenhouse_tab_denomic_elements.json):
//   Human Interface Control Parameters:<Tab>   Page Title, Page Position, Include in Navigation false,
//                                              Home Page Pill true, DeneChainPointer -> <Tab> Page
//   Human Interface:<Tab> Page                 one dene, "<Tab> Panel": style "Telepathon Values Panel" -> <Tab>
//   Human Interface:<Tab>                      one "Panel Value" dene per tile
//   Human Interface:<Tab> Conditions           one "Panel Condition" dene per colour rule
// Saving sends all of it as a structural payload (framework StructuralPayload) to Create / Update Human Interface
// Page, removing sends Delete; the 6-digit code goes with it (RequestStructuralMutation handler). The answer comes
// back on the Heart's UpdateFormResponse (receivedCommandResponse hands it to homePagePillsCommandAnswer).
// The page is rebuilt every pulse, so the pills' node is kept and put back (like DiagnosticsBar's dsHippoNode).

var HOME_PAGE_PILLS_STYLE = "Home Page Pills";
var TELEPATHON_VALUES_PANEL_STYLE = "Telepathon Values Panel";
var dsPillsNode = null, dsPillsTabs = null, dsPillsChain = null, dsPillsMap = null;
var dsPillsPending = {};   // command id -> {resolve, reject, timer}

// ---- reading the Denome ----

function dsHI(chainName) { return humanInterfaceDeneChainIndex.get("@" + teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":" + chainName); }
function dsDene(chain, name) { return ((chain && chain.Denes) || []).filter(function(d) { return d.Name === name; })[0] || null; }
function dsWord(dene, name) { var w = ((dene && dene.DeneWords) || []).filter(function(x) { return x.Name === name; })[0]; return w ? w.Value : undefined; }
function dsWordsOfType(dene, type) { return ((dene && dene.DeneWords) || []).filter(function(x) { return x["DeneWord Type"] === type; }); }
function dsChainByPointer(pointer) { return pointer ? humanInterfaceDeneChainIndex.get(pointer) : null; }
// "@Annabelle:Telepathons:TopTank:Purpose:Outdoor Temperature" -> ["Annabelle","Telepathons","TopTank","Purpose","Outdoor Temperature"]
function dsParts(pointer) { return typeof pointer === "string" && pointer.charAt(0) === "@" ? pointer.substring(1).split(":") : []; }

function dsPillSettings() {
	var s = dsDene(dsPillsChain, "Pill Settings");
	return {
		allowNew: dsWord(s, "Allow New Pages") !== false,
		create: dsWord(s, "Create Mutation") || "Create Human Interface Page",
		update: dsWord(s, "Update Mutation") || "Update Human Interface Page",
		remove: dsWord(s, "Delete Mutation") || "Delete Human Interface Page"
	};
}

// "Value>35" -> {op: ">", value: 35}
function dsParseExpression(expr) {
	var m = /^\s*Value\s*(<=|>=|<|>)\s*(-?\d+(?:\.\d+)?)\s*$/.exec(expr || "");
	return m ? {op: m[1], value: parseFloat(m[2])} : null;
}

// The pages with "Home Page Pill" true, as deviceviews tabs {id, name, items, position}.
function dsReadPillTabs() {
	var cp = dsHI("Human Interface Control Parameters"), tabs = [];
	((cp && cp.Denes) || []).forEach(function(page) {
		if (dsWord(page, "Home Page Pill") !== true) return;
		var pageChain = dsChainByPointer(dsWord(page, "DeneChainPointer"));
		var items = [];
		((pageChain && pageChain.Denes) || []).forEach(function(panel) {
			var style = (dsWordsOfType(panel, DENEWORD_TYPE_PANEL_VISUALIZATION_STYLE)[0] || {}).Value;
			if (style !== TELEPATHON_VALUES_PANEL_STYLE) return;
			var valuesChain = dsChainByPointer((dsWordsOfType(panel, DENEWORD_TYPE_PANEL_DENECHAIN_POINTER)[0] || {}).Value);
			var values = ((valuesChain && valuesChain.Denes) || []).filter(function(d) { return d["Dene Type"] === "Panel Value"; });
			values.sort(function(a, b) { return (dsWord(a, "Panel In Panel Position") || 0) - (dsWord(b, "Panel In Panel Position") || 0); });
			values.forEach(function(v) { var item = dsItemFromDene(v); if (item) items.push(item); });
		});
		tabs.push({id: page.Name, name: dsWord(page, "Page Title") || page.Name, items: items, position: dsWord(page, "Page Position") || 0});
	});
	tabs.sort(function(a, b) { return a.position - b.position; });
	return tabs;
}

function dsItemFromDene(v) {
	var type = dsWord(v, "Panel Value Type"), source = dsParts(dsWord(v, "Panel Data Source Pointer")), label = dsWord(v, "Label");
	if (label === undefined) label = dsWord(v, "Display Name") || "";
	var item;
	if (type === "DeneWord" && source.length === 5) item = {type: "word", telepathon: source[2], dene: source[3], word: source[4], label: label, charts: dsWord(v, "Show Charts") === true};
	else if (type === "Level Colour" && source.length >= 3) item = {type: "level", telepathon: source[2], tank: dsWord(v, "Level Tank") || "", label: label};
	else if (type === "Weather Forecast") {
		item = {type: "forecast", what: dsWord(v, "Forecast What") || "temp", day: dsWord(v, "Forecast Day") || 0, label: label};
		if (dsWord(v, "Forecast Hour") !== undefined) item.hour = dsWord(v, "Forecast Hour");
	}
	if (!item) return null;
	var alerts = [];
	dsWordsOfType(v, "Panel Condition Pointer").forEach(function(w) {
		var p = dsParts(w.Value), cond = p.length === 4 ? dsDene(dsHI(p[2]), p[3]) : null;
		var e = cond && dsParseExpression(dsWord(cond, "Expression"));
		if (e) alerts.push({op: e.op, value: e.value, color: dsWord(cond, "Panel Color") || "red", position: dsWord(cond, "Condition Position") || 0});
	});
	alerts.sort(function(a, b) { return a.position - b.position; });
	if (alerts.length) item.alerts = alerts.map(function(a) { return {op: a.op, value: a.value, color: a.color}; });
	return item;
}

// ---- writing a page: the structural payload ----

function dsCleanName(s) { return String(s || "").replace(/:/g, " ").replace(/^[@$\s]+/, "").replace(/\s+/g, " ").trim().substring(0, 80); }
function dsW(name, value, type, dwType, units) {
	var w = {"Name": name, "Value": value, "Value Type": type, "Required": true};
	if (dwType) w["DeneWord Type"] = dwType;
	if (units) w["Units"] = units;
	return w;
}
function dsItemName(item) {
	if (item.label) return item.label;
	if (item.type === "forecast") return DeviceViewsTabs.forecastName(item);
	if (item.type === "level") return item.tank + " level";
	return item.word;
}

// The Denes and DeneChains of one page, named after the tab.
function dsPageElements(tab, position) {
	var T = teleonomeName, HI = "@" + T + ":" + NUCLEI_HUMAN_INTERFACE + ":", name = dsCleanName(tab.name);
	var valuesName = name, condName = name + " Conditions", pageName = name + " Page";
	var used = {}, condUsed = {}, values = [], conditions = [];
	(tab.items || []).forEach(function(item, ix) {
		var shown = dsCleanName(dsItemName(item)) || ("Value " + (ix + 1)), dn = shown, k = 2;
		while (used[dn]) dn = shown + " " + (k++);
		used[dn] = true;
		var words = [dsW("Display Name", shown, "String", "Panel Display Name"), dsW("Label", item.label || "", "String"),
			dsW("Panel In Panel Position", ix + 1, "int", "Panel In Panel Position")];
		var source;
		if (item.type === "word") {
			source = "@" + T + ":" + NUCLEI_TELEPATHONS + ":" + item.telepathon + ":" + item.dene + ":" + item.word;
			words.push(dsW("Panel Value Type", "DeneWord", "String"), dsW("Panel Data Source Pointer", source, "Dene Pointer", "Panel Data Source Pointer"),
				dsW("Show Charts", !!item.charts, "boolean"));
		} else if (item.type === "level") {
			source = "@" + T + ":" + NUCLEI_TELEPATHONS + ":" + item.telepathon;
			words.push(dsW("Panel Value Type", "Level Colour", "String"), dsW("Panel Data Source Pointer", source, "Dene Pointer", "Panel Data Source Pointer"),
				dsW("Level Tank", item.tank || "", "String"));
		} else {
			source = "$Panel_Value";
			words.push(dsW("Panel Value Type", "Weather Forecast", "String"), dsW("Panel Data Source Pointer", "$Weather_Forecast", "Dene Pointer", "Panel Data Source Pointer"),
				dsW("Forecast What", item.what || "temp", "String"), dsW("Forecast Day", item.day || 0, "int"));
			if (item.hour !== undefined && item.hour !== null && item.hour !== "") words.push(dsW("Forecast Hour", item.hour, "int"));
		}
		(item.alerts || []).forEach(function(a, ai) {
			var cn = dsCleanName(dn + " " + ({"<": "below", "<=": "at or below", ">": "above", ">=": "at or above"}[a.op] || "") + " " + a.value), kk = 2, base = cn;
			while (condUsed[cn]) cn = base + " " + (kk++);
			condUsed[cn] = true;
			conditions.push({"Name": cn, "Dene Type": "Panel Condition", "DeneWords": [
				dsW("Expression", "Value" + a.op + a.value, "String"), dsW("On Lack Of Data", false, "boolean"),
				dsW("Panel Color", a.color, "String"), dsW("Condition Position", ai + 1, "int"),
				dsW("Value", source, source.charAt(0) === "$" ? "String" : "Dene Pointer", "Condition Variable Pointer")]});
			words.push(dsW(cn, HI + condName + ":" + cn, "Dene Pointer", "Panel Condition Pointer"));
		});
		values.push({"Name": dn, "Dene Type": "Panel Value", "DeneWords": words});
	});
	return {
		pageDene: {"Name": name, "DeneWords": [
			dsW("Page Title", tab.name.trim(), "String", "Page Title"), dsW("Page Position", position, "int", "Page Position"),
			dsW("Include in Navigation", false, "boolean", "Include in Navigation"), dsW("Lower Nav Glyphicon", "glyphicon glyphicon-th-large", "String", "Lower Nav Glyphicon"),
			dsW("Home Page Pill", true, "boolean"), dsW("DeneChainPointer", HI + pageName, "Dene Pointer", "Web Page View Definition Pointer")]},
		chains: [
			{"Name": pageName, "Denes": [{"Name": name + " Panel", "DeneWords": [
				dsW("Visible", true, "boolean"), dsW("Panel In Page Position", 1, "int", "Panel In Page Position"),
				dsW("Panel Visualization Style", TELEPATHON_VALUES_PANEL_STYLE, "String", "Panel Visualization Style"),
				dsW("Panel DeneChain Pointer", HI + valuesName, "Dene Pointer", "Panel DeneChain Pointer")]}]},
			{"Name": valuesName, "Denes": values},
			{"Name": condName, "Denes": conditions}],
		names: {page: name, chains: [pageName, valuesName, condName]}
	};
}

// What deletes a page that is there now: its Control Parameters dene and its three chains.
function dsPageDeletions(id) {
	var HI = "@" + teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":";
	var page = dsDene(dsHI("Human Interface Control Parameters"), id), chains = [];
	var pageChain = dsChainByPointer(dsWord(page, "DeneChainPointer"));
	if (pageChain) {
		chains.push(HI + pageChain.Name);
		(pageChain.Denes || []).forEach(function(panel) {
			var vc = dsChainByPointer((dsWordsOfType(panel, DENEWORD_TYPE_PANEL_DENECHAIN_POINTER)[0] || {}).Value);
			if (vc) { chains.push(HI + vc.Name); if (dsHI(vc.Name + " Conditions")) chains.push(HI + vc.Name + " Conditions"); }
		});
	}
	return {"Dene Deletions": page ? [HI + "Human Interface Control Parameters:" + id] : [], "DeneChain Deletions": chains};
}

// ---- sending: the command, then its answer from the Heart ----

function dsSendStructural(mutation, payload, code) {
	return new Promise(function(resolve, reject) {
		$.ajax({
			type: "POST", url: "/TeleonomeServlet", dataType: "json",
			data: {formName: "RequestStructuralMutation", mutation: mutation, payload: JSON.stringify({"Mutation Name": mutation, "Payload": payload}), CommandCode: code},
			success: function(r) {
				if (!r || r.error) return reject(new Error((r && r.error) || "The Teleonome did not take the command."));
				var timer = setTimeout(function() { delete dsPillsPending[r.id]; resolve({waiting: true}); }, 180000);
				dsPillsPending[r.id] = {resolve: resolve, reject: reject, timer: timer};
			},
			error: function() { reject(new Error("Could not reach the Teleonome.")); }
		});
	});
}

// receivedCommandResponse (RenderingEngine.js) hands every command answer here first.
function homePagePillsCommandAnswer(cr) {
	var p = cr && dsPillsPending[cr.id];
	if (!p) return false;
	clearTimeout(p.timer);
	delete dsPillsPending[cr.id];
	if (cr.Status === COMMAND_REQUEST_EXECUTED) p.resolve({});
	else if (cr.Status === COMMAND_REQUEST_INVALID_CODE) p.reject(new Error("Wrong code."));
	else p.reject(new Error(String(cr.Status || "The Teleonome refused the change.")));
	return true;
}

function dsSaveTab(tab, code) {
	var s = dsPillSettings(), tabs = dsReadPillTabs(), isNew = tab.id === null || tab.id === undefined;
	if (!dsCleanName(tab.name)) return Promise.reject(new Error("Give the tab a name."));
	var position = isNew ? tabs.reduce(function(m, t) { return Math.max(m, t.position || 0); }, 20) + 1
		: ((tabs.filter(function(t) { return t.id === tab.id; })[0] || {}).position || 21);
	var el = dsPageElements(tab, position), HI = "@" + teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE;
	var payload = {"Updates": [],
		"Dene Injections": [{"Injection Target": HI + ":Human Interface Control Parameters", "Dene": el.pageDene}],
		"DeneChain Injections": el.chains.map(function(c) { return {"Injection Target": HI, "DeneChain": c}; })};
	if (!isNew) { var del = dsPageDeletions(tab.id); payload["Dene Deletions"] = del["Dene Deletions"]; payload["DeneChain Deletions"] = del["DeneChain Deletions"]; }
	return dsSendStructural(isNew ? s.create : s.update, payload, code).then(function(r) {
		// the new Denome comes with the next pulse (receivedCommandResponse asks for it); show the tab meanwhile
		var shown = tabs.filter(function(t) { return t.id !== tab.id; }).concat([{id: el.names.page, name: tab.name, items: tab.items, position: position}]);
		return {tabs: shown, id: el.names.page};
	});
}

function dsRemoveTab(id, code) {
	var s = dsPillSettings(), del = dsPageDeletions(id);
	return dsSendStructural(s.remove, {"Updates": [], "Dene Deletions": del["Dene Deletions"], "DeneChain Deletions": del["DeneChain Deletions"]}, code)
		.then(function() { return {tabs: dsReadPillTabs().filter(function(t) { return t.id !== id; })}; });
}

// ---- water networks (2026-11-20, sperm WaterNetworks, deviceviews-waternetwork.js) ----
//   Purpose:Water Networks:Water Network Settings   the mutations' names, the chains' prefix, Allow New Water Networks
//   Human Interface:Home Page Pills:Water Networks  the pill source (Visible false hides them)
//   Purpose:Water Network <name>                    one network; saved whole with Create / Update Water Network

function dsPurposeChains() {
	var nuclei = (denomeJSONObject && denomeJSONObject.Nuclei) || [];
	var p = nuclei.filter(function(n) { return n.Name === NUCLEI_PURPOSE; })[0];
	return (p && p.DeneChains) || [];
}

function dsWaterSettings() {
	var chain = dsPurposeChains().filter(function(c) { return c.Name === "Water Networks"; })[0];
	if (!chain) return null;
	var source = dsDene(dsPillsChain, "Water Networks");
	if (source && dsWord(source, "Visible") === false) return null;
	var s = dsDene(chain, "Water Network Settings");
	return {
		allowNew: dsWord(s, "Allow New Water Networks") !== false,
		create: dsWord(s, "Create Mutation") || "Create Water Network",
		update: dsWord(s, "Update Mutation") || "Update Water Network",
		remove: dsWord(s, "Delete Mutation") || "Delete Water Network",
		prefix: dsWord(s, "Network DeneChain Prefix") || "Water Network "
	};
}

function dsReadWaterNetworks() {
	var s = dsWaterSettings();
	if (!s) return [];
	return dsPurposeChains().filter(function(c) { return c.Name.indexOf(s.prefix) === 0; }).map(function(c) {
		var settings = dsDene(c, "Water Network Settings");
		return {id: c.Name, name: dsWord(settings, "Network Name") || c.Name.substring(s.prefix.length), chain: c};
	});
}

function dsSaveWaterNetwork(chain, oldChainName, code) {
	var s = dsWaterSettings(), P = "@" + teleonomeName + ":" + NUCLEI_PURPOSE;
	if (!s) return Promise.reject(new Error("This Teleonome has no Water Networks."));
	var payload = {"Updates": [], "DeneChain Injections": [{"Injection Target": P, "DeneChain": chain}]};
	if (oldChainName) payload["DeneChain Deletions"] = [P + ":" + oldChainName];
	return dsSendStructural(oldChainName ? s.update : s.create, payload, code);
}

function dsRemoveWaterNetwork(chainName, code) {
	var s = dsWaterSettings();
	if (!s) return Promise.reject(new Error("This Teleonome has no Water Networks."));
	return dsSendStructural(s.remove, {"Updates": [], "DeneChain Deletions": ["@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + chainName]}, code);
}

// "Update Digital Stables" (2026-11-20): the Hypothalamus sends the networks to devices.digitalstables.com by itself
// when they change; the button asks for them all again at the next Publish To DigitalStables (WaterNetworksSync form).
function dsWaterSyncText(r) {
	if (!r || r.error) return (r && r.error) || "Could not ask the Teleonome.";
	function at(ms) { return new Date(ms).toLocaleString(); }
	if (r["Requested At"] && r["Requested At"] > (r["Sent At"] || 0)) return "Asked: they go to Digital Stables at the next pulse.";
	if (r["Acked At"] && r["Acked At"] >= (r["Sent At"] || 0)) return "Digital Stables has them (" + at(r["Acked At"]) + ").";
	if (r["Sent At"]) return "Sent " + at(r["Sent At"]) + (r.Outcome && r.Outcome !== "stored" ? ", Digital Stables said: " + r.Outcome : ", waiting for Digital Stables to answer.");
	return "Not sent to Digital Stables yet.";
}
function dsWaterSync(action) {
	return new Promise(function(resolve) {
		$.ajax({type: "POST", url: "/TeleonomeServlet", dataType: "json", data: {formName: "WaterNetworksSync", action: action},
			success: function(r) { resolve(dsWaterSyncText(r)); },
			error: function() { resolve("Could not reach the Teleonome."); }});
	});
}
var DS_WATER_SYNC = {label: "Update Digital Stables", status: function() { return dsWaterSync("status"); }, send: function() { return dsWaterSync("send"); }};

// ---- the telepathons, as deviceviews wants them ----

function dsPillTelepathons() {
	var chains = getTelepathonsDeneChains();
	return ((chains && chains.DeneChains) || []).filter(function(c) { return c.Name !== DENECHAIN_ANNABELLE_QUEUE_STATUS; })
		.map(function(c) { return dsMergeTelepathon(c, telepathonCardDataCache[c.Name]); });
}

// The Denome's telepathon with the live packet's values on top, word by word (2026-11-20): a live packet carries only
// what the device sent, so words the Denome adds (Pool's "Trough Level", the units) would be lost if it replaced it.
function dsMergeTelepathon(denomeChain, livePacket) {
	if (!livePacket) return denomeChain;
	var denes = (denomeChain.Denes || []).map(function(d) {
		var liveDene = (livePacket.Denes || []).filter(function(x) { return x.Name === d.Name; })[0];
		if (!liveDene) return d;
		var words = (d.DeneWords || []).map(function(w) {
			var lw = (liveDene.DeneWords || []).filter(function(x) { return x.Name === w.Name; })[0];
			if (!lw) return w;
			var merged = $.extend({}, w, lw);
			if (!lw.Units && w.Units) merged.Units = w.Units;
			return merged;
		});
		(liveDene.DeneWords || []).forEach(function(lw) { if (!(d.DeneWords || []).some(function(w) { return w.Name === lw.Name; })) words.push(lw); });
		return $.extend({}, d, {DeneWords: words});
	});
	(livePacket.Denes || []).forEach(function(ld) { if (!(denomeChain.Denes || []).some(function(d) { return d.Name === ld.Name; })) denes.push(ld); });
	return $.extend({}, denomeChain, {Name: livePacket.Name || denomeChain.Name, Denes: denes});
}

function dsTelepathonAgeSeconds(name) {
	var t = dsPillTelepathons().filter(function(x) { return x.Name === name; })[0];
	var secs = t && getDeneWordFromTelepathon(t, "Purpose", "Seconds Time", DENEWORD_VALUE_ATTRIBUTE);
	return typeof secs === "number" && secs > 0 ? Math.max(0, Date.now() / 1000 - secs) : null;
}

// ---- the Map pill: a pin per telepathon with a Latitude and Longitude in its Configuration ----

// every telepathon with a location, hidden from the map or not
function dsPlacedAll() {
	return dsPillTelepathons().map(function(t) {
		var conf = (t.Denes || []).filter(function(d) { return d.Name === "Configuration"; })[0], lat, lon;
		((conf && conf.DeneWords) || []).forEach(function(w) { var n = String(w.Name).toLowerCase(); if (n === "latitude") lat = parseFloat(w.Value); if (n === "longitude") lon = parseFloat(w.Value); });
		return isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0) || lat === undefined ? null : {t: t, lat: lat, lon: lon};
	}).filter(Boolean);
}
// the pins on the map: those not hidden with "Hide on map"
function dsPlaced() {
	return dsPlacedAll().filter(function(p) { return !dsPinHidden(p.t.Name); });
}

// ---- "Hide on map" / "Show on map" under each telepathon card that has a location (as on devices.digitalstables.com,
// 2026-11-21). Kept in this browser only, like there: it changes what one person sees, not the Teleonome.
function dsHiddenKey() { return "ds_hidden_pins_" + teleonomeName; }
function dsHiddenPins() {
	try { return JSON.parse(localStorage.getItem(dsHiddenKey()) || "[]") || []; } catch (e) { return []; }
}
function dsPinHidden(name) { return dsHiddenPins().indexOf(name) >= 0; }
function dsSetPinHidden(name, hidden) {
	var list = dsHiddenPins().filter(function(n) { return n !== name; });
	if (hidden) list.push(name);
	try { localStorage.setItem(dsHiddenKey(), JSON.stringify(list)); } catch (e) {}
}
// RenderingEngine.js calls this after it draws the telepathon cards: a link under each card with a location
// (the card's own text is redrawn every pulse, so the link sits outside it, in the card's column)
function dsAddMapToggles() {
	dsPlacedAll().forEach(function(p) {
		var name = p.t.Name, col = document.getElementById("tpCardCol_" + name.replace(/[^a-zA-Z0-9]/g, "_"));
		if (!col || col.querySelector(".ds-map-toggle")) return;
		var row = document.createElement("div"), a = document.createElement("a");
		row.style.cssText = "display:flex;justify-content:flex-end;margin-top:4px";
		a.className = "ds-map-toggle"; a.href = "#";
		a.style.cssText = "font-size:12px;font-weight:600;color:#777";
		a.textContent = dsPinHidden(name) ? "Show on map" : "Hide on map";
		a.addEventListener("click", function(e) {
			e.preventDefault(); e.stopPropagation();
			dsSetPinHidden(name, !dsPinHidden(name));
			a.textContent = dsPinHidden(name) ? "Show on map" : "Hide on map";
			var box = document.getElementById("dsMapBox");
			if (box && !box.hidden && dsPlaced().length) dsDrawMap();
			if (dsPillsTabs) dsPillsTabs.refresh();   // no pins left: the Map pill goes
		});
		row.appendChild(a); col.appendChild(row);
	});
}

// A pin as on devices.digitalstables.com (devicepage-common.js logoPin): the device's logo in a white disc,
// ringed green when heard in the last 2 hours, amber within a day, grey otherwise; its name above it.
var DS_LOGOS = ["Daffodil", "Langley", "Gloria", "Chinampa", "Annabelle", "Pancho", "Wally", "Rosie", "Ruth",
	"Valentino", "Tucci", "Nitro", "Paula", "Cleotilde"];
function dsLogoFor(t) {
	var conf = (t.Denes || []).filter(function(d) { return d.Name === "Configuration"; })[0];
	var texts = [(DeviceViewsHost.deviceType && DeviceViewsHost.deviceType(t.Name)) || "", String(dsWord(conf, "Device Type Id") || ""), t.Name || ""];
	for (var i = 0; i < texts.length; i++) {
		var text = texts[i].toLowerCase();
		for (var j = 0; j < DS_LOGOS.length; j++) if (text.indexOf(DS_LOGOS[j].toLowerCase()) >= 0) return "/deviceviews/logos/" + DS_LOGOS[j] + ".svg";
	}
	return "/deviceviews/logos/Digital_Stables_1.svg";
}
function dsPinStyles() {
	if (document.getElementById("dsPinStyles")) return;
	var st = document.createElement("style");
	st.id = "dsPinStyles";
	st.textContent = ".ds-pin-holder{background:none;border:0}"
		+ ".ds-pin{display:flex;width:100%;height:100%;border-radius:50%;background:#fff;border:3px solid #95a5a6;box-shadow:0 1px 4px rgba(0,0,0,.45);overflow:hidden;box-sizing:border-box}"
		+ ".ds-pin.fresh{border-color:#27ae60}.ds-pin.late{border-color:#e67e22}"
		+ ".ds-pin img{width:100%;height:100%;object-fit:contain;padding:3px;box-sizing:border-box}";
	document.head.appendChild(st);
}
function dsPinIcon(t) {
	var age = dsTelepathonAgeSeconds(t.Name), size = 44;
	var ring = document.createElement("span"), img = document.createElement("img");
	ring.className = "ds-pin " + (age === null ? "silent" : age < 7200 ? "fresh" : age < 86400 ? "late" : "silent");
	img.src = dsLogoFor(t); img.alt = "";
	ring.appendChild(img);
	return L.divIcon({className: "ds-pin-holder", html: ring, iconSize: [size, size], iconAnchor: [size / 2, size / 2], tooltipAnchor: [0, -size / 2]});
}

function dsMapPill() {
	var d = dsDene(dsPillsChain, "Map");
	if (!d || dsWord(d, "Visible") === false) return [];
	return [{id: "map", name: dsWord(d, "Pill Name") || "Map",
		available: function() { return typeof L !== "undefined" && dsPlaced().length > 0; },
		show: dsDrawMap,
		hide: function() { var box = document.getElementById("dsMapBox"); if (box) box.hidden = true; }
	}];
}

function dsDrawMap() {
	var box = document.getElementById("dsMapBox"); box.hidden = false;
	var placed = dsPlaced(), all = dsPillTelepathons().length, hidden = dsPlacedAll().length - placed.length, unplaced = all - placed.length - hidden;
	document.getElementById("dsMapUnplaced").textContent = (unplaced > 0 ? unplaced + " of " + all + " devices have no Latitude and Longitude in their Configuration. " : "")
		+ (hidden > 0 ? hidden + " hidden with Hide on map (under its card)." : "");
	if (!dsPillsMap) {
		dsPinStyles();
		dsPillsMap = L.map("dsTelepathonMap", {scrollWheelZoom: false, zoomSnap: 0.25});
		// satellite first, streets to switch to (as on devices.digitalstables.com)
		var satellite = L.layerGroup([
			L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {maxZoom: 19, maxNativeZoom: 18, attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics"}),
			L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {maxZoom: 19, maxNativeZoom: 18})
		]).addTo(dsPillsMap);
		var streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19, attribution: "&copy; OpenStreetMap"});
		L.control.layers({"Satellite": satellite, "Streets": streets}, null, {position: "topright"}).addTo(dsPillsMap);
		dsPillsMap.dsLayer = L.layerGroup().addTo(dsPillsMap);
	}
	dsPillsMap.dsLayer.clearLayers();
	placed.forEach(function(p) {
		L.marker([p.lat, p.lon], {icon: dsPinIcon(p.t), title: p.t.Name}).bindTooltip(p.t.Name, {permanent: placed.length <= 8, direction: "top"}).addTo(dsPillsMap.dsLayer);
	});
	setTimeout(function() {
		dsPillsMap.invalidateSize();
		if (placed.length === 1) dsPillsMap.setView([placed[0].lat, placed[0].lon], 17);
		else dsPillsMap.fitBounds(placed.map(function(p) { return [p.lat, p.lon]; }), {paddingTopLeft: [50, 70], paddingBottomRight: [70, 50], maxZoom: 18});
	}, 0);
}

// ---- the panel ----

// RenderingEngine.js calls this for a panel of style "Home Page Pills": an empty holder; the kept node goes in after.
function homePagePillsPanelHTML(pillsChain) {
	dsPillsChain = pillsChain;
	setTimeout(homePagePillsReady, 0);
	return '<div class="col-lg-12"><div class="bs-component"><div class="panel panel-default"><div class="panel-body"><div id="dsHomePills">';
}

function homePagePillsReady() {
	var holder = document.getElementById("dsHomePills");
	if (!holder || typeof DeviceViewsTabs === "undefined") return;
	if (!dsPillsNode) {
		dsPillsNode = document.createElement("div");
		dsPillsNode.innerHTML = '<ul id="dsPills"></ul>'
			+ '<div id="dsMapBox" hidden><div id="dsTelepathonMap" style="height:420px;border-radius:8px"></div><p id="dsMapUnplaced" class="text-muted" style="margin:6px 0 0"></p></div>'
			+ '<div id="dsTabView" hidden></div><div id="dsTabEditor" hidden></div>';
		holder.appendChild(dsPillsNode);
		var s = dsPillSettings();
		dsPillsTabs = DeviceViewsTabs.create({
			pills: document.getElementById("dsPills"),
			view: document.getElementById("dsTabView"),
			editor: document.getElementById("dsTabEditor"),
			telepathons: dsPillTelepathons,
			builtIn: dsMapPill(),
			tabs: dsReadPillTabs(),
			canEdit: s.allowNew,
			needsCode: true,
			save: dsSaveTab,
			remove: dsRemoveTab,
			ageSeconds: dsTelepathonAgeSeconds,
			canChart: function() { return true; },
			storageKey: "ds_pill_teleonome_" + teleonomeName,
			waterNetworks: dsReadWaterNetworks(),
			waterNetwork: dsWaterSettings() ? {teleonomeName: teleonomeName, chainPrefix: dsWaterSettings().prefix,
				canCreate: dsWaterSettings().allowNew, needsCode: true, sync: DS_WATER_SYNC,
				save: dsSaveWaterNetwork, remove: dsRemoveWaterNetwork} : null
		});
	} else {
		holder.appendChild(dsPillsNode);
		if (dsPillsMap) dsPillsMap.invalidateSize();
		dsPillsTabs.setTabs(dsReadPillTabs());   // keeps the editor if one is open
		if (dsPillsTabs.setWaterNetworks) dsPillsTabs.setWaterNetworks(dsReadWaterNetworks());   // keeps a network being edited
		dsPillsTabs.refresh();
	}
}
