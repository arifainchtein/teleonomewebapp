// Hypnogram: the sleep pattern of a telepathon (Daffodil / Langley / Chinampa), drawn like a
// human sleep-study hypnogram - Awake on top, Asleep below, Low-battery (COMMA) sleep deepest -
// from the "Vital Signs" Dene each device sends after its data pulse (see VitalSigns_Design.pdf).
//
// Data source: GetTelepathonRecordsForLastHours (whole Telepathons rows from Postgres), NOT the
// Hippocampus. The Vital Signs Dene is carried over into every stored data row until the next
// record replaces it, so each record appears in many rows stamped with the *data row's* time;
// buildHypnogramModel() dedupes by (Reset Count, Sequence) and places each record at its own
// "Vital Signs Received Time". (The Hippocampus only keeps the Purpose Dene in live memory, so a
// per-DeneWord Hippocampus_Request would also go stale after its first Postgres backfill.)
//
// Each record closes one awake period: it is sent right after the data pulse, just before the
// device goes back to sleep, and carries
//   Last Awake Duration (ms)          -> awake period = [received - duration, received]
//   Wake / Early / Aborted Wake Count -> what happened while asleep since the previous record
//   Slept Seconds Total               -> unchanged between records = the device never slept
//   Reset Count / Last Reset Time     -> a reset breaks the chain (totals restart from zero)
//   Sequence                          -> a gap means records were lost on the radio

var HYPNOGRAM_LEVELS = [
	{ key: 'awake', label: 'Awake', color: '#e67e22' },
	{ key: 'asleep', label: 'Asleep', color: '#2980b9' },
	{ key: 'comma', label: 'Low-battery sleep', color: '#8e44ad' }
];
var HYPNOGRAM_SEND_GAP_SECONDS = 1;  // VITAL_SIGNS_GAP_MS - the record goes out ~1s after the data pulse

// rows: the JSONArray from GetTelepathonRecordsForLastHours ([{timeSeconds, data:{Denes:[...]}}]).
// Returns { records, segments, earlyWakes, resets, stats } - pure, no DOM, so it can be tested
// outside the browser.
function buildHypnogramModel(rows, startSeconds, endSeconds) {
	var byKey = {};
	(rows || []).forEach(function(row) {
		var denes = (row.data && row.data.Denes) || [];
		for (var i = 0; i < denes.length; i++) {
			if (denes[i].Name !== TELEPATHON_DENE_VITAL_SIGNS) continue;
			var w = {};
			(denes[i].DeneWords || []).forEach(function(dw) { w[dw.Name] = dw.Value; });
			var rec = {
				received: parseInt(w["Vital Signs Received Time"]) || 0,
				seq: parseInt(w["Sequence"]) || 0,
				resetCount: parseInt(w["Reset Count"]) || 0,
				resetReason: w["Last Reset Reason"] || '',
				resetTime: parseInt(w["Last Reset Time"]) || 0,
				wakeCount: parseInt(w["Wake Count"]) || 0,
				earlyWakeCount: parseInt(w["Early Wake Count"]) || 0,
				commaWakeCount: parseInt(w["Aborted Wake Count"]) || 0,
				sleptTotal: parseInt(w["Slept Seconds Total"]) || 0,
				awakeTotal: parseInt(w["Awake Seconds Total"]) || 0,
				awakeMs: parseInt(w["Last Awake Duration"]) || 0,
				wakeCause: w["Last Wake Cause"] || '',
				drift: parseInt(w["Last Wake Drift"]) || 0,
				wakeVoltage: w["Wake Voltage"] !== undefined ? parseFloat(w["Wake Voltage"]) : null,
				minVoltage: w["TX Min Voltage"] !== undefined ? parseFloat(w["TX Min Voltage"]) : null
			};
			if (rec.received > 0) byKey[rec.resetCount + ':' + rec.seq] = rec;
		}
	});
	var records = Object.keys(byKey).map(function(k) { return byKey[k]; })
		.sort(function(a, b) { return a.received - b.received || a.seq - b.seq; });

	var segments = [], earlyWakes = [], resets = [];
	var stats = { records: records.length, missing: 0, resets: 0, earlyWakes: 0, commaWakes: 0,
		awakeSeconds: 0, asleepSeconds: 0, commaSeconds: 0, unknownSeconds: 0, sleeps: [], awakes: [] };

	function push(level, from, to, note) {
		from = Math.max(from, startSeconds);
		to = Math.min(to, endSeconds);
		if (to <= from) return;
		var last = segments[segments.length - 1];
		if (last && last.level === level && Math.abs(last.to - from) <= 2 && !note && !last.note) {
			last.to = to;
		} else {
			segments.push({ level: level, from: from, to: to, note: note || null });
		}
		var len = to - from;
		if (level === 'awake') stats.awakeSeconds += len;
		else if (level === 'asleep') stats.asleepSeconds += len;
		else if (level === 'comma') stats.commaSeconds += len;
		else stats.unknownSeconds += len;
	}

	for (var i = 0; i < records.length; i++) {
		var r = records[i];
		var awakeEnd = r.received - HYPNOGRAM_SEND_GAP_SECONDS;
		var awakeStart = awakeEnd - Math.round(r.awakeMs / 1000);
		var prev = i > 0 ? records[i - 1] : null;

		if (prev && r.resetCount !== prev.resetCount) {
			// Totals restarted - the stretch since the previous record is unknown.
			var resetAt = (r.resetTime > prev.received && r.resetTime <= r.received) ? r.resetTime : awakeStart;
			push('unknown', prev.received, resetAt, 'reset');
			resets.push({ time: resetAt, reason: r.resetReason });
			stats.resets++;
			push('unknown', resetAt, awakeStart);
		} else if (prev) {
			var missed = r.seq - prev.seq - 1;
			var dWake = r.wakeCount - prev.wakeCount;
			var dEarly = r.earlyWakeCount - prev.earlyWakeCount;
			var dComma = r.commaWakeCount - prev.commaWakeCount;
			var dSlept = r.sleptTotal - prev.sleptTotal;
			if (missed > 0) stats.missing += missed;

			if (dWake <= 0 && dSlept <= 0) {
				// Never slept between the two records (awake unit, or one that stays up on mains).
				push('awake', prev.received, awakeEnd);
			} else if (missed > 0) {
				// Lost records: it slept and woke an unknown number of times in between.
				push('unknown', prev.received, awakeStart, missed + ' record' + (missed > 1 ? 's' : '') + ' lost');
			} else {
				var sleepFrom = prev.received, sleepTo = awakeStart;
				push(dComma > 0 ? 'comma' : 'asleep', sleepFrom, sleepTo);
				if (sleepTo > sleepFrom) stats.sleeps.push(sleepTo - sleepFrom);
				stats.earlyWakes += Math.max(dEarly, 0);
				stats.commaWakes += Math.max(dComma, 0);
				// Early (watchdog) and aborted (COMMA re-check) wakes are counted, not timestamped -
				// spread them evenly across the sleep so they show as blips.
				var blips = Math.max(dEarly, 0) + Math.max(dComma, 0);
				for (var b = 1; b <= blips; b++) {
					earlyWakes.push({ time: sleepFrom + (sleepTo - sleepFrom) * b / (blips + 1), kind: b <= Math.max(dEarly, 0) ? 'early' : 'comma' });
				}
			}
		} else if (awakeStart > startSeconds) {
			push('unknown', startSeconds, awakeStart);
		}
		push('awake', awakeStart, awakeEnd);
		if (r.awakeMs > 0) stats.awakes.push(r.awakeMs / 1000);
	}
	if (records.length) push('unknown', records[records.length - 1].received, endSeconds, 'pending');

	return { records: records, segments: segments, earlyWakes: earlyWakes, resets: resets, stats: stats };
}

function hypnogramFormatDuration(sec) {
	sec = Math.round(sec);
	if (sec < 60) return sec + 's';
	if (sec < 3600) return Math.floor(sec / 60) + 'm ' + (sec % 60) + 's';
	return Math.floor(sec / 3600) + 'h ' + Math.floor((sec % 3600) / 60) + 'm';
}

function renderHypnogram(containerId, model, startSeconds, endSeconds) {
	var container = d3.select('#' + containerId);
	container.selectAll('*').remove();
	if (!model.records.length) {
		container.append('div').style('padding', '20px').style('color', '#777')
			.text('No vital signs records in this period yet.');
		return;
	}

	var W = 900, H = 300;
	var margin = { top: 24, right: 50, bottom: 34, left: 120 };
	var w = W - margin.left - margin.right, h = H - margin.top - margin.bottom;

	var svg = container.append('svg')
		.attr('viewBox', '0 0 ' + W + ' ' + H)
		.attr('width', '100%')
		.style('font-size', '11px');
	var g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var x = d3.scaleTime().domain([new Date(startSeconds * 1000), new Date(endSeconds * 1000)]).range([0, w]);
	var levelKeys = HYPNOGRAM_LEVELS.map(function(l) { return l.key; });
	var y = d3.scalePoint().domain(levelKeys).range([0, h * 0.62]).padding(0.5);
	var bandH = y.step() * 0.55;
	var colorOf = {};
	HYPNOGRAM_LEVELS.forEach(function(l) { colorOf[l.key] = l.color; });

	// Level labels and guide lines.
	HYPNOGRAM_LEVELS.forEach(function(l) {
		g.append('line').attr('x1', 0).attr('x2', w).attr('y1', y(l.key)).attr('y2', y(l.key))
			.attr('stroke', '#eee');
		g.append('text').attr('x', -8).attr('y', y(l.key)).attr('dy', '0.35em')
			.attr('text-anchor', 'end').attr('fill', l.color).style('font-weight', 'bold').text(l.label);
	});

	// Unknown stretches (lost records, before a reset, not yet reported) as grey hatching.
	var defs = svg.append('defs');
	var pat = defs.append('pattern').attr('id', containerId + '-hatch').attr('patternUnits', 'userSpaceOnUse')
		.attr('width', 6).attr('height', 6).attr('patternTransform', 'rotate(45)');
	pat.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6).attr('stroke', '#ccc').attr('stroke-width', 2);
	model.segments.filter(function(s) { return s.level === 'unknown'; }).forEach(function(s) {
		g.append('rect').attr('x', x(new Date(s.from * 1000))).attr('width', Math.max(1, x(new Date(s.to * 1000)) - x(new Date(s.from * 1000))))
			.attr('y', 0).attr('height', h * 0.62).attr('fill', 'url(#' + containerId + '-hatch)')
			.append('title').text((s.note || 'No data') + ': ' + hypnogramFormatDuration(s.to - s.from));
	});

	// The hypnogram step line: level bars joined by vertical transitions.
	var known = model.segments.filter(function(s) { return s.level !== 'unknown'; });
	known.forEach(function(s, i) {
		var x0 = x(new Date(s.from * 1000)), x1 = x(new Date(s.to * 1000));
		g.append('rect').attr('x', x0).attr('width', Math.max(1.5, x1 - x0))
			.attr('y', y(s.level) - bandH / 2).attr('height', bandH)
			.attr('fill', colorOf[s.level]).attr('opacity', 0.85)
			.append('title').text(HYPNOGRAM_LEVELS[levelKeys.indexOf(s.level)].label + ' ' +
				hypnogramFormatDuration(s.to - s.from) + '\n' +
				new Date(s.from * 1000).toLocaleTimeString() + ' - ' + new Date(s.to * 1000).toLocaleTimeString());
		var next = known[i + 1];
		if (next && Math.abs(next.from - s.to) <= 2 && next.level !== s.level) {
			g.append('line').attr('x1', x1).attr('x2', x1).attr('y1', y(s.level)).attr('y2', y(next.level))
				.attr('stroke', '#555').attr('stroke-width', 1);
		}
	});

	// Early / aborted wakes: short blips up to the Awake line.
	model.earlyWakes.forEach(function(e) {
		var xe = x(new Date(e.time * 1000));
		g.append('line').attr('x1', xe).attr('x2', xe).attr('y1', y('awake')).attr('y2', y('asleep'))
			.attr('stroke', e.kind === 'early' ? '#f39c12' : '#8e44ad').attr('stroke-width', 1.5).attr('stroke-dasharray', '2,2')
			.append('title').text(e.kind === 'early' ? 'Early (watchdog) wake - time approximate' : 'Aborted wake (battery still low) - time approximate');
	});

	// Resets: red lines through the whole chart.
	model.resets.forEach(function(r) {
		var xr = x(new Date(r.time * 1000));
		g.append('line').attr('x1', xr).attr('x2', xr).attr('y1', -10).attr('y2', h)
			.attr('stroke', '#e74c3c').attr('stroke-width', 2);
		g.append('text').attr('x', xr + 3).attr('y', -12).attr('fill', '#e74c3c').text('RESET ' + (r.reason || ''));
	});

	// Wake voltage underneath, like the SpO2 trace on a sleep study.
	var vPoints = model.records.filter(function(r) { return r.wakeVoltage !== null && r.wakeVoltage > 0; });
	var vTop = h * 0.72, vBottom = h;
	if (vPoints.length) {
		var vExt = d3.extent(vPoints, function(r) { return r.wakeVoltage; });
		if (vExt[1] - vExt[0] < 0.2) { vExt[0] -= 0.1; vExt[1] += 0.1; }
		var yv = d3.scaleLinear().domain(vExt).range([vBottom, vTop]).nice();
		g.append('g').attr('transform', 'translate(' + w + ',0)').call(d3.axisRight(yv).ticks(3));
		g.append('text').attr('x', -8).attr('y', (vTop + vBottom) / 2).attr('dy', '0.35em')
			.attr('text-anchor', 'end').attr('fill', '#27ae60').style('font-weight', 'bold').text('Wake Voltage');
		g.append('path').datum(vPoints)
			.attr('fill', 'none').attr('stroke', '#27ae60').attr('stroke-width', 1.5)
			.attr('d', d3.line().x(function(r) { return x(new Date(r.received * 1000)); }).y(function(r) { return yv(r.wakeVoltage); }));
		g.selectAll('.hyp-v').data(vPoints).enter().append('circle')
			.attr('cx', function(r) { return x(new Date(r.received * 1000)); })
			.attr('cy', function(r) { return yv(r.wakeVoltage); }).attr('r', 2.5).attr('fill', '#27ae60')
			.append('title').text(function(r) { return r.wakeVoltage.toFixed(2) + ' V at ' + new Date(r.received * 1000).toLocaleTimeString(); });
	}

	g.append('g').attr('transform', 'translate(0,' + h + ')')
		.call(d3.axisBottom(x).ticks(8));
}

function hypnogramStatsHtml(model, hours) {
	var s = model.stats;
	var known = s.awakeSeconds + s.asleepSeconds + s.commaSeconds;
	function pct(v) { return known > 0 ? (100 * v / known).toFixed(1) + '%' : '—'; }
	function avg(a) { return a.length ? a.reduce(function(p, c) { return p + c; }, 0) / a.length : 0; }
	var rows = [
		['Records', s.records + (s.missing ? ' (' + s.missing + ' lost)' : '')],
		['Awake', hypnogramFormatDuration(s.awakeSeconds) + ' (' + pct(s.awakeSeconds) + ')'],
		['Asleep', hypnogramFormatDuration(s.asleepSeconds) + ' (' + pct(s.asleepSeconds) + ')'],
		['Low-battery sleep', hypnogramFormatDuration(s.commaSeconds) + ' (' + pct(s.commaSeconds) + ')'],
		['No data', hypnogramFormatDuration(s.unknownSeconds)],
		['Average sleep', s.sleeps.length ? hypnogramFormatDuration(avg(s.sleeps)) : '—'],
		['Average awake', s.awakes.length ? avg(s.awakes).toFixed(1) + 's' : '—'],
		['Early (watchdog) wakes', s.earlyWakes],
		['Aborted wakes (low battery)', s.commaWakes],
		['Resets', s.resets]
	];
	var html = '<table class="table table-striped table-condensed" style="font-size:13px;">';
	rows.forEach(function(r) { html += '<tr><td>' + r[0] + '</td><td><strong>' + r[1] + '</strong></td></tr>'; });
	return html + '</table>';
}

function hypnogramDataHtml(model) {
	var html = '<table class="table table-striped table-condensed text-center" style="font-size:12px;">' +
		'<tr><th>Received</th><th>Seq</th><th>Awake</th><th>Wake Cause</th><th>Drift</th><th>Wakes</th><th>Early</th><th>Aborted</th><th>Wake V</th></tr>';
	model.records.slice().reverse().forEach(function(r) {
		html += '<tr><td>' + new Date(r.received * 1000).toLocaleString() + '</td><td>' + r.resetCount + '/' + r.seq + '</td><td>' +
			(r.awakeMs / 1000).toFixed(1) + 's</td><td>' + r.wakeCause + '</td><td>' + r.drift + 's</td><td>' + r.wakeCount +
			'</td><td>' + r.earlyWakeCount + '</td><td>' + r.commaWakeCount + '</td><td>' +
			(r.wakeVoltage ? r.wakeVoltage.toFixed(2) : '—') + '</td></tr>';
	});
	return html + '</table>';
}

function showHypnogram(telepathonName, hours) {
	var endSeconds = Math.floor(Date.now() / 1000);
	var startSeconds = endSeconds - hours * 3600;
	$('#telepathon-graph-title').html(telepathonName + ' - Hypnogram (' + (hours >= 48 ? (hours / 24) + ' days' : hours + 'h') + ')');
	$('#telepathon-graph').html('<div style="padding:20px;color:#777;">Loading…</div>');
	$('#telepathon-stats').empty();
	$('#telepathon-data').empty();
	$('#telepathon-graph-modal .nav-link').off('click.hyp').on('click.hyp', function(e) {
		e.preventDefault();
		$(this).tab('show');
	});
	$('#telepathon-graph-modal').find('.nav-tabs .nav-link:first').tab('show');
	$('#telepathon-graph-modal').modal('show');
	setTimeout(function() {
		$('#telepathon-graph-modal').css('z-index', 1060);
		$('.modal-backdrop').last().css('z-index', 1055);
	}, 0);

	$.ajax({
		type: 'POST',
		url: '/TeleonomeServlet',
		data: { formName: 'GetTelepathonRecordsForLastHours', telepathonName: telepathonName, hours: hours },
		success: function(res) {
			var rows = (typeof res === 'string') ? JSON.parse(res) : res;
			var model = buildHypnogramModel(rows, startSeconds, endSeconds);
			renderHypnogram('telepathon-graph', model, startSeconds, endSeconds);
			$('#telepathon-stats').html(hypnogramStatsHtml(model, hours));
			$('#telepathon-data').html(hypnogramDataHtml(model));
		},
		error: function(xhr) {
			$('#telepathon-graph').html('<div style="padding:20px;color:#e74c3c;">Could not load records: ' + xhr.status + '</div>');
		}
	});
}

$(document).on('click', '.vital-signs-hypnogram', function() {
	showHypnogram($(this).data('telepathonname'), parseFloat($(this).data('hours')));
});

if (typeof module !== 'undefined') {
	module.exports = { buildHypnogramModel: buildHypnogramModel, hypnogramStatsHtml: hypnogramStatsHtml };
}
