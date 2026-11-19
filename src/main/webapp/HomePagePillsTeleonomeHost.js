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

// ---- the telepathons, as deviceviews wants them ----

function dsPillTelepathons() {
	var chains = getTelepathonsDeneChains();
	return ((chains && chains.DeneChains) || []).filter(function(c) { return c.Name !== DENECHAIN_ANNABELLE_QUEUE_STATUS; })
		.map(function(c) { return telepathonCardDataCache[c.Name] || c; });
}

function dsTelepathonAgeSeconds(name) {
	var t = dsPillTelepathons().filter(function(x) { return x.Name === name; })[0];
	var secs = t && getDeneWordFromTelepathon(t, "Purpose", "Seconds Time", DENEWORD_VALUE_ATTRIBUTE);
	return typeof secs === "number" && secs > 0 ? Math.max(0, Date.now() / 1000 - secs) : null;
}

// ---- the Map pill: a pin per telepathon with a Latitude and Longitude in its Configuration ----

function dsPlaced() {
	return dsPillTelepathons().map(function(t) {
		var conf = (t.Denes || []).filter(function(d) { return d.Name === "Configuration"; })[0], lat, lon;
		((conf && conf.DeneWords) || []).forEach(function(w) { var n = String(w.Name).toLowerCase(); if (n === "latitude") lat = parseFloat(w.Value); if (n === "longitude") lon = parseFloat(w.Value); });
		return isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0) || lat === undefined ? null : {t: t, lat: lat, lon: lon};
	}).filter(Boolean);
}

function dsMapPill() {
	var d = dsDene(dsPillsChain, "Map");
	if (!d || dsWord(d, "Visible") === false) return [];
	return [{id: "map", name: dsWord(d, "Pill Name") || "Map",
		available: function() { return typeof L !== "undefined" && dsPlaced().length > 0; },
		show: function() {
			var box = document.getElementById("dsMapBox"); box.hidden = false;
			var placed = dsPlaced(), all = dsPillTelepathons().length;
			document.getElementById("dsMapUnplaced").textContent = all > placed.length ? (all - placed.length) + " of " + all + " devices have no Latitude and Longitude in their Configuration." : "";
			if (!dsPillsMap) {
				dsPillsMap = L.map("dsTelepathonMap", {scrollWheelZoom: false});
				L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19, attribution: "&copy; OpenStreetMap"}).addTo(dsPillsMap);
				dsPillsMap.dsLayer = L.layerGroup().addTo(dsPillsMap);
			}
			dsPillsMap.dsLayer.clearLayers();
			placed.forEach(function(p) { L.marker([p.lat, p.lon]).bindPopup(document.createTextNode(p.t.Name)).addTo(dsPillsMap.dsLayer); });
			setTimeout(function() {
				dsPillsMap.invalidateSize();
				if (placed.length === 1) dsPillsMap.setView([placed[0].lat, placed[0].lon], 16);
				else dsPillsMap.fitBounds(placed.map(function(p) { return [p.lat, p.lon]; }), {padding: [30, 30], maxZoom: 17});
			}, 0);
		},
		hide: function() { var box = document.getElementById("dsMapBox"); if (box) box.hidden = true; }
	}];
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
			storageKey: "ds_pill_teleonome_" + teleonomeName
		});
	} else {
		holder.appendChild(dsPillsNode);
		if (dsPillsMap) dsPillsMap.invalidateSize();
		dsPillsTabs.setTabs(dsReadPillTabs());   // keeps the editor if one is open
		dsPillsTabs.refresh();
	}
}
