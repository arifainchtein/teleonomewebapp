"use strict";
var denomeJSONObject;
var pulseJSONObject;

// Heart message log — ring buffer, newest first
var heartMessageLog = [];
var HEART_LOG_MAX = 150;

var heartLogTopics = [];

function heartLogMessage(topic, payload) {
	var now = new Date();
	var ts = now.toTimeString().slice(0, 8);
	var full = String(payload);
	var preview = full.length > 120 ? full.slice(0, 120) + '…' : full;
	var entry = { time: ts, topic: topic, preview: preview, full: full };
	heartMessageLog.unshift(entry);
	if (heartMessageLog.length > HEART_LOG_MAX) heartMessageLog.pop();
	// Track unique topics and update dropdown if new one seen
	if (heartLogTopics.indexOf(topic) === -1) {
		heartLogTopics.push(topic);
		heartLogTopics.sort();
		heartLogUpdateFilterOptions();
	}
	// Only add to visible log if it matches the current filter
	var $log = $('#heart-log-view');
	if ($log.length) {
		var filter = $('#heart-log-filter').val() || '';
		if (!filter || filter === topic) {
			$log.prepend(heartLogEntryHtml(entry));
			var rows = $log.children();
			if (rows.length > HEART_LOG_MAX) rows.last().remove();
		}
	}
}
function heartLogEntryHtml(entry) {
	return '<div style="padding:2px 0 2px 0;border-bottom:1px solid #1e2a3a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
		+ '<span style="color:#569cd6;flex-shrink:0;">' + entry.time + '</span>'
		+ '&nbsp;<span style="color:#dcdcaa;font-weight:bold;">' + entry.topic + '</span>'
		+ '&nbsp;<span style="color:#9cdcfe;font-size:10px;">' + entry.preview + '</span>'
		+ '</div>';
}
function heartLogBuildHtml() {
	return heartMessageLog.map(heartLogEntryHtml).join('');
}
function heartLogUpdateFilterOptions() {
	var $sel = $('#heart-log-filter');
	if (!$sel.length) return;
	var current = $sel.val();
	$sel.empty().append('<option value="">Show All</option>');
	heartLogTopics.forEach(function(t) {
		$sel.append('<option value="' + t + '"' + (t === current ? ' selected' : '') + '>' + t + '</option>');
	});
}
function heartLogApplyFilter() {
	var filter = $('#heart-log-filter').val() || '';
	var entries = filter ? heartMessageLog.filter(function(e) { return e.topic === filter; }) : heartMessageLog;
	$('#heart-log-view').html(entries.map(heartLogEntryHtml).join(''));
}
function heartLogDownload() {
	var lines = heartMessageLog.map(function(e) {
		return e.time + '\t' + e.topic + '\t' + (e.full || e.preview);
	});
	var text = 'Time\tTopic\tPayload\n' + lines.join('\n');
	var blob = new Blob([text], { type: 'text/plain' });
	var url = URL.createObjectURL(blob);
	var a = document.createElement('a');
	a.href = url;
	a.download = 'heart-log-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.txt';
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

//
// Heart/Hypothalamus self-reported health, broadcast live (HEART_TOPIC_HEART_HEALTH_STATUS /
// HEART_TOPIC_HYPOTHALAMUS_HEALTH_STATUS -- see conversation 2026-08-05). Independent of the
// pulse cycle, so these update the Heart modal's stats table the moment a message arrives,
// not just on the next full pulse refresh.
//
var lastHeartHealthStatus = null;
var lastHypothalamusHealthStatus = null;

function updateHeartHealthStatus(text) {
	try { lastHeartHealthStatus = JSON.parse(text); } catch (e) { return; }
	refreshHeartStatsView();
}
function updateHypothalamusHealthStatus(text) {
	try { lastHypothalamusHealthStatus = JSON.parse(text); } catch (e) { return; }
	refreshHeartStatsView();
}
function heartHealthRowHtml(label, valueHtml) {
	return '<tr><td>' + label + '</td><td>' + valueHtml + '</td></tr>';
}
// Consecutive-failure threshold at which Medula itself restarts Heart --
// kept in sync with Medula.java's check by eye, not shared code, since the
// two are different runtimes. Update both places together if it changes.
var HEART_PUBLISH_FAILURE_RESTART_THRESHOLD = 5;
// Metaspace percent-used above which Medula starts logging a pathology dene
// for trend-tracking (not yet an auto-restart trigger there either -- see
// PATHOLOGY_HEART_METASPACE_PRESSURE in TeleonomeConstants.java).
var HEART_METASPACE_WATCH_THRESHOLD = 90;

function refreshHeartStatsView() {
	var $view = $('#heart-stats-view');
	if (!$view.length) return;

	var heartContent = '<table class="table table-condensed table-striped" style="margin-bottom:0;">';
	heartContent += '<tr><td>Last Pulse</td><td><strong>' + (pulseTimestamp || '—') + '</strong></td></tr>';
	heartContent += '<tr><td>Time Since Pulse</td><td><strong>' + (timeStringSinceLastPulse || '—') + '</strong></td></tr>';
	heartContent += '<tr><td>Operational Mode</td><td><strong>' + (operationalMode || '—') + '</strong></td></tr>';
	if (currentPulseFrequency != undefined) heartContent += '<tr><td>Pulse Frequency</td><td><strong>' + msToTime(currentPulseFrequency) + '</strong></td></tr>';
	if (currentPulseGenerationDuration != undefined) heartContent += '<tr><td>Generation Duration</td><td><strong>' + msToTime(currentPulseGenerationDuration) + '</strong></td></tr>';

	heartContent += '<tr><td colspan="2" style="padding-top:10px;"><strong>Heart Health</strong></td></tr>';
	if (lastHeartHealthStatus) {
		var h = lastHeartHealthStatus;
		var metaspace = h["Heart Metaspace Percent Used"];
		var fullGc = h["Heart Full GC Count"];
		var sessionLoops = h["sessionEventLoopCount"];
		var deadLoops = h["deadSessionEventLoopCount"];

		var metaspaceHtml;
		if (metaspace == undefined || metaspace < 0) {
			metaspaceHtml = '<strong>—</strong>';
		} else {
			var pct = Number(metaspace).toFixed(1);
			if (metaspace >= HEART_METASPACE_WATCH_THRESHOLD) {
				metaspaceHtml = '<strong style="color:#c0392b;">' + pct + '% &#9888; high — Heart may need a restart soon</strong>';
			} else if (metaspace >= 75) {
				metaspaceHtml = '<strong style="color:#f39c12;">' + pct + '%</strong>';
			} else {
				metaspaceHtml = '<strong style="color:#27ae60;">' + pct + '%</strong>';
			}
		}
		heartContent += heartHealthRowHtml('Metaspace Used', metaspaceHtml);
		heartContent += heartHealthRowHtml('Full GC Count', '<strong>' + (fullGc != undefined && fullGc >= 0 ? fullGc : '—') + '</strong>');

		var loopsHtml;
		if (sessionLoops == undefined) {
			loopsHtml = '<strong>—</strong>';
		} else if (deadLoops > 0) {
			loopsHtml = '<strong style="color:#c0392b;">' + deadLoops + ' of ' + sessionLoops + ' dead &#9888; some clients permanently unresponsive</strong>';
		} else {
			loopsHtml = '<strong style="color:#27ae60;">' + sessionLoops + ' of ' + sessionLoops + ' alive</strong>';
		}
		heartContent += heartHealthRowHtml('Session Event Loops', loopsHtml);
	} else {
		heartContent += '<tr><td colspan="2" class="text-muted">Waiting for data…</td></tr>';
	}

	heartContent += '<tr><td colspan="2" style="padding-top:10px;"><strong>Hypothalamus &rarr; Heart Publishing</strong></td></tr>';
	if (lastHypothalamusHealthStatus) {
		var failures = lastHypothalamusHealthStatus["heartPublishConsecutiveFailures"];
		var failuresHtml;
		if (failures == undefined) {
			failuresHtml = '<strong>—</strong>';
		} else if (failures >= HEART_PUBLISH_FAILURE_RESTART_THRESHOLD) {
			failuresHtml = '<strong style="color:#c0392b;">' + failures + ' consecutive failures &#9888; Heart restart imminent</strong>';
		} else if (failures > 0) {
			failuresHtml = '<strong style="color:#f39c12;">' + failures + ' consecutive failure' + (failures === 1 ? '' : 's') + '</strong>';
		} else {
			failuresHtml = '<strong style="color:#27ae60;">0 — publishing normally</strong>';
		}
		heartContent += heartHealthRowHtml('Publish Status', failuresHtml);
	} else {
		heartContent += '<tr><td colspan="2" class="text-muted">Waiting for data…</td></tr>';
	}

	heartContent += '</table>';
	$view.html(heartContent);
}

var teleonomeName;
var nucleiJSONArray;
var pageToDisplay = -1;
var identityFactory;
var i,j,k,l;
var availableSSIDSArray;
var refreshInterfaceAfterModalNeeded=false;
var rowPanelCounter=0;
//the humanInterfaceDeneChainIndex is a key value pair
//the key is the pointer and the value is the actual denechain
//the pointer is of the form @teleonomeName:Human Interface:Home Page
var humanInterfaceDeneChainIndex = new HashMap();
var humanInterfaceDeneChainArray;
var telepathonCardDataCache = {};
var annabelleQueueStatusCache = null;
var lastKnownCerebellumValues = {};
var telepathonDeviceTypeCache = {}; // keyed by device name, populated only from live TelepathonStatus packets
var pulseTimestamp;
var pulseTimestampMilliseconds;
var timeStringSinceLastPulse;
var timeSinceLastPulse;
var currentPulseFrequency;
var currentPulseGenerationDuration;
var numberOfPulsesBeforeLate;
var betweenPulseInterval;
var teleonomeStatusBootstrapValue="info";
var chartDataSourcePointerHashMap = new HashMap();
var chartStyleHashMap = new HashMap();
var chartTimeStringHashMap = new HashMap();
var chartTitleHashMap = new HashMap();
var organsRenderedThisCycle = false;

// (moved to deviceviews, 2026-10-31)

// Modal centering on this page (index.html: "body.modal-open .modal.in { display:
// flex } body.modal-open .modal.in .modal-dialog { margin:auto }") only applies
// while <body> carries the "modal-open" class. Bootstrap's own hide handling
// strips that class as soon as ANY modal finishes closing, with no awareness of
// whether another modal (e.g. the Registry Status popup, still open underneath a
// telepathon detail modal) is still showing - so closing the inner one stranded
// the outer one without centering, snapping it to the top-left. Delegated on
// document so it also covers modals like tpModal_*, created at runtime.
$(document).on('hidden.bs.modal', '.modal', function () {
	if ($('.modal.in').length > 0) {
		$('body').addClass('modal-open');
	}
});

function computeQueueAnalysisStatusColor(chain) {
	// Worst-of-any-queue: red if any queue has dropped items (data loss),
	// yellow if any queue has a backlog of undelivered items, else green.
	var denes = chain["Denes"] || [];
	var hasDrops = false, hasBacklog = false;
	for (var i = 0; i < denes.length; i++) {
		var dws = denes[i]["DeneWords"] || [];
		for (var j = 0; j < dws.length; j++) {
			if (dws[j]["Name"] === "Items Dropped" && parseFloat(dws[j]["Value"]) > 0) hasDrops = true;
			if (dws[j]["Name"] === "Items Available" && parseFloat(dws[j]["Value"]) > 0) hasBacklog = true;
		}
	}
	return hasDrops ? '#e74c3c' : (hasBacklog ? '#f39c12' : '#27ae60');
}

function queueAnalysisButtonColor() {
	return annabelleQueueStatusCache ? computeQueueAnalysisStatusColor(annabelleQueueStatusCache) : '#777';
}

function refreshQueueAnalysisModal(chain) {
	annabelleQueueStatusCache = chain;
	var color = computeQueueAnalysisStatusColor(chain);
	var $btn = $('#queueAnalysisBtn');
	if ($btn.length) {
		$btn.css({'background-color': color, 'border-color': color, 'color': '#fff'});
	}
	if ($('#queue-analysis-modal-body').length) {
		$('#queue-analysis-modal-body').html(buildTelepathonDetailContent(chain));
	}
}

function openQueueAnalysisModal() {
	if (annabelleQueueStatusCache) {
		$('#queue-analysis-modal-body').html(buildTelepathonDetailContent(annabelleQueueStatusCache));
	}
	openModal('queue-analysis-modal');
}

// TelepathonRegistryTask (cerebellum) already computes per-device OK/WARNING/CRITICAL
// status server-side, using per-Device-Type lateness thresholds, and publishes the
// whole fleet into this Dene every pulse — so this just reads it, no AJAX call needed.
function getTelepathonRegistryDeviceList() {
	var devicesPointer = "@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + DENECHAIN_PURPOSE_CEREBELLUM + ":" + DENE_TELEPATHON_REGISTRY + ":" + DENEWORD_TELEPATHON_REGISTRY_DEVICES;
	var devicesJsonString = getDeneWordByIdentityPointer(devicesPointer, DENEWORD_VALUE_ATTRIBUTE);
	if (!devicesJsonString) return null;
	try {
		return JSON.parse(devicesJsonString);
	} catch (e) {
		console.log("error parsing Telepathon Registry Devices:" + e);
		return null;
	}
}

function getCerebellumDaysBeforeStale() {
	var pointer = "@" + teleonomeName + ":" + NUCLEI_INTERNAL + ":" + DENECHAIN_INTERNAL_CEREBELLUM + ":" + DENE_CEREBELLUM_CONFIGURATION + ":" + DENEWORD_CEREBELLUM_DAYS_BEFORE_STALE;
	var days = parseFloat(getDeneWordByIdentityPointer(pointer, DENEWORD_VALUE_ATTRIBUTE));
	return (isNaN(days) || days <= 0) ? DEFAULT_CEREBELLUM_DAYS_BEFORE_STALE : days;
}

// "Current" = heard from within "Days Before Stale", not Status === "OK". "OK" only
// means "within the per-device-type Late threshold" (30 min for a Daffodil), so a
// device that pulsed all day and is simply asleep tonight (TopTank) was dropping
// out of Show Current. Decided here from "Seconds Since Last Seen" rather than
// from Status === "CRITICAL", so it's right even on a Cerebellum whose CRITICAL
// cutoff predates "Days Before Stale" (the old fixed 60 min).
function isRegistryDeviceCurrent(device) {
	var ageSec = device["Seconds Since Last Seen"];
	if (typeof ageSec !== 'number') return device["Status"] !== "CRITICAL";
	return ageSec < getCerebellumDaysBeforeStale() * 86400;
}

// Registry devices that are "current" (matches the modal's "Show Current" filter) --
// used by the "Temperature Chart" header button so a stale device (which has
// stopped reporting and would just draw a flat/empty line) doesn't get requested.
function getValidTelepathonRegistryNames() {
	var devices = getTelepathonRegistryDeviceList();
	if (!devices) return [];
	return devices.filter(isRegistryDeviceCurrent).map(function(d) { return d["Name"]; });
}

// Different telepathon device types publish ambient temperature under different
// DeneWord names (Daffodil/Chinampa: "Outdoor Temperature", Langley: "Internal
// Temperature") and occasionally under "Sensors" rather than "Purpose" (Daffodil).
// Try each candidate in priority order against the device's live card data
// (telepathonCardDataCache, kept current by refreshTelepathonsView/updateTelepathonsView)
// and use whichever is actually present.
var TELEPATHON_TEMPERATURE_FIELD_CANDIDATES = ["Outdoor Temperature", "Internal Temperature", "Temperature"];
var TELEPATHON_TEMPERATURE_DENE_ORDER = ["Purpose", "Sensors"];
function findTelepathonTemperatureField(telepathonName) {
	var record = telepathonCardDataCache[telepathonName];
	if (!record) return null;
	for (var ci = 0; ci < TELEPATHON_TEMPERATURE_FIELD_CANDIDATES.length; ci++) {
		for (var di = 0; di < TELEPATHON_TEMPERATURE_DENE_ORDER.length; di++) {
			var dw = getDeneWordFromTelepathon(record, TELEPATHON_TEMPERATURE_DENE_ORDER[di], TELEPATHON_TEMPERATURE_FIELD_CANDIDATES[ci], COMPLETE);
			if (dw) {
				return { deneName: TELEPATHON_TEMPERATURE_DENE_ORDER[di], deneWordName: TELEPATHON_TEMPERATURE_FIELD_CANDIDATES[ci], units: dw["Units"] || "°C" };
			}
		}
	}
	return null;
}

// Candidate (name, device type, serial) triples not yet promoted to the official
// registry - see TelepathonRegistryTask's "temporary list". Same DeneWord-read
// pattern as getTelepathonRegistryDeviceList(), no AJAX needed.
function getTelepathonRegistryPendingList() {
	var pendingPointer = "@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + DENECHAIN_PURPOSE_CEREBELLUM + ":" + DENE_TELEPATHON_REGISTRY + ":" + DENEWORD_TELEPATHON_REGISTRY_PENDING_DEVICES;
	var pendingJsonString = getDeneWordByIdentityPointer(pendingPointer, DENEWORD_VALUE_ATTRIBUTE);
	if (!pendingJsonString) return null;
	try {
		return JSON.parse(pendingJsonString);
	} catch (e) {
		console.log("error parsing Telepathon Registry Pending Devices:" + e);
		return null;
	}
}

function formatPendingAge(ageSeconds) {
	if (ageSeconds < 60) return Math.floor(ageSeconds) + 's ago';
	if (ageSeconds < 3600) return Math.floor(ageSeconds / 60) + 'm ago';
	if (ageSeconds < 86400) return Math.floor(ageSeconds / 3600) + 'h ago';
	return Math.floor(ageSeconds / 86400) + 'd ago';
}

// A table, not cards - unlike the official registry (one row per confirmed
// device), a pending name can have several competing serial numbers at once,
// which is exactly the thing worth comparing side by side (occurrence count is
// the whole point: which candidate is closest to promotion).
function buildPendingListContent(pending) {
	if (!pending || pending.length === 0) {
		return '<p class="text-muted text-center" style="padding:20px;">Temporary list is empty - nothing currently unconfirmed.</p>';
	}
	var nowSeconds = Date.now() / 1000;
	var html = '<table class="table table-condensed table-striped">';
	html += '<thead><tr><th>Reported Name</th><th>Device Type</th><th>Serial Number</th><th>Occurrence Count</th><th>First Seen</th></tr></thead><tbody>';
	for (var i = 0; i < pending.length; i++) {
		var p = pending[i];
		html += '<tr>';
		html += '<td>' + p["Name"] + '</td>';
		html += '<td>' + p["Device Type"] + '</td>';
		html += '<td>' + p["Serial Number"] + '</td>';
		html += '<td>' + p["Occurrence Count"] + '</td>';
		html += '<td>' + formatPendingAge(nowSeconds - p["First Seen Epoch"]) + '</td>';
		html += '</tr>';
	}
	html += '</tbody></table>';
	return html;
}

function computeRegistryStatusButtonColor() {
	var statusPointer = "@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + DENECHAIN_PURPOSE_CEREBELLUM + ":" + DENE_TELEPATHON_REGISTRY + ":" + DENEWORD_TELEPATHON_REGISTRY_STATUS;
	var status = getDeneWordByIdentityPointer(statusPointer, DENEWORD_VALUE_ATTRIBUTE);
	if (status === "CRITICAL") return '#e74c3c';
	if (status === "WARNING") return '#f39c12';
	if (status === "OK") return '#27ae60';
	return '#777';
}

function refreshRegistryStatusButton() {
	var $btn = $('#registryStatusBtn');
	if (!$btn.length) return;
	var color = computeRegistryStatusButtonColor();
	$btn.css({'background-color': color, 'border-color': color, 'color': '#fff'});
}

// Renders the registry as the same card grid the main Telepathons view uses -
// reuses buildTelepathonCardView() itself rather than a bespoke summary table,
// so clicking a card opens the identical full Configuration/Sensors/Purpose
// detail modal a live telepathon gets. Fed by each device's LAST KNOWN reading
// from Postgres (GetLastTelepathonRecords), not the live denome - the whole
// point being a device still shows up here after the live denome has pruned it
// (anything idle over an hour disappears from the main view entirely, even
// though the database still has its last reading).
//
// '_registry' idSuffix keeps this grid's DOM ids (tpModal_/tpText_/tpCardCol_)
// distinct from the main view's, since a device can legitimately be rendered in
// both places at once.
function buildRegistryCard(telepathonData, isCurrent) {
	var cardHtml = buildTelepathonCardView(telepathonData, '_registry');
	var $card = $(cardHtml);
	$card.attr('data-registry-status', isCurrent ? 'current' : 'stale');
	return $card;
}

function buildRegistryNoDataCard(name, isCurrent) {
	return $(
		'<div class="col-xs-12 col-sm-6 col-md-4" data-registry-status="' + (isCurrent ? 'current' : 'stale') + '" ' +
		'style="margin-bottom:16px;padding:6px;">' +
		'<div style="border-radius:12px;border:1px dashed #ccc;padding:14px;text-align:center;color:#999;">' +
		'<div style="font-weight:bold;">' + name + '</div>' +
		'<div style="font-size:12px;margin-top:6px;">No stored data found</div>' +
		'</div></div>'
	);
}

// Re-slices the cached full Memory-by-Sensor breakdown (hippoBreakdownAllSlices, set
// in renderOrgansPanel()) by whether each slice's name is in the Cerebellum registry's
// valid (official) or temporary (pending) name set, and redraws the pie chart.
//
// "Show All" reorders the slices into Valid-then-Temporary-then-Other groups (rather
// than leaving Hippocampus's own top-15-by-volume order, which interleaves them) and
// passes `sections` so drawHippocampusPieChart() draws a heading + gap per group in the
// legend. "Other" catches both MemoryBreakdown's own top-15-cap overflow bucket and any
// name the registry hasn't classified as valid or pending yet - membership there is
// ambiguous by construction, so it only ever shows up under "Show All".
function filterHippoBreakdownChart(filter) {
	if (!hippoBreakdownAllSlices) return;
	var isValid     = function(s) { return hippoBreakdownValidNames && hippoBreakdownValidNames[s.name]; };
	var isTemporary = function(s) { return hippoBreakdownPendingNames && hippoBreakdownPendingNames[s.name]; };

	if (filter === 'valid') {
		drawHippocampusPieChart('hippo-breakdown-chart', hippoBreakdownAllSlices.filter(isValid));
		return;
	}
	if (filter === 'temporary') {
		drawHippocampusPieChart('hippo-breakdown-chart', hippoBreakdownAllSlices.filter(isTemporary));
		return;
	}

	var validSlices     = hippoBreakdownAllSlices.filter(isValid);
	var temporarySlices  = hippoBreakdownAllSlices.filter(isTemporary);
	var otherSlices      = hippoBreakdownAllSlices.filter(function(s) { return !isValid(s) && !isTemporary(s); });
	var grouped = validSlices.concat(temporarySlices).concat(otherSlices);
	var sections = [
		{ label: 'Valid', count: validSlices.length },
		{ label: 'Temporary', count: temporarySlices.length },
		{ label: 'Other', count: otherSlices.length }
	];
	drawHippocampusPieChart('hippo-breakdown-chart', grouped, null, sections);
}

function filterRegistryStatusTable(filter) {
	if (filter === 'all') {
		$('#registry-status-cards [data-registry-status]').show();
	} else {
		$('#registry-status-cards [data-registry-status]').hide();
		$('#registry-status-cards [data-registry-status="' + filter + '"]').show();
	}
}

// Fetches each registered device's last-known full reading in one round trip
// and renders the card grid - separate from openRegistryStatusModal() so the
// modal opens immediately (with a loading placeholder) rather than waiting on
// the AJAX call before showing anything.
function loadRegistryCards(devices) {
	if (!devices.length) {
		$('#registry-status-loading').text('No telepathon registry data found.');
		return;
	}
	var names = devices.map(function (d) { return d["Name"]; });
	$.ajax({
		type: "GET",
		url: "/TeleonomeServlet",
		data: { formName: "GetLastTelepathonRecords", telepathonNames: names.join(",") },
		dataType: "json",
		success: function (records) {
			$('#registry-status-loading').remove();
			var $container = $('#registry-status-cards');
			devices = devices.slice().sort(function (a, b) {
				return (a["Name"] || "").localeCompare(b["Name"] || "");
			});
			for (var i = 0; i < devices.length; i++) {
				var device = devices[i];
				var name = device["Name"];
				var record = records ? records[name] : null;
				var isCurrent = isRegistryDeviceCurrent(device);
				var $card = (record && record["data"])
					? buildRegistryCard(record["data"], isCurrent)
					: buildRegistryNoDataCard(name, isCurrent);
				$container.append($card);
			}
			filterRegistryStatusTable($('input[name="registryStatusFilter"]:checked').val() || 'current');
		},
		error: function () {
			$('#registry-status-loading').text('Error loading last known telepathon data.');
		}
	});
}

function openRegistryStatusModal() {
	$('input[name="registryStatusFilter"][value="current"]').prop('checked', true);
	// Reset to the Registry tab every time the modal is (re)opened, rather than
	// leaving it wherever the user last clicked away from.
	var $modal = $('#registry-status-modal');
	$modal.find('.nav-pills > li').first().addClass('active').siblings().removeClass('active');
	$modal.find('.tab-pane').first().addClass('active').siblings('.tab-pane').removeClass('active');

	var devices = getTelepathonRegistryDeviceList();
	if (devices === null) {
		$('#registry-status-modal-body').html('<p class="text-danger text-center" style="padding:20px;">Error loading registry status.</p>');
	} else {
		$('#registry-status-modal-body').html(
			'<div id="registry-status-cards" class="row"></div>' +
			'<p id="registry-status-loading" class="text-muted text-center" style="padding:20px;">Loading last known data…</p>'
		);
		loadRegistryCards(devices);
	}

	var pending = getTelepathonRegistryPendingList();
	$('#registry-pending-pane').html(
		pending === null
			? '<p class="text-danger text-center" style="padding:20px;">Error loading temporary list.</p>'
			: buildPendingListContent(pending)
	);

	openModal('registry-status-modal');
}

var organismInfoJsonData;
var telepathonsJsonData;

// Full (unfiltered) Hippocampus "Memory by Sensor" pie slices, plus the Cerebellum
// registry's valid/temporary name sets - kept across renders so the Show All/Valid/
// Temporary radios (see filterHippoBreakdownChart()) can re-slice without re-parsing
// the denome.
var hippoBreakdownAllSlices = null;
var hippoBreakdownValidNames = null;
var hippoBreakdownPendingNames = null;

var organismIPInfoJsonData;
var pulseCreationTime="";
var currentPathologyDeneCount=0;
var operationalMode="";
function monitorBetweenPulses() {

	timeSinceLastPulse = new Date().getTime()-pulseTimestampMilliseconds;
	timeStringSinceLastPulse = msToTime(timeSinceLastPulse);
	$("#TimeSinceLastPulse").html(timeStringSinceLastPulse);
	//// console.log("timeStringSinceLastPulse=" + timeStringSinceLastPulse);

	//
	// now calculate if we should change the color to indicate that is late
	// the logic is as follows:
	// currentPulseFrequency = how long to sleep between the end of a pulse cycle and the beginning of the next
	// currentPulseGenerationDuration = how long it took to generate the pulse
	//
	// under normal circunstance, you could have that it takes 5 seconds to execute a pulse
	// and the frequency is every 60 seconds.  however, if there are anylticons or mnemosycins involved
	// it could easily be that it takes 20 minutes to complete a pulse and then the pulse slee ps for 60 secnds
	//
	// because of this, the time to go to flasinh warning is when the last pulse
	// is half of what it the threshold and blinking red if its greater thant the 
	// algoritym

	if ( numberOfPulsesBeforeLate != undefined &&
			currentPulseGenerationDuration != undefined &&
			currentPulseFrequency != undefined){

		var timeBeforeLate = numberOfPulsesBeforeLate*(currentPulseGenerationDuration+currentPulseFrequency);
		//timeBeforeLate = 60000;
		//// console.log("timeBeforeLate=" + timeBeforeLate + " timeSinceLastPulse=" + timeSinceLastPulse);
		if(timeSinceLastPulse>timeBeforeLate){
			//
			// set the status to blinking yellow
			//
			if ($(window).width() < 480) {
				$('#TeleonomeDataStatus').removeClass().addClass('label label-xs label-danger');
			}else{
				$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-danger');
			}
		}else if(timeSinceLastPulse>timeBeforeLate/2){ 
			if ($(window).width() < 480) {
				$('#TeleonomeDataStatus').removeClass().addClass('label label-xs label-warning');
			}else{
				$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-warning');
			}
		}else{
			//
			// set the status to blinking yellow
			//	
			if ($(window).width() < 480) {
				$('#TeleonomeDataStatus').removeClass().addClass('label label-xs label-success');
			}else{
				$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-success');
			}
		}
	}
} 

function renderCommandRequestTable(commandsInfo){
	var commandsPerPage=20;
	var total = commandsInfo.Total;
	var allCommands = commandsInfo.Values;
	var limit = commandsInfo.Limit;
	var offset = commandsInfo.Offset;
	var numberOfPagesToShow = 5;
	var numberOfPages = total/commandsPerPage;

	if ($(window).width() < 480) {
		commandsPerPage=5;
		var panelHTML = "<table class=\"table\"><tbody>";

		for (var i = 0; i < allCommands.length; i++) {
			var command = allCommands[i];

			var createdOnDate = new Date(command.Createdon);
			var createdOnDateFormated = getISOStringWithoutSecsAndMillisecs(createdOnDate);
			var executedOnDateFormated="";
			if(command.Executedon>0){
				var executedOnDate = new Date(command.Executedon);
				executedOnDateFormated = getISOStringWithoutSecsAndMillisecs(executedOnDate);
			}
			var rowStatus="info";
			if(command.Status ==COMMAND_REQUEST_EXECUTED){
				rowStatus="success";
			}else if(command.Status ==COMMAND_REQUEST_PENDING_EXECUTION){
				rowStatus="warning";
			}else if(command.Status ==COMMAND_REQUEST_SKIPPED_AT_INIT || command.Status ==COMMAND_REQUEST_INVALID_CODE){
				rowStatus="danger";
			}
			panelHTML += "<tr class=\""+ rowStatus+"\"><td>";
			panelHTML += "<table table-borderless>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Id</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+command.id+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Client Ip</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+command.ClientIp+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Created On</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+ createdOnDateFormated +"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Executed On</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+executedOnDateFormated+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Command</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + command.Command +"</td></tr>";
			if(command.Payload==undefined || command.Payload==""){
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Payload</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;No Payload</td></tr>";
			}else{
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Payload</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;<pre><code>" + command.Payload +"</code></pre></td></tr>";
			}
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Status</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + command.Status +"</td></tr>";
			panelHTML += "</table>";
			panelHTML += "</td></tr>";
		}
		panelHTML += "</tbody></table>";
	}else{
		var panelHTML = "<table class=\"table table-responsive\">";
		panelHTML += "<thead><tr><th>Id</th><th>Client Ip</th><th>Created On</th><th>ExecutedOn</th><th>Command</th><th>Payload</th><th>Status</th></tr></thead><tbody>";
		for (var i = 0; i < allCommands.length; i++) {
			var command = allCommands[i];

			var createdOnDate = new Date(command.Createdon);
			var createdOnDateFormated = getISOStringWithoutSecsAndMillisecs(createdOnDate);
			var executedOnDateFormated="";
			if(command.Executedon>0){
				var executedOnDate = new Date(command.Executedon);
				executedOnDateFormated = getISOStringWithoutSecsAndMillisecs(executedOnDate);
			}
			var rowStatus="info";
			if(command.Status ==COMMAND_REQUEST_EXECUTED){
				rowStatus="success";
			}else if(command.Status ==COMMAND_REQUEST_PENDING_EXECUTION){
				rowStatus="warning";
			}else if(command.Status ==COMMAND_REQUEST_SKIPPED_AT_INIT || command.Status ==COMMAND_REQUEST_INVALID_CODE){
				rowStatus="danger";
			}
			if(command.Payload==undefined || command.Payload==""){
				panelHTML += "<tr class=\""+ rowStatus+"\"><td>"+command.id+"</td><td>"+command.ClientIp+"</td><td>"+ createdOnDateFormated +"</td><td>"+executedOnDateFormated+"</td><td>" + command.Command +"</td><td>No Payload</td><td>" + command.Status +"</td></tr>";
			}else{
				panelHTML += "<tr class=\""+ rowStatus+"\"><td>"+command.id+"</td><td>"+command.ClientIp+"</td><td>"+ createdOnDateFormated +"</td><td>"+executedOnDateFormated+"</td><td>" + command.Command +"</td><td><pre><code>" + command.Payload +"</code></pre></td><td>" + command.Status +"</td></tr>";
			}
		}
		panelHTML += "</tbody></table>";
		//
		// do the pagination
		//
		var numberOfPages = (1 + total/limit)|0	;
		var paginationStart=1;
		if(offset>0){
			paginationStart= paginationStart + offset;
		}
		var paginationEnd = paginationStart + numberOfPagesToShow;

		panelHTML += "<ul class=\"pagination justify-content-center\">";
		panelHTML += "	<li class=\"page-item disabled\">";
		panelHTML += "		<a class=\"page-link\" href=\"#\" tabindex=\"-1\">Previous</a>";
		panelHTML += 	"</li>";
		for(var j=paginationStart; j<(paginationEnd-paginationStart); j++){
			panelHTML += "	<li data-offset=\""+j +"\" class=\"page-item\"><a class=\"page-link\" href=\"#\">"+j+"</a></li>";
		}
		panelHTML += "	<li class=\"page-item\"><a data-offset=\""+(offset + numberOfPagesToShow) +"\"  class=\"page-link\" href=\"#\"> ...</a></li>";
		panelHTML += "	<li class=\"page-item\"><a data-offset=\""+numberOfPages +"\" class=\"page-link\" href=\"#\"> " + numberOfPages +"</a></li>";

		panelHTML += "	<li class=\"page-item\">";
		panelHTML += "	<a class=\"page-link\" href=\"#\">Next</a>";
		panelHTML += "</li>";
		panelHTML += "</ul>";

		//
		//
	}
	return panelHTML;
}
function renderMnemosycons(mnemosyconProcessingAddressPointer){
	//
	// mnemosyconProcessingAddressPointer will contain the complete address
	// ie @Sento:Mnemosyne:Mnemosyne Current Week:Static Mnemosycon Processing
	// but because this is the mnemosyne, there will be many instances
	// of Static Mnemosycon Processing inside of Mnemosyne Current Week
	// as well as other denes that are not Static Mnemosycon Processing
	// so first separate the denes called Static Mnemosycon Processing
	// then sort them by Position
	var identity = identityFactory.createIdentityByPointer(mnemosyconProcessingAddressPointer);
	var teleonomeName = identity.teleonomeName;
	var nucleusName = identity.nucleusName;
	var deneChainName = identity.deneChainName;
	//
	// the deneName represents all the denes which will be part f the report
	var deneName = identity.deneName;

	//
	// now make an identity for the parent, ie @Sento:Mnemosyne:Mnemosyne Current Week:
	var parentMnemosyconProcessingAddressPointer =  "@" +teleonomeName + ":" + nucleusName + ":" +deneChainName;

	var parentMnemosyconProcessingDenesDeneChain = getDeneChainByIdentityPointer(parentMnemosyconProcessingAddressPointer);
	var denes = parentMnemosyconProcessingDenesDeneChain["Denes"];	
	//
	// now loop over all the denes and store the ones that match in  a hashmap to be sorted
	//
	var unsortedHashMap = new HashMap();

	for (var i = 0; i < denes.length; i++) {
		var dene = denes[i];
		//
		if(dene.Name == deneName){
			unsortedHashMap.put(dene.Position,dene);
		}
	}
	var sorted = sortHashMap(unsortedHashMap);
	if(sorted["_size"]==0) return "";

	var mnemosyneDataSortedArrayMap = sorted["_map"];
	var dataDene;
	var dataDeneWords, mnemosyconName;
	var deneWord;
	var rowStatus="text-center";
	var freeSpaceBefore, freeSpaceAfter, numberRules, totalTime, pulseTimestampString, pulseTimestampMillis, rulesDetailsLink;
	var pulseLink;


	if ($(window).width() < 480) {
		//
		// the get the name of the mnemosycon just get the codon of 
		// one of the denes 
		for(var property in mnemosyneDataSortedArrayMap) {
			dataDene = mnemosyneDataSortedArrayMap[property];  
			dataDeneWords = dataDene.DeneWords;
			for( l=0;l<dataDeneWords.length;l++){
				deneWord = dataDeneWords[l];
				if(deneWord["Name"]=== CODON){
					mnemosyconName=deneWord["Value"];
					break;
				}
			}
		} 
		var panelHTML = "<h4 class=\"text-center\">"+ mnemosyconName +"</h4><br><table class=\"table\"><tbody>";

		for(var property in mnemosyneDataSortedArrayMap) {
			//
			//after every three panels 
			dataDene = mnemosyneDataSortedArrayMap[property];  
			dataDeneWords = dataDene.DeneWords;
			for( l=0;l<dataDeneWords.length;l++){
				deneWord = dataDeneWords[l];
				if(deneWord["Name"]===DENEWORD_FREE_SPACE_BEFORE_MNEMOSYCON){
					freeSpaceBefore=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_FREE_SPACE_AFTER_MNEMOSYCON){
					freeSpaceAfter=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_MNEMOSYCON_EXECUTION_TIME){
					totalTime=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_MNEMOSYCON_RULES_PROCESSED){
					numberRules=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== PULSE_TIMESTAMP){
					pulseTimestampString=deneWord["Value"];
				}else if(deneWord["Name"]=== PULSE_TIMESTAMP_MILLISECONDS){
					pulseTimestampMillis=deneWord["Value"];
				}
			}
			rulesDetailsLink = '<a href=\"#bannerformmodal\" data-target=\"#bannerformmodal\"  data-toggle=\"modal\" class=\"MnemosyconRulesDetails\" data-time=\"' + pulseTimestampMillis + '\"  data-mnemosyconname=\"'+ mnemosyconName +'\">' + numberRules + '</a>';


			panelHTML += "<tr class=\""+ rowStatus+"\"><td>";
			panelHTML += "<table table-borderless>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Pulse Time</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+pulseTimestampString+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Free Space Before</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+freeSpaceBefore+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Free Space After</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+ freeSpaceAfter +"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Rules Processed</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+rulesDetailsLink+"</td></tr>";
			panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Processing Time (<i> ms</i>)</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + totalTime +"</td></tr>";
			panelHTML += "</table>";
			panelHTML += "</td></tr>";
		}
		panelHTML += "</tbody></table>";
	}else{

		for(var property in mnemosyneDataSortedArrayMap) {
			dataDene = mnemosyneDataSortedArrayMap[property];  
			dataDeneWords = dataDene.DeneWords;
			for( l=0;l<dataDeneWords.length;l++){
				deneWord = dataDeneWords[l];
				if(deneWord["Name"]=== CODON){
					mnemosyconName=deneWord["Value"];
					break;
				}
			}
		} 
		var panelHTML = "<h4 class=\"text-center\">"+ mnemosyconName +"</h4><br><table class=\"table table-responsive\">";
		panelHTML += "<thead><tr><th class=\""+ rowStatus+"\">Pulse Timestamp</th><th class=\""+ rowStatus+"\">Free Space Before</th><th class=\""+ rowStatus+"\">Free Space After</th><th class=\""+ rowStatus+"\">Rules Processed</th><th class=\""+ rowStatus+"\">Processing Time</th></tr></thead><tbody>";
		for(var property in mnemosyneDataSortedArrayMap) {
			//
			//after every three panels 
			dataDene = mnemosyneDataSortedArrayMap[property];
			dataDeneWords = dataDene.DeneWords;
			for( l=0;l<dataDeneWords.length;l++){
				deneWord = dataDeneWords[l];
				if(deneWord["Name"]===DENEWORD_FREE_SPACE_BEFORE_MNEMOSYCON){
					freeSpaceBefore=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_FREE_SPACE_AFTER_MNEMOSYCON){
					freeSpaceAfter=deneWord["Value"] + "&nbsp;" + deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_MNEMOSYCON_EXECUTION_TIME){
					totalTime=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== DENEWORD_MNEMOSYCON_RULES_PROCESSED){
					numberRules=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
				}else if(deneWord["Name"]=== PULSE_TIMESTAMP){
					pulseTimestampString=deneWord["Value"];
				}else if(deneWord["Name"]=== PULSE_TIMESTAMP_MILLISECONDS){
					pulseTimestampMillis=deneWord["Value"];
				}
			}
			pulseLink =        '<a href=\"#bannerformmodal\" data-target=\"#bannerformmodal\"  data-toggle=\"modal\" class=\"PulseTime\" data-time=\"' + pulseTimestampMillis + '\"  data-teleonomeName=\"'+ teleonomeName +'\">' + pulseTimestampString + '</a>';
			rulesDetailsLink = '<a href=\"#bannerformmodal\" data-target=\"#bannerformmodal\"  data-toggle=\"modal\" class=\"MnemosyconRulesDetails\" data-time=\"' + pulseTimestampMillis + '\"  data-mnemosyconname=\"'+ mnemosyconName +'\">' + numberRules + '</a>';
			panelHTML += "<tr class=\""+ rowStatus+"\"><td>"+pulseLink+"</td><td>"+freeSpaceBefore+"</td><td>"+ freeSpaceAfter +"</td><td>"+rulesDetailsLink+"</td><td>" + totalTime +"</td></tr>";
		}
		panelHTML += "</tbody></table>";
	}
	return panelHTML;
}

function renderMnemosyconsRules(mnemosyconName, rulesDetails){
	//
	// rulesDetailsis a json object that contains t
	// two properties, each with a value of jsonarray 
	// these jsonarrays contains the Mnemosycon Rule Processing Denes

	var dataDene;
	var dataDeneWords, mnemosyconName;
	var deneWord;
	var rowStatus="text-center";
	var mnemosyconRuleExecutionMillis, mnemosyconRuleUntilTimeValue, mnemosyconRuleUntilTimeUnit, mnemosyconRuleSource;
	var mnemosyconRuleLocation,deleteOlderThan, rowsDeleted, databaseField=""   ;
	var freeSpaceBeforeRule,freeSpaceAfterRule, deletedFileCounter, oldestFileNameDeleted,newestFileNameDeleted;

	var databaseRules = rulesDetails.DatabaseRules;
	var fileRules = rulesDetails.FileRules


	if ($(window).width() < 480) {

		var panelHTML = "<table class=\"table\"><tbody>";
		//public static final String MNEMOSYCON_RULE_FILE_PREFIX="Mnemosycon Rule File Prefix";
		for( l=0;l<rulesDetails.length;l++){
			//
			//after every three panels 
			dataDene = rulesDetails[l];  
			dataDeneWords = dataDene.DeneWords;

			for( m=0;m<dataDeneWords.length;m++){
				deneWord = dataDeneWords[m];
				if(deneWord["Name"]=== MNEMOSYCON_RULE_SOURCE){
					mnemosyconRuleSource=deneWord["Value"]
				}
			}

			if(mnemosyconRuleSource===MNEMOSYCON_DATA_SOURCE_DATABASE) {

				for( m=0;m<dataDeneWords.length;m++){
					deneWord = dataDeneWords[m];
					databaseField="";
					if(deneWord["Name"]===MNEMOSYCON_RULE_EXECUTION_MILLIS){
						mnemosyconRuleExecutionMillis=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_TIME_UNIT){
						mnemosyconRuleUntilTimeUnit=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_TIME_UNIT_VALUE){
						mnemosyconRuleUntilTimeValue=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_SOURCE){
						mnemosyconRuleSource=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_LOCATION){
						mnemosyconRuleLocation=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_DELETE_OLDER_THAN){
						deleteOlderThan=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_ROWS_DELETED){
						rowsDeleted=deneWord["Value"];
					}else if(deneWord["name"]=== DENEWORD_TYPE_MNEMOSYCON_DATABASE_FIELD){
						databaseField=deneWord["Value"];
					}
				}

				panelHTML += "<tr class=\""+ rowStatus+"\"><td>";
				panelHTML += "<table table-borderless>";
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Source</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+mnemosyconRuleSource+"</td></tr>";
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Location</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+mnemosyconRuleLocation+"</td></tr>";
				if(databaseField!==""){
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Field</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+databaseField+"</td></tr>";	
				}

				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Timeframe</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+ mnemosyconRuleUntilTimeValue +mnemosyconRuleUntilTimeUnit  +"</td></tr>";
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Delete Older Than Processed</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+deleteOlderThan+"</td></tr>";
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Rows Deleted</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" +rowsDeleted +"</td></tr>";
				panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Execution Millis</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + mnemosyconRuleExecutionMillis +"</td></tr>";
				panelHTML += "</table>";
				panelHTML += "</td></tr>";
			}else if(mnemosyconRuleSource=== MNEMOSYCON_DATA_SOURCE_FILE_SYSTEM) {


				for( m=0;m<dataDeneWords.length;m++){
					deneWord = dataDeneWords[m];
					if(deneWord["Name"]===DISK_SPACE_BEFORE_MNEMOSYCON_RULE){
						freeSpaceBeforeRule=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== DISK_SPACE_AFTER_MNEMOSYCON_RULE){
						freeSpaceAfterRule=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_FILES_DELETED){
						deletedFileCounter=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_SOURCE){
						mnemosyconRuleSource=deneWord["Value"] 
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_LOCATION){
						mnemosyconRuleLocation=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_OLDEST_FILE_DELETED){
						oldestFileNameDeleted=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_NEWEST_FILE_DELETED){
						newestFileNameDeleted=deneWord["Value"];
					}

					panelHTML += "<tr class=\""+ rowStatus+"\"><td>";
					panelHTML += "<table table-borderless>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Source</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+mnemosyconRuleSource+"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Location</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+mnemosyconRuleLocation+"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>>Space Before</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+ freeSpaceBeforeRule  +"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Space After</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;"+freeSpaceAfterRule+"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Files Deleted</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" +deletedFileCounter +"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Oldest File Deleted</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + oldestFileNameDeleted +"</td></tr>";
					panelHTML += "<tr class=\""+ rowStatus+"\"><td><b>Newest File Deleted</b></td><td>&nbsp;&nbsp;&nbsp;&nbsp;" + newestFileNameDeleted +"</td></tr>";

					panelHTML += "</table>";
					panelHTML += "</td></tr>";
				}

			}
		}
		panelHTML += "</tbody></table>";
	}else{
		if(databaseRules!=undefined && databaseRules.length>0){
			var panelHTML = "<h5>Database Rules</h5><table class=\"table table-responsive\">";
			panelHTML += "<thead><tr><th class=\""+ rowStatus+"\">Source</th><th class=\""+ rowStatus+"\">Location</th><th class=\""+ rowStatus+"\">Field</th><th class=\""+ rowStatus+"\">Timeframe</th><th class=\""+ rowStatus+"\">Delete Older Than</th><th class=\""+ rowStatus+"\">Rows Deleted</th><th class=\""+ rowStatus+"\">Execution Millis</th></tr></thead><tbody>";
			for( l=0;l<databaseRules.length;l++){ 
				dataDene = databaseRules[l];  
				dataDeneWords = dataDene.DeneWords;

				for(var m=0;m<dataDeneWords.length;m++){
					deneWord = dataDeneWords[m];
					databaseField=="";
					if(deneWord["Name"]===MNEMOSYCON_RULE_EXECUTION_MILLIS){
						mnemosyconRuleExecutionMillis=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_TIME_UNIT){
						mnemosyconRuleUntilTimeUnit=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_TIME_UNIT_VALUE){
						mnemosyconRuleUntilTimeValue=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_SOURCE){
						mnemosyconRuleSource=deneWord["Value"] ;
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_LOCATION){
						mnemosyconRuleLocation=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_DELETE_OLDER_THAN){
						deleteOlderThan=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_ROWS_DELETED){
						rowsDeleted=deneWord["Value"];
					}else if(deneWord["Name"]=== DENEWORD_TYPE_MNEMOSYCON_DATABASE_FIELD ){
						databaseField=deneWord["Value"];
					}
				}
				panelHTML += "<tr class=\""+ rowStatus+"\"><td>"+mnemosyconRuleSource+"</td><td>"+mnemosyconRuleLocation+"</td><td>"+databaseField+"</td><td>"+ mnemosyconRuleUntilTimeValue  + mnemosyconRuleUntilTimeUnit+"</td><td>"+deleteOlderThan+"</td><td>" + rowsDeleted +"</td><td>" + mnemosyconRuleExecutionMillis +"</td></tr>";

			}
			panelHTML += "</tbody></table>";
		}
		if(fileRules!=undefined && fileRules.length>0){
			panelHTML += "<h5>File Based Rules</h5><table class=\"table table-responsive\">";
			panelHTML += "<thead><tr><th class=\""+ rowStatus+"\">Source</th><th class=\""+ rowStatus+"\">Location</th><th class=\""+ rowStatus+"\">Space Before</th><th class=\""+ rowStatus+"\">Space After</th><th class=\""+ rowStatus+"\">Files Deleted</th><th class=\""+ rowStatus+"\">Oldest File</th><th class=\""+ rowStatus+"\">Newest File</th></tr></thead><tbody>";
			for( l=0;l<fileRules.length;l++){ 
				dataDene = fileRules[l];  
				for( m=0;m<dataDeneWords.length;m++){
					deneWord = dataDeneWords[m];
					if(deneWord["Name"]===DISK_SPACE_BEFORE_MNEMOSYCON_RULE){
						freeSpaceBeforeRule=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== DISK_SPACE_AFTER_MNEMOSYCON_RULE){
						freeSpaceAfterRule=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_FILES_DELETED){
						deletedFileCounter=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_SOURCE){
						mnemosyconRuleSource=deneWord["Value"] + "&nbsp;"+ deneWord["Units"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_LOCATION){
						mnemosyconRuleLocation=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_OLDEST_FILE_DELETED){
						oldestFileNameDeleted=deneWord["Value"];
					}else if(deneWord["Name"]=== MNEMOSYCON_RULE_NEWEST_FILE_DELETED){
						newestFileNameDeleted=deneWord["Value"];
					}
				}
				panelHTML += "<tr class=\""+ rowStatus+"\"><td>"+mnemosyconRuleSource+"</td><td>"+mnemosyconRuleLocation+"</td><td>"+ freeSpaceBeforeRule+"</td><td>"+freeSpaceAfterRule+"</td><td>" + deletedFileCounter +"</td><td>" + oldestFileNameDeleted +"</td><td>" + newestFileNameDeleted +"</td></tr>";
			}
			panelHTML += "</tbody></table>";
		}
	}

	return panelHTML;
}

function renderAsyncCommands(includeClient,includeInternal, limit, offset ){
	$.ajax({
		type: "POST",
		url: "/TeleonomeServlet",
		data: {formName:"GetAllCommandRequests", IncludeClient:includeClient, IncludeInternal:includeInternal,limit:limit,offset:offset },
		success: function (data) {
			// console.log("GetAllCommandRequests res," + data);
			var commandsInfo = JSON.parse(data);
			var allCommands = commandsInfo.Values;
			if(allCommands.length>0){
				$('#AynchronousLog').empty();
				var panelHTML = renderCommandRequestTable(commandsInfo);
				$('#AynchronousLog').append(panelHTML);
				$('#AynchronousLog').show();
			}

		},
		error: function(data){
			 console.log("error getting commanda data:" + data.responseText);
			//alert("Error getting commanda data:" +  data.responseText);
			return false;
		}
	});
}

function receivedCommandResponse(cr){
	//
	// text contains the numerical id of the command
	// that was completed,
	// now ask for the server to send you a new version 
	// of the Teleonome.denome that would have been 
	// updated.  Note that this will come from tomcat
	// not the heart
	var commandResponse = JSON.parse(cr);
	$.ajax({
		type: "GET",
		url: "/TeleonomeServlet",
		data: {formName:"GetDenome", },
		success: function (data) {
			//// console.log("data=" + data);
			loadDenomeRefreshInterface(data);
			var result="info";
			var commandResultText="";
			var commandCode="";
			if(commandResponse.Command==COMMAND_REBOOT || 
					commandResponse.Command == COMMAND_REBOOT_TEXT ||
					commandResponse.Command == COMMAND_SHUTDOWN ||
					commandResponse.Command == COMMAND_SHUTDOWN_TEXT ){
				$('#WaitingWheel').hide();
				powerButtonDisabled=false;
				if(commandResponse.Status==COMMAND_REQUEST_EXECUTED){
					if(commandResponse.Command==COMMAND_REBOOT || 
							commandResponse.Command == COMMAND_REBOOT_TEXT){
						alert("Restarting ....");
					}else{
						alert("Shutting down ....");
					}
				}else if(commandResponse.Status==COMMAND_REQUEST_INVALID_CODE){
					if(typeof forgetCommandCode === "function") forgetCommandCode();
					alert("Invalid Code");
					$("#MainPowerButton").attr("disabled", false);
					$("#MainPowerButton").addClass('btn-success').removeClass('btn-warning');
				}


			}else{
				if(commandResponse.Status==COMMAND_REQUEST_EXECUTED){
					result="success";
					commandResultText=commandResponse.Command + " was executed succesfully";
					if(commandResponse.RestartRequired){
						$("#MainPowerButton").addClass('btn-danger').removeClass('btn-success');
					}
				}else if(commandResponse.Status==COMMAND_REQUEST_INVALID_CODE){
					// a remembered code that went stale: ask for a new one next time (index.html askCommandCode)
					if(typeof forgetCommandCode === "function") forgetCommandCode();
					result="danger";
					commandResultText=commandResponse.commandCode + " was not correct";
				}

				$('#CommandRequestStatus').removeClass().addClass('label label-sm label-' + result);
				$('#CommandRequestStatus').html(commandResultText);
				$('#CommandRequestStatus').show();
			}



		},
		error: function(data){
			var errorText = "error receiving updated Denome after command response, error was:" + JSON.stringify(data);
			console.log(errorText);
		//	alert(errorText);
			return false;
		}
	});	
}

function asyncUpdate(text){
	//
	// the format is a json object like
	//  {
//	pointer:value,
//	pointer,value
//	}
	// now loop over every element
	// update it in the denome
	// and call refreshInterface to update
	var myDate = new Date();
//	var theyear = myDate.getFullYear();
//	var themonth = myDate.getMonth() + 1;
//	var thetoday = myDate.getDate();
	var hours = "";
	var h = myDate.getHours();
	if(h<10)hours="0"+h;
	else hours=""+h;
	var min = myDate.getMinutes();
	var minutes="";
	if(min<10)minutes="0"+min;
	else minutes=""+min;
	var sec = myDate.getSeconds();
	var seconds="";
	if(sec<10)seconds="0"+sec;
	else seconds=""+sec;

	var timeString = hours + ":" + minutes + ":" + seconds;

	$('#PulseStatusInfo').text("Updated " + timeString);
	var updateJson = JSON.parse(text);
	var value;
	var identity;

	if(identityFactory!=null && nucleiJSONArray!=null){
		identityFactory = new IdentityFactory();
		for (var pointer in updateJson){
			value = updateJson[pointer];
			setDeneWordValueByIdentityPointer(pointer, value)
		}
		if(refreshActive){
			RefreshInterface();
		}
	}

}

// A "combined chart" button (see mkMultiGraphBtns) fires one Hippocampus_Request per DeneWord
// but they all land back on the browser's single responseChanel one at a time. window.telepathonMultiChartRequest,
// set by the click handler in index.html, is the buffer these get collected into until every
// requested name has arrived, at which point they're drawn together by
// displayHippocampusMultiResponse rather than as individual single-line charts.
function displayHippocampusResponse(payload){

	var response = JSON.parse(payload);
	var data=response.Data;
	var telepathonName = response.telepathonName;
	var deneWordName= response.deneWordName;

	// Charts asked for by deviceviews (the 1h/24h/7d buttons, Chinampa's water level chart) go back to
	// whoever asked (DeviceViewsHost.fetchHistory in DeviceViewsTeleonomeHost.js).
	if (deviceViewsTakeHistoryResponse(telepathonName, deneWordName, data)) return;

	var multiReq = window.telepathonMultiChartRequest;
	if (multiReq && multiReq.mode === 'multiTelepathon' && multiReq.names.indexOf(telepathonName) !== -1) {
		// "Temperature Chart" mode: one series per telepathon (fixed deneword per-device,
		// varies by device type) rather than one telepathon with several denewords.
		multiReq.received[telepathonName] = data;
		var allInT = multiReq.names.every(function(n) { return multiReq.received.hasOwnProperty(n); });
		if (allInT) {
			window.telepathonMultiChartRequest = null;
			displayHippocampusMultiResponse(multiReq);
		}
		return;
	}
	if (multiReq && multiReq.telepathon === telepathonName && multiReq.names.indexOf(deneWordName) !== -1) {
		multiReq.received[deneWordName] = data;
		var allIn = multiReq.names.every(function(n) { return multiReq.received.hasOwnProperty(n); });
		if (allIn) {
			window.telepathonMultiChartRequest = null;
			displayHippocampusMultiResponse(multiReq);
		}
		return;
	}

	deviceViewsShowHistory(telepathonName, deneWordName, data);
}

// (moved to deviceviews, 2026-10-31)

// (moved to deviceviews, 2026-10-31)

function updatePulseStatusInfo(text){
	$('#PulseStatusInfo').text(text);
}
function updatePulseStatusInfoSecundary(text){
	$('#PulseStatusInfoSecundary').text(text);
}

function setAvailableSSIDs(ssids){
	// console.log("Ssids=" + JSON.stringify(ssids));
	availableSSIDSArray=ssids;
}

function updateOrganismIP(text){
	organismIPInfoJsonData = JSON.parse(text);
	refreshOrganismView();
}

function updateOrganismView(text){
	organismInfoJsonData = JSON.parse(text);
	refreshOrganismView();
}

// (moved to deviceviews, 2026-10-31)

function getCerebellumDeneWordValue(telepathonType, deneWordName) {
	var cacheKey = telepathonType + ':' + deneWordName;
	if (nucleiJSONArray) {
		for (var _ni = 0; _ni < nucleiJSONArray.length; _ni++) {
			if (nucleiJSONArray[_ni]["Name"] === "Purpose") {
				var _chains = nucleiJSONArray[_ni]["DeneChains"] || [];
				for (var _ci = 0; _ci < _chains.length; _ci++) {
					if (_chains[_ci]["Name"] === "Cerebellum") {
						var _denes = _chains[_ci]["Denes"] || [];
						for (var _di = 0; _di < _denes.length; _di++) {
							if (_denes[_di]["Name"] === telepathonType) {
								var _dws = _denes[_di]["DeneWords"] || [];
								for (var _wi = 0; _wi < _dws.length; _wi++) {
									if (_dws[_wi]["Name"] === deneWordName) {
										lastKnownCerebellumValues[cacheKey] = _dws[_wi]["Value"];
										return _dws[_wi]["Value"];
									}
								}
							}
						}
					}
				}
			}
		}
	}
	// Cerebellum data can be momentarily absent from a given pulse snapshot
	// (it's a periodic task, not present on every pulse). Fall back to the
	// last known value rather than flashing the UI to blank.
	return cacheKey in lastKnownCerebellumValues ? lastKnownCerebellumValues[cacheKey] : null;
}

// (moved to deviceviews, 2026-10-31)

function buildTelepathonPillsContent(telepathon) {
	var telepathonName = telepathon["Name"];
	var safeId = telepathonName.replace(/[^a-zA-Z0-9]/g, '_');
	var serialnumber = telepathon["Serial Number"] || "";
	var denes = telepathon["Denes"];
	var purposeDene = null, configDene = null;
	for (var dtd = 0; dtd < denes.length; dtd++) {
		if (denes[dtd]["Name"] === "Purpose") purposeDene = denes[dtd];
		if (denes[dtd]["Name"] === "Configuration") configDene = denes[dtd];
	}
	var localDate = purposeDene ? (getDeneWordFromTelepathon(telepathon, 'Purpose', 'Local Time', DENEWORD_VALUE_ATTRIBUTE) || "") : "";

	var html = '<div id="' + telepathonName + '" style="margin:15px;border-radius:5px;background:lightblue" class="col-lg-4 col-md-4 col-sm-5 col-xs-11 text-center top-buffer">';
	html += '<div style="font-size:16px">' + telepathonName + '</div>';
	html += '<div style="font-size:13px">' + localDate + '</div>';
	if (serialnumber) html += '<div style="font-size:13px">' + serialnumber + '</div>';
	html += '<ul class="nav nav-pills nav-justified" style="margin-top:8px;">';
	html += '<li role="presentation" class="active"><a href="#purpose-' + safeId + '" data-toggle="tab">Purpose</a></li>';
	html += '<li role="presentation"><a href="#config-' + safeId + '" data-toggle="tab">Configuration</a></li>';
	html += '</ul>';
	html += '<div class="tab-content" style="text-align:left;margin-top:5px;">';
	html += '<div role="tabpanel" class="tab-pane active" id="purpose-' + safeId + '">';
	html += '<table class="table table-condensed table-striped">';
	if (purposeDene) {
		var pWords = purposeDene["DeneWords"];
		for (var dtpw = 0; dtpw < pWords.length; dtpw++) {
			var dtUnits = pWords[dtpw]["Units"] ? ' ' + pWords[dtpw]["Units"] : "";
			html += '<tr><td>' + pWords[dtpw]["Name"] + '</td><td><strong>' + pWords[dtpw]["Value"] + '</strong>' + dtUnits + '</td></tr>';
		}
	}
	html += '</table></div>';
	html += '<div role="tabpanel" class="tab-pane" id="config-' + safeId + '">';
	html += '<table class="table table-condensed table-striped">';
	if (configDene) {
		var cWords = configDene["DeneWords"];
		for (var dtcw = 0; dtcw < cWords.length; dtcw++) {
			html += '<tr><td>' + cWords[dtcw]["Name"] + '</td><td><strong>' + cWords[dtcw]["Value"] + '</strong></td></tr>';
		}
	}
	html += '</table></div>';
	html += '</div></div>';
	return html;
}

function mergeTelepathonDenes(cached, incoming) {
	// Live per-telepathon MQTT pushes sometimes carry only the Denes that changed
	// (e.g. just "Purpose"), omitting others like "Configuration". Render off a
	// shallow merge so fields like Device Type Id don't transiently disappear.
	if (!cached) return incoming;
	var mergedDenes = (cached["Denes"] || []).slice();
	var incomingDenes = incoming["Denes"] || [];
	for (var i = 0; i < incomingDenes.length; i++) {
		var found = false;
		for (var j = 0; j < mergedDenes.length; j++) {
			if (mergedDenes[j]["Name"] === incomingDenes[i]["Name"]) {
				mergedDenes[j] = incomingDenes[i];
				found = true;
				break;
			}
		}
		if (!found) mergedDenes.push(incomingDenes[i]);
	}
	return { "Name": incoming["Name"] || cached["Name"], "Denes": mergedDenes };
}

function updateTelepathonsView(text){
	var telepathon = JSON.parse(text);
	var telepathonName = telepathon["Name"];
	if (telepathonName === DENECHAIN_ANNABELLE_QUEUE_STATUS) {
		// Not a telepathon device — shown via the "Queue Analysis" popup instead.
		refreshQueueAnalysisModal(telepathon);
		return;
	}
	// TelepathonStatus is the authoritative source for Device Type Id — it comes
	// directly from the LoRa deserializer, while the Status pulse reads the denome
	// file which can hold a stale or garbled value.
	var _tsDenes = telepathon["Denes"] || [];
	for (var _tsi = 0; _tsi < _tsDenes.length; _tsi++) {
		if (_tsDenes[_tsi]["Name"] === "Configuration") {
			var _tsCws = _tsDenes[_tsi]["DeneWords"] || [];
			for (var _tsci = 0; _tsci < _tsCws.length; _tsci++) {
				if (_tsCws[_tsci]["Name"] === "Device Type Id" && _tsCws[_tsci]["Value"]) {
					telepathonDeviceTypeCache[telepathonName] = _tsCws[_tsci]["Value"];
				}
			}
		}
	}
	var safeId = telepathonName.replace(/[^a-zA-Z0-9]/g, '_');
	telepathon = mergeTelepathonDenes(telepathonCardDataCache[telepathonName], telepathon);
	telepathonCardDataCache[telepathonName] = telepathon;
	var fullHtml = buildTelepathonCardView(telepathon); // updates modal as a side effect
	var $textPanel = $('#tpText_' + safeId);
	if ($textPanel.length) {
		// Update only the text panel — leave the image element untouched so the
		// browser never has to reload it, eliminating the "no image" flash.
		var $newCard = $(fullHtml);
		$textPanel.html($newCard.find('#tpText_' + safeId).html());
	} else if (!$('#tpCardCol_' + safeId).length) {
		$('#TelepathonsView').append(fullHtml);
	}
}

function tickTelepathonCards(){
	// Only refresh the "Xs ago" age label/color in place — rebuilding the whole
	// card (image + SOC etc.) on this timer was causing periodic flicker since
	// the underlying telepathon data hasn't actually changed.
	for (var tName in telepathonCardDataCache) {
		var safeId = tName.replace(/[^a-zA-Z0-9]/g, '_');
		var $age = $('#tpAge_' + safeId);
		if (!$age.length) continue;
		var ageInfo = computeTelepathonAgeStatus(telepathonCardDataCache[tName]);
		$age.text('(' + Math.floor(ageInfo.ageSeconds) + 's ago)').css('color', ageInfo.statusColor);
	}
}
setInterval(tickTelepathonCards, 10 * 1000);

var mnemoPeriodsData = [];
var mnemoNavIdx = {};

function mnemoSortDenes(denes) {
	return denes.slice().sort(function(a, b) {
		var hasPA = (a["Position"] !== undefined && a["Position"] !== null && a["Position"] !== '');
		var hasPB = (b["Position"] !== undefined && b["Position"] !== null && b["Position"] !== '');
		var posA = hasPA ? parseInt(a["Position"]) : (a._arrayIdx !== undefined ? a._arrayIdx : 0);
		var posB = hasPB ? parseInt(b["Position"]) : (b._arrayIdx !== undefined ? b._arrayIdx : 0);
		return posB - posA;
	});
}

function mnemoNav(pi, delta) {
	var denes = mnemoPeriodsData[pi] || [];
	var sorted = mnemoSortDenes(denes);
	var total = sorted.length;
	if (total === 0) return;
	if (mnemoNavIdx[pi] === undefined) mnemoNavIdx[pi] = 0;
	mnemoNavIdx[pi] = Math.max(0, Math.min(total - 1, mnemoNavIdx[pi] + delta));
	var cur = mnemoNavIdx[pi];
	var dene = sorted[cur];
	var hasPos = (dene["Position"] !== undefined && dene["Position"] !== null && dene["Position"] !== '');
	var pos = hasPos ? parseInt(dene["Position"]) : (total - cur);
	var dws = dene["DeneWords"] || [];
	var label = dene["Name"] ? '<strong>' + dene["Name"] + '</strong> &mdash; ' : '';
	var contentHtml = '<div style="margin-bottom:6px;font-size:13px;color:#555;">' + label + 'Entry ' + pos + ' of ' + total + '</div>';
	contentHtml += '<table class="table table-condensed table-striped" style="font-size:13px;">';
	for (var i = 0; i < dws.length; i++) {
		contentHtml += '<tr><td style="width:50%;">' + dws[i]["Name"] + '</td><td><strong>' + dws[i]["Value"] + '</strong></td></tr>';
	}
	contentHtml += '</table>';
	$('#mnemo-content-' + pi).html(contentHtml);
	$('#mnemo-prev-' + pi).prop('disabled', cur >= total - 1);
	$('#mnemo-next-' + pi).prop('disabled', cur <= 0);
}

// "Mnemosyne Pulse Count" Denes store DeneWords of Value Type "Time Series" -- an array of
// {Value, "Pulse Timestamp in Milliseconds"} entries (see UpdateTimeSeriesCounterOperation.java)
// rather than a plain scalar, which the generic table rendering below would otherwise just
// print as "[object Object]". Show entry count plus the few most recent samples instead.
function formatMnemosyneDeneWordValue(value) {
	if (Array.isArray(value)) {
		if (value.length === 0) return '<em>0 entries</em>';
		var preview = value.slice(-3).reverse().map(function(e) {
			var ts = e["Pulse Timestamp in Milliseconds"];
			var when = ts ? new Date(ts).toLocaleString() : '?';
			var v = e["Value"];
			return when + ': ' + (v === undefined || v === null ? '<em>no value</em>' : v);
		}).join('<br>');
		return value.length + ' entries, most recent:<br>' + preview;
	}
	if (value !== null && typeof value === 'object') {
		return '<pre style="white-space:pre-wrap;margin:0;">' + JSON.stringify(value, null, 2) + '</pre>';
	}
	return value;
}

function renderMnemosyneViewPanel() {
	mnemoPeriodsData = [];
	mnemoNavIdx = {};

	// Get Mnemosyne nucleus denechains
	var mnemoDCs = [];
	for (var ni = 0; ni < nucleiJSONArray.length; ni++) {
		if (nucleiJSONArray[ni]["Name"] === NUCLEI_MNEMOSYNE) {
			mnemoDCs = nucleiJSONArray[ni]["DeneChains"];
			break;
		}
	}

	// Include all time-period denechains (show empty ones too)
	var periodPrefixes = ["Mnemosyne Current Hour", "Mnemosyne Today", "Mnemosyne Yesterday",
		"Mnemosyne Current Week", "Mnemosyne Current Month", "Mnemosyne Current Quarter",
		"Mnemosyne Current Semester", "Mnemosyne Current Year", "Mnemosyne Pulse Count", "Mnemosyne Pulse"];
	var periods = [];
	for (var di = 0; di < mnemoDCs.length; di++) {
		var dc = mnemoDCs[di];
		for (var pi2 = 0; pi2 < periodPrefixes.length; pi2++) {
			if (dc["Name"] === periodPrefixes[pi2]) {
				periods.push(dc);
				break;
			}
		}
	}

	var html = '<div class="col-lg-12">';
	html += '<div class="bs-component">';
	html += '<div class="panel panel-default">';
	html += '<div class="panel-heading"><h4>Mnemosyne</h4></div>';
	html += '<div class="panel-body">';
	html += '<div>';

	if (periods.length === 0) {
		html += '<p class="text-muted text-center" style="padding:20px;">No Mnemosyne data available yet.</p>';
		return html;
	}

	// Pill nav
	html += '<ul class="nav nav-pills" style="margin-bottom:12px;flex-wrap:wrap;">';
	for (var pi = 0; pi < periods.length; pi++) {
		var label = periods[pi]["Name"].replace("Mnemosyne ", "");
		var pid = "mnemo-tab-" + pi;
		var activeClass = pi === 0 ? ' class="active"' : '';
		html += '<li' + activeClass + ' onclick="return teleonomeShowTab(\'' + pid + '\', this)" style="margin-bottom:4px;"><a href="#">' + label + '</a></li>';
	}
	html += '</ul>';

	// Tab content
	html += '<div class="tab-content">';
	for (var ti = 0; ti < periods.length; ti++) {
		var pid2 = "mnemo-tab-" + ti;
		var activeClass2 = ti === 0 ? ' active' : '';
		html += '<div class="tab-pane' + activeClass2 + '" id="' + pid2 + '">';
		var denes2 = periods[ti]["Denes"] || [];
		// Tag each dene with its original array index so mnemoNav can sort without Position
		var taggedDenes = denes2.map(function(d, i) { return Object.assign({}, d, { _arrayIdx: i }); });
		mnemoPeriodsData[ti] = taggedDenes;

		if (taggedDenes.length > 1) {
			// HyperCard navigation — newest first (by Position if present, else by array order)
			var sortedDenes = mnemoSortDenes(taggedDenes);
			mnemoNavIdx[ti] = 0;
			var total = sortedDenes.length;
			var newest = sortedDenes[0];
			var hasPos = (newest["Position"] !== undefined && newest["Position"] !== null && newest["Position"] !== '');
			var newestPos = hasPos ? parseInt(newest["Position"]) : total;
			// Navigation bar
			html += '<div style="display:flex;align-items:center;margin-bottom:10px;">';
			html += '<button id="mnemo-prev-' + ti + '" class="btn btn-sm btn-default" onclick="mnemoNav(' + ti + ',1)">&#8592; Older</button>';
			html += '<button id="mnemo-next-' + ti + '" class="btn btn-sm btn-default" disabled onclick="mnemoNav(' + ti + ',-1)" style="margin-left:8px;">Newer &#8594;</button>';
			html += '</div>';
			// Content area — starts showing newest entry
			html += '<div id="mnemo-content-' + ti + '">';
			var newestLabel = newest["Name"] ? '<strong>' + newest["Name"] + '</strong> &mdash; ' : '';
			html += '<div style="margin-bottom:6px;font-size:13px;color:#555;">' + newestLabel + 'Entry ' + newestPos + ' of ' + total + '</div>';
			var initDws = newest["DeneWords"] || [];
			if (initDws.length > 0) {
				html += '<table class="table table-condensed table-striped" style="font-size:13px;">';
				for (var idwi = 0; idwi < initDws.length; idwi++) {
					html += '<tr><td style="width:50%;">' + initDws[idwi]["Name"] + '</td>';
					html += '<td><strong>' + formatMnemosyneDeneWordValue(initDws[idwi]["Value"]) + '</strong></td></tr>';
				}
				html += '</table>';
			} else {
				html += '<p class="text-muted text-center" style="padding:16px;">No data for this entry.</p>';
			}
			html += '</div>';
		} else {
			// Single dene — show directly
			var singleDene = taggedDenes.length > 0 ? taggedDenes[0] : null;
			var dws = singleDene ? (singleDene["DeneWords"] || []) : [];
			if (dws.length > 0) {
				html += '<table class="table table-condensed table-striped" style="font-size:13px;">';
				for (var dwi = 0; dwi < dws.length; dwi++) {
					html += '<tr><td style="width:50%;">' + dws[dwi]["Name"] + '</td>';
					html += '<td><strong>' + formatMnemosyneDeneWordValue(dws[dwi]["Value"]) + '</strong></td></tr>';
				}
				html += '</table>';
			} else {
				html += '<p class="text-muted text-center" style="padding:16px;">No data available for this period.</p>';
			}
		}
		html += '</div>';
	}
	html += '</div>';

	return html;
}

// ── Emergency Channel ──────────────────────────────────────────────────────
// A banner shown above the Organs panel whenever something publishes to
// HEART_TOPIC_EMERGENCY_CHANNEL ("Emergency Channel") -- e.g. the Cerebellum discovering a
// telepathon has gone missing. Nothing publishes to this topic yet; this is the receiving half
// of the contract (see the constant's comment in TeleonomeConstants.js for the expected payload).
// Messages persist (across pulse-driven re-renders of renderOrgansPanel, since this array lives
// outside of it) until the operator dismisses them individually.
var emergencyChannelMessages = [];
var emergencyChannelMessageCounter = 0;

function handleEmergencyChannelMessage(payload) {
	var sender = 'Unknown', msgText = payload, timeStr;
	try {
		var parsed = JSON.parse(payload);
		sender = parsed.Sender || parsed.sender || 'Unknown';
		msgText = parsed.Message || parsed.message || payload;
		if (parsed.TimestampMillis || parsed.timestampMillis) {
			timeStr = new Date(parseInt(parsed.TimestampMillis || parsed.timestampMillis)).toLocaleString();
		} else if (parsed.Timestamp || parsed.timestamp) {
			timeStr = parsed.Timestamp || parsed.timestamp;
		}
	} catch (e) {
		// Not JSON -- treat the raw payload as the message text.
	}
	if (!timeStr) timeStr = new Date().toLocaleString();

	emergencyChannelMessageCounter++;
	emergencyChannelMessages.unshift({ id: emergencyChannelMessageCounter, sender: sender, message: msgText, timeStr: timeStr });

	$('#emergency-channel-banner').html(buildEmergencyBannerHtml());
}

function dismissEmergencyMessage(id) {
	emergencyChannelMessages = emergencyChannelMessages.filter(function(m) { return m.id !== id; });
	$('#emergency-channel-banner').html(buildEmergencyBannerHtml());
}

function buildEmergencyBannerHtml() {
	if (emergencyChannelMessages.length === 0) return '';
	var html = '';
	emergencyChannelMessages.forEach(function(m) {
		html += '<div class="alert alert-danger" style="margin:8px 0;padding:10px 34px 10px 14px;position:relative;" role="alert">' +
			'<button type="button" class="close" onclick="dismissEmergencyMessage(' + m.id + ')" style="position:absolute;top:8px;right:12px;">&times;</button>' +
			'<strong>&#9888; Emergency:</strong> ' + m.message +
			'<div style="font-size:12px;margin-top:4px;opacity:0.8;">From <strong>' + m.sender + '</strong> at ' + m.timeStr + '</div>' +
			'</div>';
	});
	return html;
}

function renderOrgansPanel() {
	if (organsRenderedThisCycle) {
		return '<div style="display:none;"><div><div><div><div>';
	}
	organsRenderedThisCycle = true;

	var ageSeconds = (Date.now() - pulseTimestampMilliseconds) / 1000;
	var statusClass = ageSeconds < 60 ? 'btn-success' : (ageSeconds < 120 ? 'btn-warning' : 'btn-danger');
	var mkClose = function(id) { return '<button type="button" class="close" onclick="closeModal(\'' + id + '\')">&times;</button>'; };
	var mkFooter = function(id) { return '<button type="button" class="btn btn-default" onclick="closeModal(\'' + id + '\')">Close</button>'; };

	// Hippocampus modal
	if (!$('#hippocampusModal').length) {
		$('body').append(
			'<div class="modal fade" id="hippocampusModal" tabindex="-1" role="dialog">' +
			'<div class="modal-dialog modal-lg"><div class="modal-content">' +
			'<div class="modal-header">' + mkClose('hippocampusModal') + '<h4 class="modal-title">Hippocampus</h4></div>' +
			'<div class="modal-body" id="hippocampusModalBody"></div>' +
			'<div class="modal-footer">' + mkFooter('hippocampusModal') + '</div>' +
			'</div></div></div>'
		);
	}
	var hippoContent = '';
	var hippoSpaceSlices = null;
	var hippoBreakdownSlices = null;
	var hippoDeviceRanges = {};
	var hippoPointer = "@" + teleonomeName + ":" + NUCLEI_PURPOSE + ":" + DENECHAIN_PURPOSE_HIPPOCAMPUS;
	var hippoDeneChain = getDeneChainByIdentityPointer(hippoPointer);
	if (hippoDeneChain) {
		var hippoDenes = hippoDeneChain["Denes"];
		for (var ih = 0; ih < hippoDenes.length; ih++) {
			if (hippoDenes[ih]["Name"] === DENE_HIPPOCAMPUS_MEMORY_STATUS_DENE) {
				var hippoDene = hippoDenes[ih];
				var hippoTs = hippoDene["Timestamp"] || "";
				var hippoDws = hippoDene["DeneWords"];
				var hippoUsed = 0, hippoAvail = 0;
				var hippoRows = [];
				for (var jh = 0; jh < hippoDws.length; jh++) {
					var dwName = hippoDws[jh]["Name"];
					var dwVal  = hippoDws[jh]["Value"];
					if (dwName === "PointsUsed")    hippoUsed  = Number(dwVal);
					if (dwName === "PointsAvailable") hippoAvail = Number(dwVal);
					if (dwName === "MemoryBreakdown") {
						try { hippoBreakdownSlices = JSON.parse(dwVal).map(function(b) { return { name: b.name, value: b.points }; }); } catch(e) {}
					} else if (dwName === "DeviceDateRanges") {
						try {
							JSON.parse(dwVal).forEach(function(r) { hippoDeviceRanges[r.name] = { start: r.start, end: r.end }; });
						} catch(e) {}
					} else {
						hippoRows.push({ name: dwName, value: dwVal });
					}
				}
				if (hippoUsed > 0 || hippoAvail > 0) {
					hippoSpaceSlices = [{ name: "Used", value: hippoUsed }, { name: "Available", value: hippoAvail }];
				}

				// Hippocampus has no notion of "valid" vs "temporary" itself - it just tracks
				// memory by whatever telepathon name shows up in the live pulse's Telepathons
				// nucleus (see Hippocampus.absorbPulse()), duplicates/corrupted names included.
				// The valid/temporary distinction lives in Cerebellum's TelepathonRegistryTask
				// (Purpose:Cerebellum:Telepathon Registry), already read elsewhere via
				// getTelepathonRegistryDeviceList()/getTelepathonRegistryPendingList() for the
				// Cerebellum modal - reused here to cross-reference by name for the pie chart
				// filter (see filterHippoBreakdownChart()).
				hippoBreakdownAllSlices = hippoBreakdownSlices;
				hippoBreakdownValidNames = {};
				(getTelepathonRegistryDeviceList() || []).forEach(function(d) { hippoBreakdownValidNames[d["Name"]] = true; });
				hippoBreakdownPendingNames = {};
				(getTelepathonRegistryPendingList() || []).forEach(function(p) { hippoBreakdownPendingNames[p["Name"]] = true; });

				// Charts
				hippoContent += '<div class="row" style="margin-bottom:16px;margin-top:4px;">';
				hippoContent += '<div class="col-xs-12 col-sm-6" style="padding-left:20px;padding-right:20px;">';
				hippoContent += '<h5 class="text-center" style="font-size:13px;color:#555;margin-bottom:4px;">Memory Space</h5>';
				hippoContent += '<div id="hippo-space-chart"></div></div>';
				hippoContent += '<div class="col-xs-12 col-sm-6" style="padding-left:20px;padding-right:20px;">';
				hippoContent += '<h5 class="text-center" style="font-size:13px;color:#555;margin-bottom:4px;">Memory by Sensor</h5>';
				hippoContent += '<div id="hippo-breakdown-chart"></div>';
				hippoContent += '<div class="text-center" style="margin-top:6px;">' +
					'<label style="margin-right:12px;font-weight:normal;font-size:12px;"><input type="radio" name="hippoBreakdownFilter" value="all" checked onchange="filterHippoBreakdownChart(\'all\')"> Show All</label>' +
					'<label style="margin-right:12px;font-weight:normal;font-size:12px;"><input type="radio" name="hippoBreakdownFilter" value="valid" onchange="filterHippoBreakdownChart(\'valid\')"> Show Valid</label>' +
					'<label style="font-weight:normal;font-size:12px;"><input type="radio" name="hippoBreakdownFilter" value="temporary" onchange="filterHippoBreakdownChart(\'temporary\')"> Show Temporary</label>' +
					'</div>';
				hippoContent += '</div>';
				hippoContent += '</div>';
				if (hippoTs) hippoContent += '<p class="text-muted small" style="margin-bottom:4px;">Last update: ' + hippoTs + '</p>';

				// Build 2-per-row stats table
				var statsTableHtml = '<table class="table table-condensed table-striped" style="font-size:12px;">';
				for (var ri = 0; ri < hippoRows.length; ri += 2) {
					var lr = hippoRows[ri], rr = hippoRows[ri + 1];
					statsTableHtml += '<tr><td style="width:25%;">' + lr.name + '</td><td style="width:25%;"><strong>' + lr.value + '</strong></td>';
					if (rr) {
						statsTableHtml += '<td style="width:25%;">' + rr.name + '</td><td style="width:25%;"><strong>' + rr.value + '</strong></td>';
					} else {
						statsTableHtml += '<td></td><td></td>';
					}
					statsTableHtml += '</tr>';
				}
				statsTableHtml += '</table>';

				// Build Contents from Internal:Hippocampus:Data
				var hippoContentsHtml = '';
				(function() {
					var hippoDataDene = null;
					for (var _ni = 0; _ni < nucleiJSONArray.length; _ni++) {
						if (nucleiJSONArray[_ni]["Name"] !== "Internal") continue;
						var _chains = nucleiJSONArray[_ni]["DeneChains"] || [];
						for (var _ci = 0; _ci < _chains.length; _ci++) {
							if (_chains[_ci]["Name"] !== "Hippocampus") continue;
							var _denes = _chains[_ci]["Denes"] || [];
							for (var _di = 0; _di < _denes.length; _di++) {
								if (_denes[_di]["Name"] === "Data") { hippoDataDene = _denes[_di]; break; }
							}
							break;
						}
						break;
					}
					if (!hippoDataDene) { hippoContentsHtml = '<p class="text-muted">No hippocampus data configuration found.</p>'; return; }
					// "Data" DeneWords list device TYPES (e.g. "Chinampa", "Daffodil", "Langley"), not
					// specific instances -- so which telepathons show up here is discovered dynamically
					// from whatever is actually present in the live denome right now, same as
					// Hippocampus.absorbPulse(). This means a new instance of an already-listed type
					// (e.g. LangleyWest, later Langley_North/Langley_East) appears here automatically.
					var allowedDeviceTypes = (hippoDataDene["DeneWords"] || []).map(function(dw) { return dw["Value"]; }).filter(Boolean);
					var devices = [], deviceVars = {};
					var telepathonsNucleus = getTelepathonsDeneChains();
					var telepathonChains = (telepathonsNucleus && telepathonsNucleus["DeneChains"]) || [];
					for (var _ti = 0; _ti < telepathonChains.length; _ti++) {
						var tChain = telepathonChains[_ti];
						var tDenes = tChain["Denes"] || [];
						var deviceType = null, purposeDeneWords = [];
						for (var _tdi = 0; _tdi < tDenes.length; _tdi++) {
							if (tDenes[_tdi]["Name"] === "Configuration") {
								var _cws = tDenes[_tdi]["DeneWords"] || [];
								for (var _cwi = 0; _cwi < _cws.length; _cwi++) {
									if (_cws[_cwi]["Name"] === "Device Type Id") deviceType = _cws[_cwi]["Value"];
								}
							} else if (tDenes[_tdi]["Name"] === "Purpose") {
								purposeDeneWords = tDenes[_tdi]["DeneWords"] || [];
							}
						}
						if (!deviceType || allowedDeviceTypes.indexOf(deviceType) === -1) continue;
						var devName = tChain["Name"];
						if (!deviceVars[devName]) { devices.push(devName); deviceVars[devName] = []; }
						for (var _pdwi = 0; _pdwi < purposeDeneWords.length; _pdwi++) {
							deviceVars[devName].push({ name: purposeDeneWords[_pdwi]["Name"], value: purposeDeneWords[_pdwi]["Value"] });
						}
					}
					if (devices.length === 0) {
						hippoContentsHtml = '<p class="text-muted">No variables found.</p>';
					} else {
						// Device link bar
						hippoContentsHtml += '<div style="margin-bottom:10px;font-size:13px;">';
						for (var _devi = 0; _devi < devices.length; _devi++) {
							if (_devi > 0) hippoContentsHtml += ' &nbsp;|&nbsp; ';
							hippoContentsHtml += '<a href="#" onclick="$(\'.hippo-dev-table\').hide();$(\'#hippo-dev-' + _devi + '\').show();return false;">' + devices[_devi] + '</a>';
						}
						hippoContentsHtml += '</div>';
						// One table per device, only first visible
						for (var _devi = 0; _devi < devices.length; _devi++) {
							var dev = devices[_devi];
							var vars = deviceVars[dev];
							hippoContentsHtml += '<div id="hippo-dev-' + _devi + '" class="hippo-dev-table"' + (_devi > 0 ? ' style="display:none;"' : '') + '>';
							var devRange = hippoDeviceRanges[dev];
							hippoContentsHtml += '<table class="table table-condensed table-striped" style="font-size:12px;margin-bottom:0;">';
							if (devRange) {
								hippoContentsHtml += '<tr><td colspan="4">Data available: ' + devRange.start + ' &nbsp;to&nbsp; ' + devRange.end + '</td></tr>';
							}
							for (var _vi = 0; _vi < vars.length; _vi += 2) {
								var lv = vars[_vi], rv = vars[_vi + 1];
								hippoContentsHtml += '<tr><td style="width:25%;">' + lv.name + '</td><td style="width:25%;"><strong>' + lv.value + '</strong></td>';
								if (rv) {
									hippoContentsHtml += '<td style="width:25%;">' + rv.name + '</td><td style="width:25%;"><strong>' + rv.value + '</strong></td>';
								} else {
									hippoContentsHtml += '<td></td><td></td>';
								}
								hippoContentsHtml += '</tr>';
							}
							hippoContentsHtml += '</table></div>';
						}
					}
				})();

				// Pills + content divs
				hippoContent += '<ul class="nav nav-pills" style="margin-bottom:10px;">';
				hippoContent += '<li class="active" onclick="$(\'#hippo-modal-stats\').show();$(\'#hippo-modal-contents\').hide();$(this).addClass(\'active\').siblings().removeClass(\'active\');return false;"><a href="#">Stats</a></li>';
				hippoContent += '<li onclick="$(\'#hippo-modal-contents\').show();$(\'#hippo-modal-stats\').hide();$(this).addClass(\'active\').siblings().removeClass(\'active\');return false;"><a href="#">Contents</a></li>';
				hippoContent += '</ul>';
				hippoContent += '<div id="hippo-modal-stats">' + statsTableHtml + '</div>';
				hippoContent += '<div id="hippo-modal-contents" style="display:none;">' + hippoContentsHtml + '</div>';
				break;
			}
		}
	}
	$('#hippocampusModalBody').html(hippoContent);
	if (hippoSpaceSlices) {
		drawHippocampusPieChart('hippo-space-chart', hippoSpaceSlices, ['#4e79a7', '#d9d9d9']);
	}
	if (hippoBreakdownSlices && hippoBreakdownSlices.length > 0) {
		filterHippoBreakdownChart('all');
	}

	// Cerebellum modal
	if (!$('#cerebellumModal').length) {
		$('body').append(
			'<div class="modal fade" id="cerebellumModal" tabindex="-1" role="dialog">' +
			'<div class="modal-dialog"><div class="modal-content">' +
			'<div class="modal-header">' + mkClose('cerebellumModal') + '<h4 class="modal-title">Cerebellum</h4></div>' +
			'<div class="modal-body" id="cerebellumModalBody"></div>' +
			'<div class="modal-footer">' + mkFooter('cerebellumModal') + '</div>' +
			'</div></div></div>'
		);
	}
	var cerebModalContent = '';
	var cerebInternalPointer = "@" + teleonomeName + ":" + NUCLEI_INTERNAL + ":" + DENECHAIN_INTERNAL_CEREBELLUM;
	var cerebPurposePointer  = "@" + teleonomeName + ":" + NUCLEI_PURPOSE  + ":" + DENECHAIN_PURPOSE_CEREBELLUM;
	var cerebInternalDC = getDeneChainByIdentityPointer(cerebInternalPointer);
	var cerebPurposeDC  = getDeneChainByIdentityPointer(cerebPurposePointer);
	var cerebSkipFields = ["Annabelle Action Pointer", "Annabelle Command", "Task True Expression",
		"Telepathon Type", "Mnemosyne Today", "Mnemosyne Current Week", "UsingSolarPower",
		"Evaluation Position", "SolarAnalysis Execution Time", "SolarAnalysis Duration"];
	var cerebAllDenes = cerebInternalDC ? (cerebInternalDC["Denes"] || []) : [];
	var cerebTasks = cerebAllDenes.filter(function(d) {
		return d["DeneType"] === DENE_TYPE_CEREBELLUM_TASK;
	});
	if (cerebTasks.length > 0) {
		cerebModalContent += '<ul class="nav nav-pills" style="margin-bottom:14px;flex-wrap:wrap;">';
		for (var cpi = 0; cpi < cerebTasks.length; cpi++) {
			var cTaskRawName = cerebTasks[cpi]["Name"];
			var cTaskDwsLabel = cerebTasks[cpi]["DeneWords"] || [];
			var cTeleopathonType = "";
			for (var tl = 0; tl < cTaskDwsLabel.length; tl++) {
				if (cTaskDwsLabel[tl]["Name"] === DENEWORD_CEREBELLUM_TELEPATHON_TYPE) { cTeleopathonType = cTaskDwsLabel[tl]["Value"]; break; }
			}
			var cTaskLabel = cTaskRawName;
			if (cTeleopathonType && cTaskLabel.indexOf(cTeleopathonType + " ") === 0) {
				cTaskLabel = cTaskLabel.substring(cTeleopathonType.length + 1);
			}
			cTaskLabel = cTaskLabel.replace(/([a-z])([A-Z])/g, '$1 $2');
			var cpid = "cereb-task-" + cpi;
			cerebModalContent += '<li' + (cpi === 0 ? ' class="active"' : '') +
				' onclick="return teleonomeShowTab(\'' + cpid + '\', this)" style="margin-bottom:4px;">' +
				'<a href="#">' + cTaskLabel + '</a></li>';
		}
		cerebModalContent += '</ul><div class="tab-content">';
		var cerebPurposeDenes = cerebPurposeDC ? (cerebPurposeDC["Denes"] || []) : [];
		for (var cti = 0; cti < cerebTasks.length; cti++) {
			var cTask = cerebTasks[cti];
			var cTaskName = cTask["Name"];
			var cpid2 = "cereb-task-" + cti;
			var cTaskNameLc = cTaskName.toLowerCase();
			var isGraveyardShift = cTaskNameLc.indexOf("graveyardshift") !== -1 || cTaskNameLc.indexOf("graveyard") !== -1;
			var isScheduleTask = isGraveyardShift || cTaskNameLc.indexOf("pulsetask") !== -1;
			cerebModalContent += '<div class="tab-pane' + (cti === 0 ? ' active' : '') + '" id="' + cpid2 + '">';
			// Find matching dene in Purpose:Cerebellum by Telepathon Type (Purpose denes are named after the telepathon)
			var cPurposeDene = null;
			var cTaskDwsMatch = cTask["DeneWords"] || [];
			var cTelepathonTypeMatch = "";
			for (var tdw = 0; tdw < cTaskDwsMatch.length; tdw++) {
				if (cTaskDwsMatch[tdw]["Name"] === DENEWORD_CEREBELLUM_TELEPATHON_TYPE) { cTelepathonTypeMatch = cTaskDwsMatch[tdw]["Value"]; break; }
			}
			for (var cpd = 0; cpd < cerebPurposeDenes.length; cpd++) {
				if (cTelepathonTypeMatch && cerebPurposeDenes[cpd]["Name"] === cTelepathonTypeMatch) { cPurposeDene = cerebPurposeDenes[cpd]; break; }
			}
			if (!cPurposeDene) {
				for (var cpd = 0; cpd < cerebPurposeDenes.length; cpd++) {
					if (cerebPurposeDenes[cpd]["Name"] === cTaskName) { cPurposeDene = cerebPurposeDenes[cpd]; break; }
				}
			}
			// For schedule/utility tasks: show their own config fields, not the shared Purpose:Cerebellum output
			if (isScheduleTask) {
				cerebModalContent += '<h5 style="margin-top:0;margin-bottom:6px;color:#337ab7;border-bottom:1px solid #ddd;padding-bottom:4px;">Schedule</h5>';
				cerebModalContent += '<table class="table table-condensed table-striped" style="margin-bottom:14px;">';
				var schedFields = ["Active", "Expression", "Execution Time", "Execution Frequency"];
				var schedDws = cTask["DeneWords"] || [];
				for (var sf = 0; sf < schedFields.length; sf++) {
					for (var sdw = 0; sdw < schedDws.length; sdw++) {
						if (schedDws[sdw]["Name"] === schedFields[sf] && schedDws[sdw]["Value"]) {
							cerebModalContent += '<tr><td style="width:50%;">' + schedDws[sdw]["Name"] + '</td>' +
								'<td><strong>' + schedDws[sdw]["Value"] + '</strong></td></tr>';
							break;
						}
					}
				}
				cerebModalContent += '</table>';
			}
			// Show Purpose:Cerebellum data for all tasks except GraveyardShift (which has no computed output)
			if (!isGraveyardShift) {
				if (cPurposeDene) {
					var cPurposeDws = cPurposeDene["DeneWords"] || [];

					// Cerebellum merges every task that shares this Telepathon Type into
					// one flat Purpose dene (so e.g. a live per-pulse task's words don't
					// erase an hourly task's words). Each task's own words are delimited
					// at the end by the "<TaskShortName> Execution Time" / "<TaskShortName>
					// Duration" markers Cerebellum.java appends after task.process()
					// returns. Use those to show only this tab's own task, not everyone's.
					var cClassName = "";
					for (var cdw = 0; cdw < cTaskDwsMatch.length; cdw++) {
						if (cTaskDwsMatch[cdw]["Name"] === "Task True Expression") { cClassName = cTaskDwsMatch[cdw]["Value"]; break; }
					}
					var cShortName = cClassName.substring(cClassName.lastIndexOf(".") + 1);

					var cMyWords = null;
					var segStart = 0;
					for (var pdw = 0; pdw < cPurposeDws.length; pdw++) {
						var pdwName = cPurposeDws[pdw]["Name"];
						var durSuffix = " Duration";
						if (typeof pdwName === "string" && pdwName.indexOf(durSuffix) === pdwName.length - durSuffix.length) {
							var ownerName = pdwName.substring(0, pdwName.length - durSuffix.length);
							if (pdw > 0 && cPurposeDws[pdw - 1]["Name"] === ownerName + " Execution Time") {
								if (ownerName === cShortName) { cMyWords = cPurposeDws.slice(segStart, pdw + 1); break; }
								segStart = pdw + 1;
							}
						}
					}
					// No markers for this task yet (e.g. an hourly task that hasn't fired
					// its first run) — show nothing rather than falling back to everyone
					// else's words.
					if (!cMyWords) cMyWords = [];

					if (cMyWords.length > 0) {
						cerebModalContent += '<table class="table table-condensed table-striped">';
						for (var cpdw = 0; cpdw < cMyWords.length; cpdw++) {
							var cpdwName = cMyWords[cpdw]["Name"];
							if (cerebSkipFields.indexOf(cpdwName) !== -1) continue;
							if (cpdwName === cShortName + " Execution Time" || cpdwName === cShortName + " Duration") continue;
							cerebModalContent += '<tr><td style="width:55%;">' + cpdwName + '</td>' +
								'<td><strong>' + cMyWords[cpdw]["Value"] + '</strong></td></tr>';
						}
						cerebModalContent += '</table>';
					} else {
						cerebModalContent += '<p class="text-muted text-center" style="padding:16px;">No data available.</p>';
					}
				} else {
					cerebModalContent += '<p class="text-muted text-center" style="padding:16px;">No data available.</p>';
				}
			}
			cerebModalContent += '</div>';
		}
		cerebModalContent += '</div>';
	} else {
		cerebModalContent = '<p class="text-muted text-center" style="padding:20px;">No tasks available.</p>';
	}
	$('#cerebellumModalBody').html(cerebModalContent);

	// Heart modal
	if (!$('#heartModal').length) {
		$('body').append(
			'<div class="modal fade" id="heartModal" tabindex="-1" role="dialog">' +
			'<div class="modal-dialog" style="max-width:calc(100vw - 20px);width:500px;margin:10px auto;"><div class="modal-content">' +
			'<div class="modal-header">' + mkClose('heartModal') + '<button type="button" class="btn btn-xs btn-default" onclick="heartLogDownload()" style="float:right;margin-right:6px;margin-top:3px;" title="Download log">&#8659; Download</button><h4 class="modal-title">Heart</h4></div>' +
			'<div class="modal-body" style="padding:0;">' +
			'<div id="heart-log-view" style="background:#0d1117;font-family:monospace;font-size:11px;padding:8px 10px;max-height:240px;overflow-y:auto;overflow-x:hidden;"></div>' +
			'<div style="background:#161b22;padding:4px 8px;border-bottom:2px solid #1e2a3a;">' +
			'<select id="heart-log-filter" onchange="heartLogApplyFilter()" style="width:100%;background:#0d1117;color:#9cdcfe;border:1px solid #2a2a3a;border-radius:3px;font-family:monospace;font-size:11px;padding:2px 4px;">' +
			'<option value="">Show All</option>' +
			'</select></div>' +
			'<div id="heart-stats-view" style="padding:12px 15px;"></div>' +
			'</div>' +
			'<div class="modal-footer">' + mkFooter('heartModal') + '</div>' +
			'</div></div></div>'
		);
		$('#heart-log-view').html(heartLogBuildHtml());
		// Seed topic dropdown from existing buffer
		heartMessageLog.forEach(function(e) {
			if (heartLogTopics.indexOf(e.topic) === -1) heartLogTopics.push(e.topic);
		});
		heartLogTopics.sort();
		heartLogUpdateFilterOptions();
	}
	refreshHeartStatsView();

	var html = '<div class="col-lg-12" id="emergency-channel-banner">' + buildEmergencyBannerHtml() + '</div>';
	html += '<div class="col-lg-12">';
	html += '<div class="bs-component"><div class="panel panel-default">';
	html += '<div class="panel-heading"><h4>Organs</h4></div>';
	html += '<div class="panel-body">';
	html += '<div>';
	html += '<div class="row" style="margin:8px 0;">';
	html += '<div class="col-xs-12 col-sm-4 text-center" style="margin-bottom:10px;">';
	html += '<button class="btn btn-lg btn-block ' + statusClass + '" onclick="openModal(\'hippocampusModal\')">Hippocampus</button>';
	html += '</div>';
	html += '<div class="col-xs-12 col-sm-4 text-center" style="margin-bottom:10px;">';
	html += '<button class="btn btn-lg btn-block ' + statusClass + '" onclick="openModal(\'cerebellumModal\')">Cerebellum</button>';
	html += '</div>';
	html += '<div class="col-xs-12 col-sm-4 text-center" style="margin-bottom:10px;">';
	html += '<button class="btn btn-lg btn-block ' + statusClass + '" onclick="openModal(\'heartModal\')">Heart</button>';
	html += '</div>';
	html += '</div>';
	return html;
}

// (moved to deviceviews, 2026-10-31)

function refreshTelepathonsView(){
	refreshRegistryStatusButton();
	var telepathonsNuclei=getTelepathonsDeneChains();
	if(!telepathonsNuclei) return "";
	var deneChains = telepathonsNuclei['DeneChains'];
	var panelHTML="";
	for(var j13=0;j13<deneChains.length;j13++){
		var telepathonName = deneChains[j13]["Name"];
		if (telepathonName === DENECHAIN_ANNABELLE_QUEUE_STATUS) {
			// Not a telepathon device — shown via the "Queue Analysis" popup instead.
			refreshQueueAnalysisModal(deneChains[j13]);
			continue;
		}
		// This full-pulse snapshot of a telepathon's denes can itself be partial
		// (e.g. missing "Configuration" on a given pulse). Merge onto the cache
		// instead of overwriting it outright, otherwise fields like Device Type Id
		// (used for the card image) transiently disappear and the card flickers.
		var merged = mergeTelepathonDenes(telepathonCardDataCache[telepathonName], deneChains[j13]);
		var changed = JSON.stringify(merged) !== JSON.stringify(telepathonCardDataCache[telepathonName]);
		telepathonCardDataCache[telepathonName] = merged;
		var safeId = telepathonName.replace(/[^a-zA-Z0-9]/g, '_');
		var $textPanel = $('#tpText_' + safeId);
		if ($textPanel.length) {
			// Card already exists — update only the text panel, leaving the
			// image div untouched. This prevents the image from being destroyed
			// and re-fetched on every pulse cycle, eliminating the flicker.
			if (changed) {
				var fullHtml = buildTelepathonCardView(merged); // modal update side effect
				$textPanel.html($(fullHtml).find('#tpText_' + safeId).html());
			}
		} else {
			panelHTML += buildTelepathonCardView(merged);
		}
	}
	if (panelHTML) $('#TelepathonsView').append(panelHTML);
	return panelHTML;
}

function calculateFutureTimeWithDate(secondsTime, sleepTimeSeconds) {
		// Convert sleepTimeMicros to seconds and add to the epoch time
	//	const microsToSeconds = sleepTimeMicros / 1000000;
		const futureEpoch = secondsTime + sleepTimeSeconds;
		
		// Create a Date object with the future time
		const futureDate = new Date(futureEpoch * 1000);
		
		// Format the date and time
		const year = futureDate.getFullYear();
		const month = (futureDate.getMonth() + 1).toString().padStart(2, '0');
		const day = futureDate.getDate().toString().padStart(2, '0');
		const hours = futureDate.getHours().toString().padStart(2, '0');
		const minutes = futureDate.getMinutes().toString().padStart(2, '0');
		const seconds = futureDate.getSeconds().toString().padStart(2, '0');
		
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

function formatTime(totalSeconds) {
		// Convert microseconds to seconds (1 second = 1,000,000 microseconds)
		//const totalSeconds = Math.floor(sleepTimeMicros / 1000000);
		
		// Calculate minutes and remaining seconds
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		
		// Format the output (adding leading zeros if needed)
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
	
function refreshOrganismView(){
	if(organismInfoJsonData != undefined){
		var panelHTML="";
		$('#OrganismView').empty();
		for(var i in organismInfoJsonData){
			if(i != teleonomeName){
				panelHTML += "<div class=\"col-lg-2 col-md-2 col-sm-2 col-xs-6 text-center top-buffer\">";
				panelHTML += "<a href=\"http://"+i+".local\" target=\"_new\" class=\"btn btn-lg btn-"+ organismInfoJsonData[i] +"\">"+i+"</a>";
				panelHTML += "</div>";	
			}
		}
		//
		//
//		panelHTML += "<div id=\"OrganismDetail\" class=\"row hidden\">";
//		panelHTML += "<div class=\"col-lg-12 col-md-12 col-sm-12 col-sm-12 col-xs-12 text-center top-buffer\">";
//		panelHTML += "<div id=\"DetailText\"></div></div></div>";

		$('#OrganismView').append(panelHTML);
	}

}

function loadDenomeRefreshInterface(denomeFileInString) {
	// console.log("pulse arrive at " + new Date() );
	if(betweenPulseInterval!= undefined)clearInterval(betweenPulseInterval);
	if ($(window).width() < 480) {
		$('#TeleonomeDataStatus').removeClass().addClass('label label-xs label-success');
	}else{
		$('#TeleonomeDataStatus').removeClass().addClass('label label-lg label-success');
	}

	$('#CommandRequestStatus').hide();
	pulseJSONObject= JSON.parse(denomeFileInString);
	if(!$('#bannerformmodal').hasClass('in') && refreshActive){

		RefreshInterface();

	}else{
		//
		// we are not refreshing the interface
		// because there is a modal window open,
		// set the flag so that closing it will refreshinterface
		refreshInterfaceAfterModalNeeded=true;
	}
}

function RefreshInterface(){
	organsRenderedThisCycle = false;

	identityFactory = new IdentityFactory();
	denomeJSONObject = pulseJSONObject.Denome;
	teleonomeName=denomeJSONObject.Name;
	humanInterfaceDeneChainArray = getHumanInterfaceDeneChainsForVisualizer();

	$('title').text(teleonomeName);
	pulseTimestamp = pulseJSONObject["Pulse Timestamp"];
	pulseTimestampMilliseconds = pulseJSONObject["Pulse Timestamp in Milliseconds"];
	var pulseCreationTimeMilliseconds = pulseJSONObject["Pulse Creation Duration Millis"];

	var operationalModePointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_OPERATIONAL_MODE;
	operationalMode = getDeneWordByIdentityPointer(operationalModePointer, DENEWORD_VALUE_ATTRIBUTE);


	pulseCreationTime = msToTime(pulseCreationTimeMilliseconds);
	timeSinceLastPulse = new Date().getTime()-pulseTimestampMilliseconds;
	timeStringSinceLastPulse = msToTime(timeSinceLastPulse);

	chartDataSourcePointerHashMap = new HashMap();
	chartStyleHashMap = new HashMap();
	chartTimeStringHashMap = new HashMap();
	chartTitleHashMap = new HashMap();

	var pathologyDenes = getPathologyDenes();
	var mnemosynePathologyDenes = getMnemosynePathologyDenes();

	currentPathologyDeneCount = pathologyDenes.length + mnemosynePathologyDenes.length;
	if(currentPathologyDeneCount>0){
		// $('#Pathology').show();

		// $('#ErrorText').html("See Pathology (" + pathologyDenes.length + ")");
		// // console.log("Pathology Denes:" + JSON.stringify(pathologyDenes));
		// // console.log("Mnemosyne Pathology Denes:" + JSON.stringify(mnemosynePathologyDenes));

	}else{
		$('#Pathology').hide();
		$('#ErrorText').html("");
	}

	//// console.log("humanInterfaceDeneChainArray=" + humanInterfaceDeneChainArray);
	var pointer;
	var humanInterfaceDeneChainJSONObject={};
	for( i=0;i<humanInterfaceDeneChainArray.length;i++){
		pointer = "@" + teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":"+ humanInterfaceDeneChainArray[i]["Name"];
		humanInterfaceDeneChainIndex.put(pointer, humanInterfaceDeneChainArray[i]);
		humanInterfaceDeneChainJSONObject[pointer]=humanInterfaceDeneChainArray[i];
	}
	localStorage.setItem("HumanInterfaceDeneChainIndex", JSON.stringify(humanInterfaceDeneChainJSONObject));

	var teleonomeStatusBootstrapValuePointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_OPERATIONAL_STATUS_BOOTSTRAP_EQUIVALENT;
	//// console.log("teleonomeStatusBootstrapValuePointer=" + teleonomeStatusBootstrapValuePointer);
	teleonomeStatusBootstrapValue = getDeneWordByIdentityPointer(teleonomeStatusBootstrapValuePointer, DENEWORD_VALUE_ATTRIBUTE);

	var currentPulseFrequencyPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_CURRENT_PULSE_FREQUENCY;
	//// console.log("currentPulseFrequencyPointer=" + currentPulseFrequencyPointer);
	currentPulseFrequency = getDeneWordByIdentityPointer(currentPulseFrequencyPointer, DENEWORD_VALUE_ATTRIBUTE);
	//// console.log("currentPulseFrequency=" + currentPulseFrequency);

	var currentPulseGenerationDurationPointer = "@" +teleonomeName + ":" + NUCLEI_PURPOSE + ":" +DENECHAIN_OPERATIONAL_DATA + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_CURRENT_PULSE_GENERATION_DURATION;
	//// console.log("currentPulseGenerationDurationPointer=" + currentPulseGenerationDurationPointer);
	currentPulseGenerationDuration = getDeneWordByIdentityPointer(currentPulseGenerationDurationPointer, DENEWORD_VALUE_ATTRIBUTE);
	//// console.log("currentPulseGenerationDuration=" + currentPulseGenerationDuration);

	var numberOfPulsesBeforeLatePointer = "@" +teleonomeName + ":" + NUCLEI_INTERNAL + ":" +DENECHAIN_DESCRIPTIVE + ":" + DENE_TYPE_VITAL + ":" +DENEWORD_TYPE_NUMBER_PULSES_BEFORE_LATE;
	//// console.log("numberOfPulsesBeforeLatePointer=" + numberOfPulsesBeforeLatePointer);
	numberOfPulsesBeforeLate = getDeneWordByIdentityPointer(numberOfPulsesBeforeLatePointer, DENEWORD_VALUE_ATTRIBUTE);
	//// console.log("numberOfPulsesBeforeLate=" + numberOfPulsesBeforeLate);

	identityFactory.init(teleonomeName);
	if(pageToDisplay === -1){
		pageToDisplay = 1;
	}


	renderPageToDisplay();

	//
	// now generate the bottomname
	// <div class="col-xs-2 text-center">
	// <a href="javascript:setPageToDisplay(1)"><i class="glyphicon glyphicon-home"></i><br>Home</a>
	// </div>
	var deneChainControlParamPointer = "@" +teleonomeName + ":" + NUCLEI_HUMAN_INTERFACE + ":" +DENECHAIN_TYPE_HUMAN_INTERFACE_CONTROL_PARAMETERS;
	var  deneChainControlParam = getDeneChainByIdentityPointer(deneChainControlParamPointer);
	var bottomNavHTML = extraLowerNavInfo(deneChainControlParam);

	$("#bottomNav").empty();
	$("#bottomNav").append(bottomNavHTML);

	refreshOrganismView();
	betweenPulseInterval = setInterval(monitorBetweenPulses, 10 * 1000);

}	

function setPageToDisplay(p){
	pageToDisplay=p;
	refreshActive=true;

	renderPageToDisplay();
}


function renderPageToDisplay(){
	var pagePosition, pageDefinintionPointer;
	var controlParameterDenes,controlParameterDene, deneWords, deneWord;
	// console.log("entering render page to display, with pageToDisplay=" + pageToDisplay );
	for( j=0;j<humanInterfaceDeneChainArray.length;j++){
		if( humanInterfaceDeneChainArray[j]["DeneChain Type"]===HUMAN_INTERFACE_CONTROL_PARAMETERS){
			controlParameterDenes = humanInterfaceDeneChainArray[j]["Denes"];
			for( k=0;k<controlParameterDenes.length;k++){
				controlParameterDene = controlParameterDenes[k];
				deneWords = controlParameterDene["DeneWords"];
				for( l=0;l<deneWords.length;l++){
					deneWord = deneWords[l];
					if(deneWord["Name"]===DENEWORD_HUMAN_INTERFACE_WEB_PAGE_PAGE_POSITION){
						pagePosition =  deneWord["Value"];
						if(pageToDisplay===pagePosition){
							pageDefinintionPointer = getDeneWordAttributeByDeneWordTypeFromDene(controlParameterDene, DENEWORD_TYPE_WEB_PAGE_VIEW_DEFINITION_POINTER,DENEWORD_VALUE_ATTRIBUTE);
							//// console.log("pageDefinintionPointer=" +pageDefinintionPointer);
							//
							// if this is not the first page, hide
							// the PulseInfo
							if(pageToDisplay==1){
								$('#PulseActivityPanel').show();
							}else{
								$('#PulseActivityPanel').hide();
							}	
							renderPageByPointer(pageDefinintionPointer, "EntryPoint");
						}
					}
				}
			}
		}
	}

}





function renderPageByPointer(pagePointer, locationId){
	organsRenderedThisCycle = false;
	// This function empties and fully rebuilds the panel HTML (including chart SVGs) on every
	// pulse refresh and every AsyncUpdate (see Ra's PLSeries AsyncUpdate mode) -- emptying the
	// container collapses the page's scrollable height for a moment, and the browser clamps
	// scroll position down when that happens, so anyone scrolled down to e.g. the memory chart
	// gets kicked back to the top on every single refresh. Save/restore scroll position around
	// the rebuild so it doesn't move. Scoped to the main "EntryPoint" container specifically,
	// not any other locationId this function might be called with (e.g. modals), so it doesn't
	// affect scroll behavior anywhere that isn't the main page.
	var restoreScrollY = (locationId === "EntryPoint") ? window.pageYOffset : null;
	var pageDeneChain = humanInterfaceDeneChainIndex.get(pagePointer);
	console.log("renderPageByPointer pagePointer=" + pagePointer + " pageDeneChain=" +pageDeneChain);
	if (!pageDeneChain) {
		console.warn("renderPageByPointer: no denechain found for pointer: " + pagePointer);
		$('#' + locationId).empty().html('<div class="row top-buffer"><div class="col-lg-12 text-center" style="padding:40px;color:#999;">Page not yet configured.</div></div>');
		return;
	}
	//
	// get the denes, every dene is a panel in this page
	//
	var denePanelArray = pageDeneChain["Denes"];
	//
	// loop over every dene and get two denes
	// each of type Visualization Position and  Panel DeneChain Pointer
	var panelPositionInPageHashMap = new HashMap();
	//
	// also make another hashmap with the key beein the pointer and the value the panelVisualStyle;
	//
	var panelPointerVisualStyleHashMap = new HashMap();
	var deneWords;
	var panelInPagePosition=-1;
	var panelDeneChainPointer;
	var panelVisualStyle;
	var panelExternalDataSourcePointer, panelExternalTimestampDataSourcePointer;
	var panelPointerExternalDataSourcePointerHashMap = new HashMap();
	var panelPointerExternalTimestampDataSourcePointerHashMap = new HashMap();
	var panelVisibleHashMap = new HashMap();

	//
	// re initialize the charts data holders
	chartDataSourcePointerHashMap = new HashMap();
	chartStyleHashMap = new HashMap();
	chartTimeStringHashMap = new HashMap();
	chartTitleHashMap = new HashMap();


	var deneWord;
	var denePanel;
	var panelVisualizationStyle;
	var dataDene;
	var panelVisible;
	//// console.log("renderPageByPointer denePanelArray.length=" +denePanelArray.length);
	var i2=0, j2=0,k2=0;
	for(i2=0;i2<denePanelArray.length;i2++){
		denePanel = denePanelArray[i2];
		//
		// get the denewords
		deneWords = denePanel["DeneWords"];
		panelInPagePosition=-1;
		panelDeneChainPointer="";
		panelVisualStyle="";
		panelExternalDataSourcePointer="";
		panelExternalTimestampDataSourcePointer="";
		panelVisible=false;
		for(j2=0;j2<deneWords.length;j2++){
			deneWord = deneWords[j2];
			//
			// get the position and the type
			if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_IN_PAGE_POSITION){
				panelInPagePosition = deneWord["Value"];
			}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_DENECHAIN_POINTER){
				panelDeneChainPointer = deneWord["Value"];
			}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_PANEL_VISUALIZATION_STYLE){
				panelVisualStyle = deneWord["Value"];
			}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_EXTERNAL_DATA_SOURCE_DENE){
				panelExternalDataSourcePointer = deneWord["Value"];
			}else if(deneWord.hasOwnProperty("DeneWord Type") && deneWord["DeneWord Type"]===DENEWORD_TYPE_EXTERNAL_TIMESTAMP_DATA_SOURCE_DENE){
				panelExternalTimestampDataSourcePointer = deneWord["Value"];
			}else if(deneWord.Name===DENEWORD_VISIBLE){
				panelVisible = deneWord["Value"];
				
			}
		}
		//
		// if the values were found store them in a hashmap
		//
		if(panelInPagePosition!=-1 &&  panelDeneChainPointer!=""){
			panelPositionInPageHashMap.put(panelInPagePosition,panelDeneChainPointer);
		}

		if(panelVisualStyle!="" &&  panelDeneChainPointer!=""){
			panelPointerVisualStyleHashMap.put(panelDeneChainPointer,panelVisualStyle);
		}

		if(panelExternalDataSourcePointer!="" &&  panelDeneChainPointer!=""){
			panelPointerExternalDataSourcePointerHashMap.put(panelDeneChainPointer,panelExternalDataSourcePointer);
		}

		if(panelDataSourcePointer!="" &&  panelExternalTimestampDataSourcePointer!=""){
			panelPointerExternalTimestampDataSourcePointerHashMap.put(panelDeneChainPointer,panelExternalTimestampDataSourcePointer);
		}
		if(panelDataSourcePointer!="" &&  panelDeneChainPointer!=""){
			panelVisibleHashMap.put(panelDeneChainPointer,panelVisible);
		}
	}
	//
	// sort the hashmap by postion
	//
	var sorted= sortHashMap(panelPositionInPageHashMap);
	//
	// now start rendering each panel
	// therefore at this point empty the interface
	//
	if(teleonomeName==undefined || teleonomeName=="undefined")teleonomeName=denomeJSONObject.Name;
	$("#" + locationId).empty();
	$("#teleonomeName").html(teleonomeName);
	$("#PulseTimestamp").html(pulseTimestamp);


	$("#PulseCreationTime").html(pulseCreationTime);
	//if(operationalMode!=OPERATIONAL_MODE_NORMAL){
	$("#WPSInfo").html(operationalMode);
	//}
	$("#TimeSinceLastPulse").html(timeStringSinceLastPulse);

	if ($(window).width() < 480) {
		$('#TeleonomeStatus').removeClass().addClass('label label-xs label-' + teleonomeStatusBootstrapValue);

	}else{
		$('#TeleonomeStatus').removeClass().addClass('label label-lg label-' + teleonomeStatusBootstrapValue);

	}
	$('#TeleonomeStatus').show();
	$('#TeleonomeDataStatus').show();

	if(currentPathologyDeneCount>0){
		$('#TeleonomeStatus').html("&nbsp;&nbsp;" + currentPathologyDeneCount + "&nbsp;&nbsp;");
	}else {
		$('#TeleonomeStatus').html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");
	}
	var panelHTML =""; 
	var deneChainPointer , mainPanelVisualStyle,panelDeneChain , denes,panelPositionInPanelHashMap;
	var key,key2,renderedDataSourceDeneWord, panelDataSourcePointer;
	var visible=true;

	for(key in sorted){
		var obj = sorted[key];
		//// console.log("key=" + key + "value=" + obj);
		for(var property in obj) {
			deneChainPointer= obj[property];
			//// console.log("line 178 a property=" + deneChainPointer);
		}

	}

	panelHTML ="";

	var numberOfPanelsPerRow=2;
	var obj =  sorted["_map"];
	var obj2 = panelPointerVisualStyleHashMap["_map"];
	var obj3 = panelPointerExternalDataSourcePointerHashMap["_map"];
	var obj4 = panelPointerExternalTimestampDataSourcePointerHashMap["_map"];
	var obj5 = panelVisibleHashMap["_map"];
	//
	// after every two panels put a new row
	// open the first one
	//
	panelHTML += "<div class=\"row top-buffer\">";
	var panelCounter=0;
	var inSearch=false;
	for(var property in obj) {
		deneChainPointer= obj[property];
		panelCounter++;
		panelVisible = obj5[deneChainPointer];
		if(!panelVisible)continue;
		mainPanelVisualStyle= obj2[deneChainPointer];
		panelExternalDataSourcePointer = obj3[deneChainPointer];
		panelExternalTimestampDataSourcePointer = obj4[deneChainPointer];

		// console.log("line 197 deneChainPointer=" + deneChainPointer +" mainPanelVisualStyle=" + mainPanelVisualStyle);

		panelDeneChain = humanInterfaceDeneChainIndex["_map"][deneChainPointer];
		if (!panelDeneChain) {
			console.warn("renderPageByPointer: target denechain not found for pointer: " + deneChainPointer);
			denes = [];
		} else {
			denes = panelDeneChain["Denes"];
		}
		//
		// the next step is to take the denes and in each one
		// get the the position of this panel inside of the main panel
		// and store them in hashmap sthat will be sorted
		// the sorted
		//


		// start rendering the html for this panel
		//
		if(mainPanelVisualStyle===PANEL_VISUALIZATION_ORGANISM_VIEW){
			var title = panelDeneChain["Name"];
			var organismView = new OrganismView();
			panelHTML += organismView.process(title);
			refreshOrganismView();


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_TELEPHATON_VIEW){
			var title = panelDeneChain["Name"]; /// xxx
			var telepathonPanel = new TelepathonPanel();
			panelHTML += telepathonPanel.process(title);
			refreshTelepathonsView();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_ORGANS){
			panelHTML += renderOrgansPanel();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_HIPPOCAMPUS_STATUS){
			panelHTML += renderOrgansPanel();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_CEREBELLUM_STATUS){
			panelHTML += renderOrgansPanel();

		}else if( mainPanelVisualStyle === PANEL_VISUALIZATION_STYLE_SETTINGS_INFO){
			//
			// in this case, denes will contain one dene,
			// which in turn will contain 3 denewords
			// the value of each of these denewords is a pointer
			// to the denechain panel for the info, wifi and update parameteres
			// using the pointers, get the chains and store them in localStorage
			// since the classes will use them later.
			// Each of these three pointers point to a denechain that itself has
			// only one dene 
			var systemInfoPointers = denes[0]['DeneWords'];
			var pointer;
			var systemInfoChain;
			var systemInfoDeneChainPanelJSON={};

			for( var q=0;q<systemInfoPointers.length;q++){
				pointer = systemInfoPointers[q].Value;
				systemInfoChain = humanInterfaceDeneChainIndex["_map"][pointer];
				systemInfoDeneChainPanelJSON[pointer] = systemInfoChain;

			}

			localStorage.setItem("SystemInfo", JSON.stringify(systemInfoDeneChainPanelJSON));

			var settingsInfo = new SettingsInfo();
			panelHTML += settingsInfo.process();


		}else if( mainPanelVisualStyle === PANEL_VISUALIZATION_STYLE_DIAGNOSTICS_INFO){
			//
			// in this case, denes will contain one dene,
			// which in turn will contain 4 denewords
			// the value of each of these denewords is a pointer
			// to the denechain panel for the Synchronous, Asynchronous , System and Mnemosycons
			// using the pointers, get the chains and store them in localStorage
			// since the classes will use them later
			var systemInfoPointers = denes[0]['DeneWords'];
			var pointer;
			var systemInfoChain;
			var systemInfoDeneChainPanelJSON={};

			for( var q=0;q<systemInfoPointers.length;q++){
				pointer = systemInfoPointers[q].Value;
				systemInfoChain = humanInterfaceDeneChainIndex["_map"][pointer];
				systemInfoDeneChainPanelJSON[pointer] = systemInfoChain;

			}

			localStorage.setItem("DiagnosticInfo", JSON.stringify(systemInfoDeneChainPanelJSON));

			var diagnosticsInfo = new DiagnosticsInfo();
			panelHTML += diagnosticsInfo.process();


		}else if( mainPanelVisualStyle === PANEL_VISUALIZATION_STYLE_NETWORK_MODE_SELECTOR){

			var aNetworking = new Networking();
			panelHTML += aNetworking.process();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_ACTION_EVALUATION_REPORT){
			var sourceDataPointer = denes[0].DeneWords[0].Value;
			var anActionEvaluationReport = new ActionEvaluationReport();
			panelHTML += anActionEvaluationReport.process(sourceDataPointer);


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_COMPLETE_WIDTH){


			var title =  panelDeneChain["Name"]

			var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
			var object = panelPositionInPanelHashMap["_map"];


			var aSingleValuePanel = new SingleValuePanel();
			panelHTML += aSingleValuePanel.process(true, title, object);



		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SHORT_TERM_WEATHER_FORECAST){
			var sourceDataPointer = denes[0].DeneWords[0].Value;
			var title = panelDeneChain["Name"];
			var aShortTermWeatherForecast = new ShortTermWeatherForecast();
			panelHTML += aShortTermWeatherForecast.process(title, sourceDataPointer);


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_DAILY_WEATHER_FORECAST){
			var sourceDataPointer = denes[0].DeneWords[0].Value;
			var title = panelDeneChain["Name"];
			var aDailyWeatherForecast = new DailyWeatherForecast();
			panelHTML += aDailyWeatherForecast.process(title, sourceDataPointer);

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_DENEWORD_TABLE){

			var panelDeneWords = denes[0].DeneWords;
			for(var i34=0;i34<panelDeneWords.length;i34++){
				processingDeneWord = panelDeneWords[i34];
				processingDeneWordName = processingDeneWord.Name;
				if(processingDeneWordName === PANEL_TITLE){
					panelTitle = processingDeneWord.Value;
				}
			}
			var deneWordTable = new DeneWordTable();
			panelHTML += deneWordTable.process(panelTitle, denes);

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL){
			var title =  panelDeneChain["Name"]

			var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
			var object = panelPositionInPanelHashMap["_map"];


			var aSingleValuePanel = new SingleValuePanel();
			panelHTML += aSingleValuePanel.process(false, title, object);

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_COMPLETE_DENE_STYLE_SINGLE_VALUE_PANEL){
			var aCompleteDeneSingleValuePanel = new CompleteDeneSingleValuePanel();
			panelHTML += aCompleteDeneSingleValuePanel.process();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_WELL_SINGLE_VALUE_PANEL){
			var sourceDataPointer = denes[0].DeneWords[0].Value;
			var aWellSingleValuePanel = new WellSingleValuePanel();
			panelHTML += aWellSingleValuePanel.process(sourceDataPointer, denes);


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_TIMESTAMP){
			var aSingleValuePanelExternalTimestamp = new SingleValuePanelExternalTimestamp();
			var title  = panelDeneChain["Name"];
			var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
			var object = panelPositionInPanelHashMap["_map"];

			panelHTML += aSingleValuePanelExternalTimestamp.process( title, panelExternalTimestampDataSourcePointer, object);



		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_DATA){
			var title  = panelDeneChain["Name"];
			var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
			var object = panelPositionInPanelHashMap["_map"];
			var aSingleValuePanelExternalData = new SingleValuePanelExternalData();
			panelHTML += aSingleValuePanelExternalData.process(title, false, panelExternalDataSourcePointer, object);

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_SINGLE_VALUE_PANEL_COMPLETE_WIDTH_EXTERNAL_DATA){
			var title  = panelDeneChain["Name"];
			var panelPositionInPanelHashMap = sortDenesInASingleValuePanel(panelDeneChain);
			var object = panelPositionInPanelHashMap["_map"];
			var aSingleValuePanelExternalData = new SingleValuePanelExternalData();
			panelHTML += aSingleValuePanelExternalData.process(title, true, panelExternalDataSourcePointer, object);

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_COMPLETE_DENE_STYLE_SINGLE_VALUE_PANEL_EXTERNAL_DATA){

			var sourceDataPointer = denes[0].DeneWords[0].Value;

			var title = panelDeneChain["Name"];
			var aCompleteDeneSingleValuePanelExternalData = new CompleteDeneSingleValuePanelExternalData();
			panelHTML += aCompleteDeneSingleValuePanelExternalData.process(sourceDataPointer, title);

			
		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_NETWORK_SENSOR_DEVICE_STATUS_REPORT){

			var aNetworkSensorDeviceStatusReport = new NetworkSensorDeviceStatusReport();
			panelHTML += aNetworkSensorDeviceStatusReport.process(organismIPInfoJsonData);
			inSearch=true;


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_SEARCH_PANEL){

			var aSearchPanel = new SearchPanel();
			panelHTML += aSearchPanel.process();
			inSearch=true;


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MULTI_LINE_CHART ){
			//
			// decide what type of chart
			// and invoke the function

			panelHTML += "<div class=\"col-lg-6\">";   
			panelHTML += "<div class=\"bs-component\">";
			panelHTML += "<div class=\"panel panel-default\">";
			panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
			panelHTML += "<div class=\"panel-body text-center\">";
			panelHTML += "<div class=\"row\">";
			var id = "Chart" + panelCounter;
			panelHTML += "<div id=\""+ id +"\" class=\"col-lg-12 col-md-12 col-sm12 col-xs-12\">";
			panelHTML += "</div>";
			// Not closing the "row" div here -- the shared closing block below (5 closing
			// </div> tags, shared with SingleValuePanel-style panels) closes it. Closing it
			// here too was an extra </div> that prematurely closed the outer
			// "row top-buffer" container, kicking every later panel outside any .row.

			// t add multiline support, need to get all denewords not just one
			// create an array of all the denewords
			// and store it in line 1246 chartDataSourcePointerHashMap.put(id,renderedDataSourceDeneWord);
			var allDataPointersArray = extractAllDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER);
			var renderedDataSourceDeneWordsArray = getAllDeneWordsByIdentityPointer(allDataPointersArray, COMPLETE);


			var timeScale = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, DENEWORD_TYPE_CHART_TIME_SCALE_STRING);
			if(timeScale==null || timeScale== undefined)timeScale="%H:%M";

			var title = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, PANEL_TITLE);
			if(title==null || title== undefined)title="";


			// console.log("before rendering chart");
			// Was storing the function reference (getAllDeneWordsByIdentityPointer) instead of its
			// result -- drawDenomeMultiLineChart would have received a function, not data. Fixed
			// 2026-07-15 alongside adding the actual drawDenomeMultiLineChart implementation.
			chartDataSourcePointerHashMap.put(id,renderedDataSourceDeneWordsArray);
			chartStyleHashMap.put(id,mainPanelVisualStyle);
			chartTimeStringHashMap.put(id,timeScale);
			chartTitleHashMap.put(id,title);



		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_LINE_CHART ||
				mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_CSV_MULTI_LINE_CHART||
				mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_PIE_CHART ||
				mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_BAR_CHART
		){
			//
			// decide what type of chart
			// and invoke the function

			panelHTML += "<div class=\"col-lg-6\">";   
			panelHTML += "<div class=\"bs-component\">";
			panelHTML += "<div class=\"panel panel-default\">";
			panelHTML += " <div class=\"panel-heading\"><h4>"+panelDeneChain["Name"]+"</h4></div>";
			panelHTML += "<div class=\"panel-body text-center\">";
			panelHTML += "<div class=\"row\">";
			var id = "Chart" + panelCounter;
			panelHTML += "<div id=\""+ id +"\" class=\"col-lg-12 col-md-12 col-sm12 col-xs-12\">";
			panelHTML += "</div>";
			// Not closing the "row" div here -- see matching note in the MULTI_LINE_CHART
			// branch above; the shared closing block closes it.

			// t add multiline support, need to get all denewords not just one
			// create an array of all the denewords
			// and store it in line 1246 chartDataSourcePointerHashMap.put(id,renderedDataSourceDeneWord);
			var panelDataSourcePointer = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, DENEWORD_TYPE_PANEL_DATA_SOURCE_POINTER);
			renderedDataSourceDeneWord = getDeneWordByIdentityPointer(panelDataSourcePointer, COMPLETE);


			var timeScale = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, DENEWORD_TYPE_CHART_TIME_SCALE_STRING);
			if(timeScale==null || timeScale== undefined)timeScale="%H:%M";

			var title = extractDeneWordValueByDeneWordTypeFromDeneChain(panelDeneChain, PANEL_TITLE);
			if(title==null || title== undefined)title="";


			// console.log("before rendering chart");
			chartDataSourcePointerHashMap.put(id,renderedDataSourceDeneWord);
			chartStyleHashMap.put(id,mainPanelVisualStyle);
			chartTimeStringHashMap.put(id,timeScale);
			chartTitleHashMap.put(id,title);



		}else if(mainPanelVisualStyle == PANEL_VISUALIZATION_STYLE_IMAGE){

			var sourceDataPointer = denes[0].DeneWords[0].Value;
			var imageFileName = getDeneWordByIdentityPointer(sourceDataPointer, DENEWORD_VALUE_ATTRIBUTE);

			panelHTML += "<div class=\"col-lg-12\">";
			panelHTML += "<div class=\"bs-component\">";
			panelHTML += "<div class=\"panel panel-default\">";
			panelHTML += " <div class=\"panel-heading\"><h4>Status</h4></div>";
			panelHTML += "<div class=\"panel-body\">";
			panelHTML += "<img class=\"img-responsive\" src=\"images/"+imageFileName+"\" >";


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MNEMOSYNE_TABLE){
			var panelDeneWords = denes[0].DeneWords;
			var aMnemosyneTable = new MnemosyneTable();
			panelHTML += aMnemosyneTable.process(panelDeneWords);



		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_PATHOLOGY){
			var aPathologyPanel = new PathologyPanel();
			panelHTML += aPathologyPanel.process();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_DOORBELL){
			var aDoorbellPanel = new DoorbellPanel();
			panelHTML += aDoorbellPanel.process();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_NETWORK_RULES){
			var aNetworkRulesPanel = new NetworkRulesPanel();
			panelHTML += aNetworkRulesPanel.process();

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_TRAFFIC){
			var aTrafficPanel = new TrafficPanel();
			panelHTML += aTrafficPanel.process();


		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MANUAL_ACTION_WITH_TIMER){

		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MNEMOSYNE_VIEW){
			panelHTML += renderMnemosyneViewPanel();

		}else{

		}
		//// console.log("unidentified style, mainPanelVisualStyle=" + mainPanelVisualStyle)

		panelHTML += "</div>";    // closing <div class=\"panel-body text-center\"
		panelHTML += "</div>";    // closing <div class=\"row\" (panel-heading self-closes inline above)
		panelHTML += "</div>";    // closing <div class=\"panel panel-default\"
		panelHTML += "</div>";    // closing <div class=\"bs-component\"
		panelHTML += "</div>";    // closing <div class=\"col-lg-6\"

		// console.log("rowPanelCounter=" + rowPanelCounter + " numberOfPanelsPerRow=" + numberOfPanelsPerRow);
		if(rowPanelCounter===numberOfPanelsPerRow){

			//
			// close the current row of panels
			//
			panelHTML += "</div>";    // closing <div class=\"row top-buffer\"

			//
			// and start a new one
			//
			panelHTML += "<div class=\"row top-buffer\">";				
			rowPanelCounter=0;
			//// console.log("added new row to the panels");
		}
	}
	//
	//close the last row of the page panels
	panelHTML += "</div>";// clossing class=\"row top-buffer\">";
	//// console.log("finished rendering page " + panelHTML);
	$("#" + locationId).append(panelHTML);

	//
	// check to see if secundaryView is not empty,
	// if its not, then refresh it by invoking the function
	// in the ViewManager
	var currentViewObjectU = localStorageManager.getItem(LOCAL_STORAGE_CURRENT_VIEW_KEY);

	if(locationId=="EntryPoint" && currentViewObjectU != null && currentViewObjectU != undefined){
		var currentViewObject = JSON.parse(currentViewObjectU);
		var secundaryView = currentViewObject["SecundaryView"];
		teleonomeName=denomeJSONObject.Name;

		if( secundaryView !="" && teleonomeName!= undefined && teleonomeName!=''){
			if(currentViewObject.hasOwnProperty("Data")){
				var data = currentViewObject.Data;
				if(data.hasOwnProperty("ViewManagerParam")){
					viewManager[secundaryView](data.ViewManagerParam);
				}else{
					viewManager[secundaryView]();
				}
			}else{
				viewManager[secundaryView]();
			}
		}


	}

	//
	// check to see if the user is waiting for response after sking for reboot or shutdown
	//
	if(powerButtonDisabled){
		$("#MainPowerButton").attr("disabled", true);
		$("#MainPowerButton").addClass('btn-warning').removeClass('btn-success');
	}
	if(powerButtonRed){
		$("#MainPowerButton").addClass('btn-danger').removeClass('btn-warning').removeClass('btn-success');
	}
	if(inSearch){
		searchFunctions.generateAllGraphs();
	}
	//
	// now loop over every chart
	//
	var obj3 = chartDataSourcePointerHashMap["_map"];
	var obj4 = chartStyleHashMap["_map"];
	var obj5 = chartTimeStringHashMap["_map"];
	var obj6 = chartTitleHashMap["_map"];

	for(var pId in obj3) {
		var renderedDataSourceDeneWord= obj3[pId];
		var mainPanelVisualStyle = obj4[pId];
		var timeString = obj5[pId];
		var title = obj6[pId];

		if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_LINE_CHART){
			drawTimeSeriesLineChart(pId, renderedDataSourceDeneWord, title, timeString);	
		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_MULTI_LINE_CHART){
			// Distinct function name from the CSV path below on purpose -- see D3Chart.js's
			// drawDenomeMultiLineChart comment. Both used to be named drawTimeSeriesMultiLineChart,
			// which silently clobbered one another depending on script load order.
			drawDenomeMultiLineChart(pId, renderedDataSourceDeneWord, title, timeString);
		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_CSV_MULTI_LINE_CHART){
			var fileName = renderedDataSourceDeneWord.Value.replace('$Webserver_Root/','');
			var units = renderedDataSourceDeneWord.Units;
			drawTimeSeriesMultiLineChart(pId, fileName, units);
		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_PIE_CHART){
			drawPieChart(pId,renderedDataSourceDeneWord, title);
		}else if(mainPanelVisualStyle===PANEL_VISUALIZATION_STYLE_BAR_CHART){
			drawTimeSeriesBartChart(pId,renderedDataSourceDeneWord, title, timeString)
		}
	}





	//
	// set up the available ssids
	//
	var availableSSIDs = [];//currentOperationalData["Available SSIDs"];
	var option = $('<option></option>').attr("value", "").text("Select SSID");
	$("#AvailableNetworks").empty().append(option);

	// console.log("availableSSIDs=" + availableSSIDs);
	var $el = $("#AvailableNetworks");
	$(function() {
		$.each(availableSSIDs, function(i, item) {
			var security="";
			if(item["Authentication"]!=null && item["Authentication"].indexOf("PSK")>-1)security="Password";
			var key = item["SSID"]+ "-" + item["Signal"] + " " + security;
			var value=item["SSID"] ;
			$el.append($("<option></option>").attr("value", value).text(key)); 
		});
	});
	//
	// end of network identity
	//

	if (restoreScrollY !== null) {
		// Deferred one tick so it runs after the browser has finished laying out the panels
		// and chart SVGs just appended above -- restoring synchronously can still race layout
		// on slower devices/large pages.
		setTimeout(function() { window.scrollTo(0, restoreScrollY); }, 0);
	}

}




