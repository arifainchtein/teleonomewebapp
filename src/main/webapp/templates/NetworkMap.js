//
// Network Map (Cleotilde Devices page, added 2026-11-05): the router in the centre, every device around it in
// sectors by how it connects (Wired / Wi-Fi 2.4 / Wi-Fi 5 / sweep only, plus "not seen" on request), with an
// icon for what it is: Teleonome (a Raspberry Pi that announces its name, or one the organism knows), Telepathon
// (ESP32: Espressif MAC), iPad, phone, laptop, printer, NAS, access point...
// The ring says known (green) / unknown (amber) / not seen (grey, dashed); a star marks a critical device.
// "Arrivals and departures" and "Who was here" (DevicePresence.js) are buttons next to Show not seen: one replaces the
// map with that section; any other button, the search, or the same button again brings the map back.
// Tap a device (on the map, in those lists or in the Device Table) and under the map comes everything about it:
// what it is, its buttons (the Device Table's classes, so index.html's handlers do the work, code prompt included,
// plus the critical star wlCriticalBtn), its facts, its presence, its traffic (GetTraffic View=device) and its
// suspicious events.
// Data: the DeviceList deneword (every pulse), GetPresence (critical list, presence), GetTraffic.
// Wired includes the clients of the access points: the router sees them on its LAN port.
// Leaves 5 divs open: renderPageByPointer closes them.
//
var dsMapSelected = null;	// mac of the open card
var dsMapShowGone = false;
var dsMapFilter = "all";
var dsMapQuery = "";
var dsMapLast = null;
var dsMapView = "map";		// "map", or "feed" / "timeline": that section instead of the map (the buttons next to Show not seen)		// what the last render drew, so filters redraw without a pulse

var DS_ICONS = {
	router:     { label: "Router", svg: '<rect x="3" y="12" width="18" height="7" rx="1.5"/><path d="M7 12V6M17 12V6"/><circle class="f" cx="7" cy="15.5" r="1"/><circle class="f" cx="10.5" cy="15.5" r="1"/><path d="M14 15.5h4"/>' },
	teleonome:  { label: "Teleonome", svg: '<path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v6.3M12 15.2v6.3M3.8 7.25l5.4 3.1M14.8 13.65l5.4 3.1"/>' },
	telepathon: { label: "Telepathon", svg: '<rect x="7" y="10" width="10" height="10" rx="1"/><path d="M9 10V8M12 10V8M15 10V8M9 22v-2M12 22v-2M15 22v-2"/><path d="M8.5 5.2a5 5 0 0 1 7 0M6.3 3a8 8 0 0 1 11.4 0"/><circle class="f" cx="12" cy="15" r="1.4"/>' },
	phone:      { label: "Phone", svg: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10.5 18.5h3"/>' },
	tablet:     { label: "iPad / tablet", svg: '<rect x="4.5" y="2.5" width="15" height="19" rx="2"/><circle class="f" cx="12" cy="18.5" r="0.9"/>' },
	laptop:     { label: "Laptop / Mac", svg: '<rect x="5" y="5" width="14" height="10" rx="1"/><path d="M2.5 18.5h19l-1.5-3.5h-16z"/>' },
	desktop:    { label: "Computer", svg: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M9 20h6M12 16v4"/>' },
	printer:    { label: "Printer", svg: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="1.5"/><path d="M7 14h10v7H7z"/>' },
	nas:        { label: "NAS", svg: '<rect x="4" y="3" width="16" height="5" rx="1"/><rect x="4" y="9.5" width="16" height="5" rx="1"/><rect x="4" y="16" width="16" height="5" rx="1"/><circle class="f" cx="16.5" cy="5.5" r="0.9"/><circle class="f" cx="16.5" cy="12" r="0.9"/><circle class="f" cx="16.5" cy="18.5" r="0.9"/>' },
	tv:         { label: "TV / Apple TV", svg: '<rect x="2.5" y="4" width="19" height="13" rx="1.5"/><path d="M8 21h8"/>' },
	ap:         { label: "Access point", svg: '<path d="M3 17.5h18"/><rect x="5" y="14" width="14" height="3.5" rx="1.5"/><path d="M8.5 10.5a5 5 0 0 1 7 0M5.8 7.6a9 9 0 0 1 12.4 0"/>' },
	mobile:     { label: "Phone/tablet/laptop?", svg: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M10.3 9.3a1.9 1.9 0 1 1 2.6 1.8c-.6.3-.9.7-.9 1.4"/><circle class="f" cx="12" cy="15.3" r="0.9"/>' },
	pi:         { label: "Raspberry Pi", svg: '<rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M6 9h4v4H6zM14 9h4M14 12h4M6 18v2M10 18v2M14 18v2M18 18v2"/>' },
	unknown:    { label: "Not identified", svg: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.5"/><circle class="f" cx="12" cy="16.6" r="1"/>' }
};
var DS_STAR = '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>';

// Espressif (ESP32 / ESP8266: the Telepathons and panels), TP-Link (the extender at .181, Christine's AP), Raspberry Pi
var DS_OUI_ESPRESSIF = "1c:9d:c2 78:21:84 ec:e3:34 f8:b3:b7 b0:cb:d8 24:0a:c4 30:ae:a4 a4:cf:12 84:cc:a8 c8:c9:a3 08:3a:f2 94:b9:7e e8:db:84 3c:71:bf 7c:9e:bd b4:e6:2d cc:50:e3 24:6f:28 40:22:d8 d8:bf:c0 48:3f:da 34:85:18 10:52:1c f4:12:fa 54:32:04 64:e8:33 58:bf:25 ac:67:b2 e0:5a:1b 30:c6:f7 70:b8:f6 c4:4f:33 a0:20:a6 bc:dd:c2 5c:cf:7f 60:01:94 18:fe:34 2c:f4:32 98:f4:ab 8c:aa:b5 ec:62:60 e8:68:e7 cc:db:a7 08:b6:1f 34:94:54 d4:8a:fc 0c:b8:15 e8:9f:6d 34:b4:72 48:27:e2 f4:cf:a2 c0:49:ef 40:91:51 dc:54:75 e4:65:b8 b8:d6:1a 10:06:1c a8:42:e3 cc:7b:5c 74:4d:bd 68:b6:b3 ec:da:3b 3c:84:27 f0:9e:9e 48:e7:29".split(" ");
var DS_OUI_TPLINK = "60:a4:b7 64:66:b3 50:c7:bf 98:da:c4 b0:4e:26 c0:06:c3 14:eb:b6 f4:f2:6d ec:08:6b 30:b5:c2 54:af:97 1c:3b:f3 ac:84:c6".split(" ");
var DS_OUI_PI = "b8:27:eb dc:a6:32 e4:5f:01 d8:3a:dd 2c:cf:67 28:cd:c1".split(" ");
var DS_KIND_ORDER = ["ap", "teleonome", "pi", "telepathon", "nas", "desktop", "laptop", "printer", "tv", "tablet", "phone", "mobile", "unknown"];
var DS_SECTORS = [["wired", "Wired / LAN"], ["wifi24", "Wi-Fi 2.4 GHz"], ["wifi5", "Wi-Fi 5 GHz"], ["sweep", "Sweep only"], ["gone", "Not seen now"]];

// what a device is: [icon, because]
function dsDeviceKind(d, organismIPInfoJsonData) {
	var name = (d[DEVICE_NAME] || "").toLowerCase(), mac = (d[MAC_ADDRESS] || "").toLowerCase(), oui = mac.substring(0, 8);
	var guess = (d["Guess"] || "").toLowerCase(), vendor = (d["Vendor"] || "").toLowerCase(), net = (d["Network Name"] || "").toLowerCase();
	var ip = d[IP_ADDRESS] || "";
	if (/\.1$/.test(ip) && /^192\.168\.\d+\.1$/.test(ip)) return ["router", "the gateway address"];
	if (DS_OUI_ESPRESSIF.indexOf(oui) >= 0 || /^esp(32|8266)/.test(name)) return ["telepathon", "ESP32 (Espressif MAC)"];
	for (var t in (organismIPInfoJsonData || {})) {
		if (ip !== "" && organismIPInfoJsonData[t] == ip) return ["teleonome", "the organism knows it as " + t];
	}
	if (DS_OUI_PI.indexOf(oui) >= 0 || vendor.indexOf("raspberry") >= 0)
		return net ? ["teleonome", "Raspberry Pi that announces itself as " + d["Network Name"] + ".local"] : ["pi", "Raspberry Pi, doesn't announce a name"];
	if (DS_OUI_TPLINK.indexOf(oui) >= 0) return ["ap", "TP-Link MAC (extender / access point)"];
	if (net === "dsnas" || /\bnas\b/.test(name)) return ["nas", "calls itself " + (d["Network Name"] || name)];
	if (/ipad|tablet/.test(name + " " + guess)) return ["tablet", "iPad in the name"];
	if (/iphone|android|phone/.test(name + " " + guess)) return ["phone", guess ? "guess: " + d["Guess"] : "its name"];
	if (/printer/.test(guess) || /printer|dell-s\d/.test(name)) return ["printer", "guess: printer"];
	if (/apple tv|smart tv/.test(guess) || /tv$/.test(name)) return ["tv", "guess: " + (d["Guess"] || "TV")];
	if (/tp-link network|access point/.test(guess) || /^wa\d|antenna|express|airport/.test(name) || net === "main-station") return ["ap", "access point"];
	if (/^mac$|macbook|laptop|linux pc/.test(guess) || /macmini|laptop|linux/.test(name)) return ["laptop", "guess: " + (d["Guess"] || name)];
	if (/factory|desktop/.test(name)) return ["desktop", "computer"];
	if (/private address|apple device/.test(guess) || vendor === "private mac") return ["mobile", d["Guess"] || "private (random) MAC"];
	return ["unknown", "nothing to go on yet"];
}

function dsDeviceSector(d) {
	var c = (d["Connection"] || "").toLowerCase();
	if (!d[IS_DEVICE_PRESENT]) return "gone";
	if (c.indexOf("wifi 5") >= 0) return "wifi5";
	if (c.indexOf("wifi") >= 0) return "wifi24";
	if (c === "sweep only") return "sweep";
	return "wired";
}

function dsIconSVG(kind, size) {
	return '<svg class="ds-ico" viewBox="0 0 24 24" width="' + size + '" height="' + size + '">' + DS_ICONS[kind].svg + '</svg>';
}

// the critical list, from GetPresence (DevicePresence.js) once it has answered
function dsIsCritical(mac) {
	if (typeof dsPresence === "undefined" || !dsPresence) return false;
	mac = (mac || "").toLowerCase();
	return dsPresence.Critical.some(function (c) { return c.Mac === mac; });
}

class NetworkMap extends NetworkSensorDeviceStatusReport {

	process(organismIPInfoJsonData) {
		var list = [];
		try { list = JSON.parse(getDeneWordByIdentityPointer("@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + DENECHAIN_SENSOR_DATA + ":" + DENE_NETWORK_SENSOR_STATUS + ":" + DEVICE_LIST, DENEWORD_VALUE_ATTRIBUTE) || "[]"); } catch (e) {}
		var self = this;
		dsMapLast = list.map(function (d) {
			var k = dsDeviceKind(d, organismIPInfoJsonData);
			return { d: d, mac: (d[MAC_ADDRESS] || "").toLowerCase(), kind: k[0], because: k[1], sector: dsDeviceSector(d), known: !!d[WHITE_LIST_STATUS], name: self.displayName(d[DEVICE_NAME]) };
		});
		dsPresenceStart();
		var kindButton = function (f, label, icon) {
			return '<button class="btn ' + (dsMapFilter === f ? 'btn-primary' : 'btn-default') + '" data-mf="' + f + '" onclick="dsMapFilter=\'' + f + '\';dsMapView=\'map\';dsMapRender();return false;">'
				+ (icon ? dsIconSVG(icon, 13) + ' ' : '') + label + '</button>';
		};
		var viewButton = function (v, label) {
			return '<button class="btn ' + (dsMapView === v ? 'btn-primary' : 'btn-default') + '" data-mv="' + v + '" onclick="dsMapSetView(\'' + v + '\');return false;">' + label + '</button>';
		};
		var h = '<div class="col-lg-12"><div class="ds-block ds-map">';
		h += '<h5><span>Network map <small class="ds-sub" id="DSMapCounts"></small></span><span class="ds-devtools">'
			+ '<span class="btn-group btn-group-xs" id="DSMapFilters">' + kindButton("all", "All") + kindButton("teleonome", "Teleonomes", "teleonome")
			+ kindButton("telepathon", "Telepathons", "telepathon") + kindButton("unknown", "Unknown") + kindButton("critical", "Critical") + '</span>'
			+ '<button class="btn btn-xs ' + (dsMapShowGone ? 'btn-primary' : 'btn-default') + '" id="DSMapGone" onclick="dsMapShowGone=!dsMapShowGone;dsMapView=\'map\';dsMapRender();return false;">Show not seen</button>'
			+ '<span class="btn-group btn-group-xs" id="DSMapViews">' + viewButton("feed", "Arrivals and departures") + viewButton("timeline", "Who was here") + '</span>'
			+ '<input class="form-control input-sm" id="DSMapSearch" placeholder="Search name, IP, MAC" value="' + this.escape(dsMapQuery) + '" oninput="dsMapQuery=this.value.toLowerCase();dsMapView=\'map\';dsMapRender()">'
			+ '</span></h5>';
		h += '<div class="ds-mapbox" id="DSMapBox"' + (dsMapView === "map" ? '' : ' style="display:none"') + '><svg id="DSMap" viewBox="0 0 1000 860" role="img" aria-label="Network map: the router in the centre and every device around it" onclick="dsMapClick(event)">'
			+ dsMapSVG() + '</svg><div class="ds-mapside">' + dsMapKeyHTML() + '</div></div>';
		h += '<div id="DSMapDetail">' + dsMapDetailHTML() + '</div>';
		h += '<div><div><div>';   // 5 open: col, block, 3 here
		setTimeout(dsMapCounts, 0);
		return h;
	}
}

function dsMapMatches(n) {
	if (dsMapFilter === "teleonome" && n.kind !== "teleonome" && n.kind !== "pi") return false;
	if (dsMapFilter === "telepathon" && n.kind !== "telepathon") return false;
	if (dsMapFilter === "unknown" && (n.known || n.sector === "gone")) return false;
	if (dsMapFilter === "critical" && !dsIsCritical(n.mac)) return false;
	if (dsMapQuery) {
		var s = (n.name + " " + (n.d[IP_ADDRESS] || "") + " " + n.mac + " " + (n.d["Guess"] || "") + " " + DS_ICONS[n.kind].label).toLowerCase();
		if (s.indexOf(dsMapQuery) < 0) return false;
	}
	return true;
}

// radial layout: sectors sized by how many devices they hold, two rings, the inner one first
function dsMapLayout() {
	var cx = 500, cy = 430, list = (dsMapLast || []).filter(function (n) { return n.kind !== "router" && (dsMapShowGone || n.sector !== "gone"); });
	var groups = DS_SECTORS.map(function (s) {
		var g = list.filter(function (n) { return n.sector === s[0]; });
		g.sort(function (a, b) { return DS_KIND_ORDER.indexOf(a.kind) - DS_KIND_ORDER.indexOf(b.kind) || a.name.localeCompare(b.name); });
		return { key: s[0], label: s[1], nodes: g };
	}).filter(function (g) { return g.nodes.length; });
	var total = Math.max(1, list.length), gap = 0.16, free = Math.PI * 2 - gap * groups.length;
	var a = -Math.PI / 2 - (groups.length ? free * groups[0].nodes.length / total / 2 : 0);
	groups.forEach(function (g) {
		var span = free * g.nodes.length / total, rings = [215, 315];
		var fit = Math.max(1, Math.floor(span * rings[0] / 66));
		var n0 = g.nodes.length <= fit ? g.nodes.length : Math.min(fit, Math.ceil(g.nodes.length * rings[0] / (rings[0] + rings[1])));
		[g.nodes.slice(0, n0), g.nodes.slice(n0)].forEach(function (chunk, ri) {
			chunk.forEach(function (n, k) {
				var t = a + span * (k + 0.5) / chunk.length;
				n.x = cx + rings[ri] * Math.cos(t);
				n.y = cy + rings[ri] * Math.sin(t) * 0.92;
			});
		});
		g.mid = a + span / 2;
		a += span + gap;
	});
	return { cx: cx, cy: cy, groups: groups, list: list };
}

function dsMapSVG() {
	if (!dsMapLast) return "";
	var L = dsMapLayout(), h = "", e = dsEsc;
	L.groups.forEach(function (g) {
		var x = L.cx + 392 * Math.cos(g.mid), y = L.cy + 392 * Math.sin(g.mid) * 0.92 + 4;
		h += '<text class="sector" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '">' + e(g.label) + ' · ' + g.nodes.length + '</text>';
	});
	L.list.forEach(function (n) {
		var k = n.sector === "gone" ? "gone" : n.sector === "sweep" ? "sweep" : n.sector.indexOf("wifi") === 0 ? "wifi" : "";
		h += '<line class="link ' + k + (dsMapMatches(n) ? '' : ' dim') + '" x1="' + L.cx + '" y1="' + L.cy + '" x2="' + n.x.toFixed(1) + '" y2="' + n.y.toFixed(1) + '"/>';
	});
	L.list.forEach(function (n) {
		var cls = n.sector === "gone" ? "gone" : n.known ? "known" : "unknown";
		var macName = /^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/i.test(n.name);
		var line1 = macName ? DS_ICONS[n.kind].label.split(" ")[0] : (n.name.length > 15 ? n.name.substring(0, 14) + "…" : n.name);
		var ip = n.d[IP_ADDRESS] || "";
		h += '<g class="node ' + cls + (dsMapSelected === n.mac ? ' sel' : '') + (dsMapMatches(n) ? '' : ' dim') + '" data-mac="' + e(n.mac) + '" transform="translate(' + n.x.toFixed(1) + ',' + n.y.toFixed(1) + ')">'
			+ '<title>' + e(n.name + " · " + DS_ICONS[n.kind].label + " · " + ip) + '</title>'
			+ '<circle class="halo" r="21"/><g class="ico" transform="translate(-12,-12)">' + DS_ICONS[n.kind].svg + '</g>'
			+ (dsIsCritical(n.mac) ? '<path class="star" transform="translate(9,-27) scale(.55)" d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>' : '')
			+ '<text y="35">' + e(line1) + '</text><text class="t2" y="47">' + e(ip ? "." + ip.split(".").pop() : "") + '</text></g>';
	});
	var router = dsMapLast.find(function (n) { return n.kind === "router"; });
	h += '<g class="node router' + (router && dsMapSelected === router.mac ? ' sel' : '') + '"' + (router ? ' data-mac="' + e(router.mac) + '"' : '') + ' transform="translate(' + L.cx + ',' + L.cy + ')">'
		+ '<circle class="halo" r="38"/><g class="ico" transform="translate(-18,-18) scale(1.5)">' + DS_ICONS.router.svg + '</g>'
		+ '<text y="58">Router</text><text class="t2" y="71">' + e(router ? router.d[IP_ADDRESS] : "") + '</text></g>';
	return h;
}

function dsMapKeyHTML() {
	var icons = DS_KIND_ORDER.concat(["router"]).map(function (k) { return '<div>' + dsIconSVG(k, 18) + dsEsc(DS_ICONS[k].label) + '</div>'; }).join("");
	// open beside the map on a wide screen, folded under it on a phone
	return '<details class="ds-mapkey"' + (window.innerWidth >= 992 ? ' open' : '') + '><summary>Icons and colours</summary><div class="ds-maplegend">' + icons
		+ '<div><span class="ring known"></span>known</div><div><span class="ring unknown"></span>unknown</div>'
		+ '<div><span class="ring gone"></span>not seen now</div><div><svg viewBox="0 0 24 24" width="18" height="18">' + DS_STAR.replace('<path', '<path class="star"') + '</svg>critical</div></div>'
		+ '<div class="ds-sub">Tap a device: everything about it appears under the map. Arrivals and departures, Who was here: the buttons above.</div>'
		+ '<div class="ds-sub" style="margin-top:6px">Wired includes the clients of the access points (Christine\'s AP, the AirPorts, the TP-Link extender): the router sees them on its LAN port and can\'t tell which AP they sit behind.</div></details>';
}

function dsMapCounts() {
	var el = document.getElementById("DSMapCounts");
	if (!el || !dsMapLast) return;
	var here = dsMapLast.filter(function (n) { return n.sector !== "gone" && n.kind !== "router"; });
	var c = function (f) { return here.filter(f).length; };
	el.textContent = here.length + " here · " + c(function (n) { return n.kind === "teleonome"; }) + " Teleonomes · " + c(function (n) { return n.kind === "telepathon"; })
		+ " Telepathons · " + c(function (n) { return !n.known; }) + " unknown";
}

// redraw the map and what is under it in place (filters, a click, GetPresence / GetTraffic answering)
function dsMapRender() {
	var svg = document.getElementById("DSMap");
	if (!svg) return;
	svg.innerHTML = dsMapSVG();
	$("#DSMapDetail").html(dsMapDetailHTML());
	$("#DSMapFilters [data-mf]").each(function () { $(this).toggleClass("btn-primary", this.getAttribute("data-mf") === dsMapFilter).toggleClass("btn-default", this.getAttribute("data-mf") !== dsMapFilter); });
	$("#DSMapGone").toggleClass("btn-primary", dsMapShowGone).toggleClass("btn-default", !dsMapShowGone);
	$("#DSMapViews [data-mv]").each(function () { $(this).toggleClass("btn-primary", this.getAttribute("data-mv") === dsMapView).toggleClass("btn-default", this.getAttribute("data-mv") !== dsMapView); });
	$("#DSMapBox").toggle(dsMapView === "map");
	dsMapCounts();
}

// Arrivals and departures / Who was here instead of the map; the same button again brings the map back
function dsMapSetView(v) {
	dsMapView = dsMapView === v ? "map" : v;
	dsMapRender();
}

function dsMapClick(ev) {
	var g = ev.target.closest ? ev.target.closest(".node") : null;
	if (!g || !g.getAttribute("data-mac")) return;
	dsMapSelect(g.getAttribute("data-mac"));
}

// open a device under the map (from the map, the overview or the Device Table); null = back to the overview
function dsMapSelect(mac) {
	dsMapSelected = mac ? mac.toLowerCase() : null;
	dsMapView = "map";
	dsDevTraffic = null;
	dsDevEvents = null;
	dsDevCountry = null;
	dsMapRender();
	if (dsMapSelected) dsDevLoad();
	var el = document.getElementById(dsMapSelected ? "DSMapDetail" : "DSMap");
	if (el) setTimeout(function () { el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 0);
}

// ------------------------------------------------------------------ under the map: the selected device

var dsDevDays = 1;
var dsDevTraffic = null;	// GetTraffic View=device for dsMapSelected
var dsDevEvents = null;		// its suspicious events (GetTraffic overview, filtered)
var dsDevSummary = null;	// its up/down totals
var dsDevCountry = null;

function dsDevLoad() {
	var mac = dsMapSelected;
	if (!mac) return;
	$.ajax({ type: "GET", url: "/TeleonomeServlet", dataType: "json",
		data: { formName: "GetTraffic", View: "device", Days: dsDevDays, Mac: mac },
		success: function (data) { if (dsMapSelected !== mac) return; dsDevTraffic = data; $("#DSMapDetail").html(dsMapDetailHTML()); } });
	$.ajax({ type: "GET", url: "/TeleonomeServlet", dataType: "json",
		data: { formName: "GetTraffic", View: "overview", Days: dsDevDays },
		success: function (data) {
			if (dsMapSelected !== mac) return;
			dsDevEvents = (data.Events || []).filter(function (e) { return (e.Mac || "").toLowerCase() === mac; });
			dsDevSummary = (data.Devices || []).filter(function (d) { return (d.Mac || "").toLowerCase() === mac; })[0] || { Up: 0, Down: 0 };
			$("#DSMapDetail").html(dsMapDetailHTML());
		} });
}

function dsDevSetDays(d) {
	dsDevDays = d;
	dsDevTraffic = null;
	dsDevEvents = null;
	dsDevCountry = null;
	$("#DSMapDetail").html(dsMapDetailHTML());
	dsDevLoad();
}

function dsWhen(ms) {
	var d = new Date(ms);
	return d.toDateString() === new Date().toDateString() ? dsClock(ms) : d.toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function dsMapDetailHTML() {
	if (dsMapView === "feed") return '<div id="DSFeed">' + dsFeedHTML() + '</div>';
	if (dsMapView === "timeline") return '<div id="DSTimeline">' + dsTimelineHTML() + '</div>';
	var n = dsMapSelected ? (dsMapLast || []).find(function (x) { return x.mac === dsMapSelected; }) : null;
	if (!n) return '<p class="ds-sub" style="margin:0">Tap a device on the map: everything about it appears here.</p>';
	var d = n.d, e = dsEsc, crit = dsIsCritical(n.mac), here = n.sector !== "gone";
	var shownName = /^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/i.test(n.name) ? "(no name)" : n.name;
	var status = n.kind === "router" ? '<span class="label label-success">router</span>'
		: (here ? '<span class="label label-success">here</span>' : '<span class="label label-default">not seen' + (d["Last Seen"] ? ' for ' + dsAgo(d["Last Seen"]) : '') + '</span>')
		+ ' ' + (n.known ? '<span class="label label-success">known</span>' : '<span class="label label-warning">unknown</span>')
		+ (crit ? ' <span class="label ds-critlabel">★ critical</span>' : '');
	var h = '<div class="ds-dev">';
	h += '<div class="ds-devhead">' + dsIconSVG(n.kind, 40) + '<div class="ds-devtitle"><b>' + e(shownName) + '</b> ' + status
		+ '<div class="ds-sub">' + e(DS_ICONS[n.kind].label) + ' · ' + e(n.because) + '</div></div>'
		+ '<a href="#" class="btn btn-sm btn-default ds-devclose" onclick="dsMapSelect(null);return false;">✕ All devices</a></div>';

	// the buttons
	if (n.mac && n.kind !== "router") {
		var data = ' data-name="' + e(d[DEVICE_NAME]) + '" data-mac="' + e(n.mac) + '"';
		h += '<div class="ds-mapacts">'
			+ '<a href="#" class="btn btn-sm ds-critbtn wlCriticalBtn' + (crit ? ' on' : '') + '"' + data + ' data-critical="' + (!crit) + '" title="' + (crit ? 'Remove from the critical list' : 'Must always be online: its absence is an alarm') + '"><i class="glyphicon glyphicon-star' + (crit ? '' : '-empty') + '"></i> ' + (crit ? 'Critical' : 'Critical?') + '</a>'
			+ (n.known ? '<a href="#" class="btn btn-sm btn-danger wlRemoveBtn"' + data + '><i class="glyphicon glyphicon-minus-sign"></i> Not known</a>'
				: '<a href="#" class="btn btn-sm btn-success wlAddBtn"' + data + '><i class="glyphicon glyphicon-plus-sign"></i> Make known</a>')
			+ '<a href="#" class="btn btn-sm btn-primary" onclick="dsOpenDeviceTraffic(\'' + e(n.mac) + '\');return false;"><i class="glyphicon glyphicon-transfer"></i> Traffic page</a>'
			+ '<a href="#" class="btn btn-sm btn-info wlIdentifyBtn" data-mac="' + e(n.mac) + '"><i class="glyphicon glyphicon-search"></i> Identify</a>'
			+ '<a href="#" class="btn btn-sm btn-default wlRenameBtn"' + data + ' data-nickname="' + e(d["Original Name"] ? n.name : "") + '"><i class="glyphicon glyphicon-pencil"></i> Rename</a>'
			+ (!here ? '<a href="#" class="btn btn-sm btn-default wlForgetBtn"' + data + '><i class="glyphicon glyphicon-trash"></i> Forget</a>' : '')
			+ (d[IP_ADDRESS] && here ? '<a href="http://' + e(d[IP_ADDRESS]) + '" target="_blank" class="btn btn-sm btn-default"><i class="glyphicon glyphicon-new-window"></i> Open ' + e(d[IP_ADDRESS]) + '</a>' : '')
			+ '</div>';
	}

	// the facts
	var c = crit ? (dsPresence.Critical.find(function (x) { return x.Mac === n.mac; }) || {}) : {};
	var facts = [
		["IP address", e(d[IP_ADDRESS] || "")],
		["MAC", '<span class="ds-mono">' + e(n.mac) + '</span>' + (d["Private MAC"] ? ' <span class="ds-sub">private (random)</span>' : '')],
		["Connection", e(d["Connection"] || "") + (d["Connection"] === "sweep only" ? ' <span class="ds-sub">(the router can\'t see it; found by Cleotilde\'s sweep)</span>' : '')],
		["Maker", e(d["Vendor"] || "")],
		["Probably", d["Guess"] ? e(d["Guess"]) + (d["Guess Because"] ? ' <span class="ds-sub">(' + e(d["Guess Because"]) + ')</span>' : '') : ""],
		["Calls itself", d["Network Name"] ? e(d["Network Name"]) + ".local" : ""],
		["Router name", e(d["Original Name"] || "")],
		["First seen", d["First Seen"] ? e(new Date(d["First Seen"]).toLocaleString()) : ""],
		["Last seen", !here && d["Last Seen"] ? e(new Date(d["Last Seen"]).toLocaleString()) : ""],
		["Down after", crit && c.OfflineMinutes ? c.OfflineMinutes + " min unseen" : ""]
	].filter(function (r) { return r[1]; });
	h += '<div class="ds-facts">' + facts.map(function (r) { return '<div><span class="k">' + r[0] + '</span>' + r[1] + '</div>'; }).join("") + '</div>';

	// presence
	h += '<div class="ds-devsec"><h6>Here in the last 24 h</h6>' + dsDevicePresenceHTML(n.mac) + '</div>';

	// traffic
	var days = [[1, "Today"], [7, "7 days"], [30, "30 days"]].map(function (p) {
		return '<button class="btn ' + (dsDevDays === p[0] ? 'btn-primary' : 'btn-default') + '" onclick="dsDevSetDays(' + p[0] + ');return false;">' + p[1] + '</button>';
	}).join("");
	h += '<div class="ds-devsec"><h6>Traffic <span class="btn-group btn-group-xs">' + days + '</span>'
		+ (dsDevSummary ? ' <span class="ds-sub">↑ ' + trafficBytes(dsDevSummary.Up) + ' · ↓ ' + trafficBytes(dsDevSummary.Down) + '</span>' : '') + '</h6>';
	if (!dsDevTraffic) h += '<span class="ds-sub">Loading…</span>';
	else {
		var dest = dsDevTraffic.Destinations || [], doms = dsDevTraffic.Domains || [];
		h += trafficChart(dsDevTraffic.Hours || []);
		var byCc = {};
		dest.forEach(function (x) { var cc = x.Country || "?"; byCc[cc] = (byCc[cc] || 0) + x.Up + x.Down; });
		var ccs = Object.keys(byCc).sort(function (a, b) { return byCc[b] - byCc[a]; });
		if (ccs.length) {
			h += '<div class="ds-devtools" style="margin:6px 0"><b>Countries:</b> <button class="btn btn-xs ' + (dsDevCountry ? 'btn-default' : 'btn-primary') + '" onclick="dsDevCountry=null;$(\'#DSMapDetail\').html(dsMapDetailHTML());return false;">All</button>';
			ccs.forEach(function (cc) {
				h += '<button class="btn btn-xs ' + (dsDevCountry === cc ? 'btn-primary' : 'btn-default') + '" onclick="dsDevCountry=\'' + e(cc) + '\';$(\'#DSMapDetail\').html(dsMapDetailHTML());return false;">'
					+ e(cc === "?" ? "unknown" : trafficCountryName(cc)) + ' <span class="ds-sub">' + trafficBytes(byCc[cc]) + '</span></button>';
			});
			h += '</div>';
		}
		var shown = dsDevCountry ? dest.filter(function (x) { return (x.Country || "?") === dsDevCountry; }) : dest;
		h += '<div class="ds-cols"><div><b>Where it talks to</b> <span class="ds-sub">' + shown.length + '</span><div class="ds-scroll" style="max-height:340px">';
		if (!shown.length) h += '<p class="ds-sub">No internet traffic.</p>';
		else {
			h += '<table class="table table-condensed"><tr><th>Domain</th><th>Country</th><th class="text-right">Up</th><th class="text-right">Down</th><th class="ds-xs-hide">Last</th></tr>';
			shown.forEach(function (x) {
				h += '<tr><td>' + (x.Domain ? e(x.Domain) : '<span class="ds-mono">' + e(x.IP) + ':' + x.Port + '</span>') + '</td><td>' + trafficCountry(x.Country) + '</td><td class="text-right">'
					+ trafficBytes(x.Up) + '</td><td class="text-right">' + trafficBytes(x.Down) + '</td><td class="ds-sub ds-xs-hide">' + dsWhen(x.Last) + '</td></tr>';
			});
			h += '</table>';
		}
		h += '</div></div><div><b>What it looked up</b> <span class="ds-sub">' + doms.length + '</span><div class="ds-scroll" style="max-height:340px">';
		if (!doms.length) h += '<p class="ds-sub">Nothing: it doesn\'t use the router\'s DNS, or hasn\'t gone online.</p>';
		else {
			h += '<table class="table table-condensed"><tr><th>Domain</th><th class="text-right">Lookups</th><th>Last</th></tr>';
			doms.forEach(function (x) { h += '<tr><td>' + e(x.Domain) + '</td><td class="text-right">' + x.Queries + '</td><td class="ds-sub">' + dsWhen(x.Last) + '</td></tr>'; });
			h += '</table>';
		}
		h += '</div></div></div>';
	}
	h += '</div>';

	// suspicious events
	h += '<div class="ds-devsec"><h6>Suspicious events <span class="ds-sub">last ' + Math.max(7, dsDevDays) + ' days</span></h6>';
	if (!dsDevEvents) h += '<span class="ds-sub">Loading…</span>';
	else if (!dsDevEvents.length) h += '<span class="ds-sub">None.</span>';
	else {
		h += '<table class="table table-condensed"><tr><th>When</th><th>Rule</th><th>What</th></tr>';
		dsDevEvents.forEach(function (x) { h += '<tr><td class="ds-sub" style="white-space:nowrap">' + dsWhen(x.Time) + '</td><td><span class="label label-warning">' + e(x.Rule) + '</span></td><td>' + e(x.Detail) + '</td></tr>'; });
		h += '</table>';
	}
	return h + '</div></div>';
}
