//
// Device Table (Cleotilde redesign, 2026-11-04): the device list as one compact row per device, instead of
// NetworkSensorDeviceStatusReport's big cards. Unknown devices first, then known, then the ones not seen now.
// Filter (all / unknown / known / not seen) and search survive the re-render every pulse.
// The buttons keep the card's classes and data attributes (wlAddBtn, wlRemoveBtn, wlIdentifyBtn, wlRenameBtn,
// wlForgetBtn, wlSelect, wlAddSelectedBtn...), so index.html's handlers do the work, code prompt included.
// The ⇄ button opens the device on the Traffic page (Traffic Panel's device detail).
// The ☆ button (2026-11-05) puts it on the critical list (wlCriticalBtn, DevicePresence.js keeps it current); tapping a
// name opens the device under the Network Map.
// Leaves 5 divs open: renderPageByPointer closes them.
//
var dsDevFilter = "all";
var dsDevSearch = "";

class DeviceTable extends NetworkSensorDeviceStatusReport {

	process(organismIPInfoJsonData) {
		var scan = getDeneWordByIdentityPointer("@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + DENECHAIN_SENSOR_DATA + ":" + DENE_NETWORK_SENSOR_STATUS + ":" + NETWORK_SCAN_TIME_STRING, DENEWORD_VALUE_ATTRIBUTE);
		var list = JSON.parse(getDeneWordByIdentityPointer("@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + DENECHAIN_SENSOR_DATA + ":" + DENE_NETWORK_SENSOR_STATUS + ":" + DEVICE_LIST, DENEWORD_VALUE_ATTRIBUTE) || "[]");
		var changes = {};
		try { changes = JSON.parse(getDeneWordByIdentityPointer("@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + DENECHAIN_SENSOR_DATA + ":" + DENE_NETWORK_SENSOR_STATUS + ":" + DEVICE_LIST_CHANGES, DENEWORD_VALUE_ATTRIBUTE) || "{}"); } catch (e) {}
		var self = this, order = { unknown: 0, known: 1, gone: 2 }, count = { unknown: 0, known: 0, gone: 0 };
		list.forEach(function (d) {
			d._k = !d[IS_DEVICE_PRESENT] ? "gone" : d[WHITE_LIST_STATUS] ? "known" : "unknown";
			count[d._k]++;
		});
		list.sort(function (a, b) {
			return order[a._k] - order[b._k] || self.displayName(a[DEVICE_NAME]).localeCompare(self.displayName(b[DEVICE_NAME]));
		});
		var selected = Object.keys(whiteListSelection).length;

		var h = '<div class="col-lg-12"><div class="ds-block">';
		h += '<h5><span>Devices <small class="ds-sub">scan ' + this.escape(scan) + '</small></span><span class="ds-devtools">'
			+ '<span class="btn-group btn-group-xs">'
			+ this.filterButton("all", "All " + list.length, "")
			+ this.filterButton("unknown", "Unknown " + count.unknown, "unknown")
			+ this.filterButton("known", "Known " + count.known, "known")
			+ this.filterButton("gone", "Not seen " + count.gone, "gone") + '</span>'
			+ '<input class="form-control input-sm" id="DSDevSearch" placeholder="Search name, IP, MAC" value="' + this.escape(dsDevSearch) + '" oninput="dsDevSearch=this.value;dsDevApply()">'
			+ '<a href="#" class="btn btn-xs btn-success wlAddSelectedBtn"' + (selected == 0 ? ' disabled' : '') + '>Add selected (<span id="wlSelectedCount">' + selected + '</span>)</a>'
			+ '</span></h5>';
		var news = (changes.New || []).map(this.changeName), gone = (changes.Missing || []).map(this.changeName);
		if (news.length || gone.length) {
			h += '<div class="ds-note" style="margin:8px 10px">' + (news.length ? news.length + ' new: ' + this.escape(news.join(", ")) + ' ' : '')
				+ (gone.length ? gone.length + ' missing: ' + this.escape(gone.join(", ")) : '') + '</div>';
		}
		h += '<table class="table table-condensed table-hover" id="DSDevTable"><tr><th style="width:24px"></th><th>Device</th><th>IP</th><th>MAC</th><th>Vendor / connection</th><th>Seen</th><th class="text-right">Actions</th></tr>';
		list.forEach(function (d) { h += self.row(d, organismIPInfoJsonData); });
		h += '</table><div><div><div>';   // 5 open: col, block, 3 here
		setTimeout(dsDevApply, 0);
		return h;
	}

	changeName(d) {
		return typeof d === "string" ? d : (d[DEVICE_NAME] || d[MAC_ADDRESS] || "");
	}

	filterButton(key, label, dot) {
		return '<button class="btn ' + (dsDevFilter === key ? 'btn-primary' : 'btn-default') + '" onclick="dsDevFilter=\'' + key + '\';dsDevApply();return false;" data-f="' + key + '">'
			+ (dot ? '<span class="ds-dot ' + dot + '"></span>' : '') + label + '</button>';
	}

	row(d, organismIPInfoJsonData) {
		var name = d[DEVICE_NAME], mac = d[MAC_ADDRESS] || "", ip = d[IP_ADDRESS] || "";
		var shown = this.displayName(name);
		var data = ' data-name="' + this.escape(name) + '" data-mac="' + this.escape(mac) + '"';
		var conn = d["Connection"] == "sweep only" ? '<span class="label label-danger" title="Found by Cleotilde\'s sweep; the router can\'t see it">sweep only</span>' : this.escape(d["Connection"] || "");
		var teleonome = this.teleonomeAt(ip, organismIPInfoJsonData);
		var sub = [];
		if (d["Original Name"]) sub.push("router name: " + this.escape(this.displayName(d["Original Name"])));
		if (d["Network Name"] && d["Network Name"] !== shown) sub.push("calls itself " + this.escape(d["Network Name"]));
		if (d["Guess"]) sub.push('<span title="because: ' + this.escape(d["Guess Because"]) + '">probably ' + this.escape(d["Guess"]) + '</span>');
		var seen = d._k === "gone" ? (d["Last Seen"] ? "last " + this.seen(d["Last Seen"]) : "") : (d["First Seen"] ? "since " + this.seen(d["First Seen"]) : "");

		var acts = "";
		if (mac) {
			var crit = typeof dsIsCritical === "function" && dsIsCritical(mac);
			acts += '<a href="#" class="btn btn-xs ds-iconbtn ds-critbtn wlCriticalBtn' + (crit ? ' on' : '') + '" title="' + (crit ? 'Critical: remove from the critical list' : 'Mark critical (must always be online)') + '"' + data + ' data-critical="' + (!crit) + '"><i class="glyphicon glyphicon-star' + (crit ? '' : '-empty') + '"></i></a> ';
			acts += d._k === "known"
				? '<a href="#" class="btn btn-xs btn-danger ds-iconbtn wlRemoveBtn" title="Remove from the known list"' + data + '><i class="glyphicon glyphicon-minus-sign"></i></a> '
				: '<a href="#" class="btn btn-xs btn-success ds-iconbtn wlAddBtn" title="Add to the known list"' + data + '><i class="glyphicon glyphicon-plus-sign"></i></a> ';
			acts += '<a href="#" class="btn btn-xs btn-primary ds-iconbtn" title="Everything it talked to" onclick="dsOpenDeviceTraffic(\'' + this.escape(mac) + '\');return false;"><i class="glyphicon glyphicon-transfer"></i></a> ';
			acts += '<a href="#" class="btn btn-xs btn-info ds-iconbtn wlIdentifyBtn" title="Identify" data-mac="' + this.escape(mac) + '"><i class="glyphicon glyphicon-search"></i></a> ';
			acts += '<a href="#" class="btn btn-xs btn-default ds-iconbtn wlRenameBtn" title="Rename"' + data + ' data-nickname="' + this.escape(d["Original Name"] ? shown : "") + '"><i class="glyphicon glyphicon-pencil"></i></a>';
			if (d._k === "gone") acts += ' <a href="#" class="btn btn-xs btn-default ds-iconbtn wlForgetBtn" title="Forget (deletes its history)"' + data + '><i class="glyphicon glyphicon-trash"></i></a>';
		}
		var check = d._k === "unknown" && mac
			? '<input type="checkbox" class="wlSelect"' + data + (whiteListSelection[mac] ? ' checked' : '') + '>' : '';
		var search = (shown + " " + ip + " " + mac + " " + (d["Vendor"] || "") + " " + (d["Guess"] || "")).toLowerCase();
		return '<tr data-k="' + d._k + '" data-s="' + this.escape(search) + '"><td>' + check + '</td>'
			+ '<td><span class="ds-dot ' + d._k + '"></span><b' + (mac && typeof dsMapSelect === "function" ? ' class="ds-click" title="Everything about it, under the map" onclick="dsMapSelect(\'' + this.escape(mac) + '\')"' : '') + '>' + this.escape(shown === mac ? "(no name)" : shown) + '</b>'
			+ (teleonome ? ' <a href="http://' + this.escape(teleonome) + '.local" target="_new" class="label label-info">' + this.escape(teleonome) + '</a>' : '')
			+ (sub.length ? '<div class="ds-sub">' + sub.join(" · ") + '</div>' : '') + '</td>'
			+ '<td>' + (ip && d._k !== "gone" ? '<a href="http://' + this.escape(ip) + '" target="_blank">' + this.escape(ip) + '</a>' : '<span class="ds-sub">' + this.escape(ip) + '</span>') + '</td>'
			+ '<td class="ds-mono">' + this.escape(mac) + '</td>'
			+ '<td>' + this.escape(d["Vendor"] || "") + (d["Vendor"] && conn ? ' · ' : '') + conn + '</td>'
			+ '<td class="ds-sub">' + seen + '</td>'
			+ '<td class="text-right" style="white-space:nowrap">' + acts + '</td></tr>';
	}
}

// filter + search without a re-render
function dsDevApply() {
	var q = (dsDevSearch || "").toLowerCase();
	$('#DSDevTable tr[data-k]').each(function () {
		var ok = (dsDevFilter === "all" || this.getAttribute("data-k") === dsDevFilter) && this.getAttribute("data-s").indexOf(q) >= 0;
		this.style.display = ok ? "" : "none";
	});
	$('.ds-block .btn-group [data-f]').each(function () {
		$(this).toggleClass('btn-primary', this.getAttribute('data-f') === dsDevFilter).toggleClass('btn-default', this.getAttribute('data-f') !== dsDevFilter);
	});
}

// ⇄ on a device: the Traffic page (the page whose title is "Traffic") with that device open
function dsOpenDeviceTraffic(mac) {
	var cp = dsControlParameters(), position = null;
	(cp && cp.Denes || []).forEach(function (d) {
		if (dsWordByType(d, DENEWORD_TYPE_HUMAN_INTERFACE_WEB_PAGE_PAGE_TITLE) === "Traffic") position = dsWordByType(d, DENEWORD_HUMAN_INTERFACE_WEB_PAGE_PAGE_POSITION);
	});
	trafficOpenMac = mac;
	trafficDeviceData = null;
	trafficDeviceCountry = null;
	if (position != null) setPageToDisplay(position);
	trafficRefreshDevice();
	setTimeout(function () { var el = document.getElementById("TrafficDeviceDetail"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 600);
}
