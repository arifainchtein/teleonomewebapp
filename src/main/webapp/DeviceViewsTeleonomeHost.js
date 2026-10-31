// The Teleonome's side of deviceviews (2026-10-31, DevicesDigitalStables design doc §18). The device cards,
// detail popups and charts now live in the deviceviews library (/deviceviews/*.js, from the deviceviews jar),
// shared with devices.digitalstables.com; this file tells it how to reach this Teleonome's data.
// Loaded after RenderingEngine.js and before HeartComms.js.

// Device type: from the live TelepathonStatus packets (more reliable than the denome's value).
DeviceViewsHost.deviceType = function(name) {
	return telepathonDeviceTypeCache[name] || '';
};

// The last pulse, for devices whose telepathon has no "Local Time".
DeviceViewsHost.pulseTimeMs = function() {
	return pulseTimestampMilliseconds;
};

// Cerebellum values (Daffodil's battery SOC and ledger).
DeviceViewsHost.setting = function(telepathonName, deneWordName) {
	return getCerebellumDeneWordValue(telepathonName, deneWordName);
};

// This Teleonome's own logos, as before.
DeviceViewsHost.logoUrl = function(deviceType) {
	return 'images/' + deviceType + '.svg';
};

// History from the Hippocampus: one Hippocampus_Request, answered on this browser's response channel and
// handed back by displayHippocampusResponse through deviceViewsTakeHistoryResponse. Answers carry the
// telepathon and dene word but not the range, so requests for the same pair are answered in order.
var deviceViewsPendingHistory = {};
var DEVICE_VIEWS_HISTORY_TIMEOUT_MS = 30000;

DeviceViewsHost.fetchHistory = function(req, callback) {
	var nucleus = req.nucleus || NUCLEI_TELEPATHONS;
	var identity = "@" + teleonomeName + ":" + nucleus + ":" + req.telepathon + ":" + req.dene + ":" + req.deneWord;
	var key = req.telepathon + ":" + req.deneWord;
	(deviceViewsPendingHistory[key] = deviceViewsPendingHistory[key] || []).push({
		callback: callback,
		expires: Date.now() + DEVICE_VIEWS_HISTORY_TIMEOUT_MS
	});
	var message = new Paho.MQTT.Message(JSON.stringify({ "Identity": identity, "Range": req.range, "RequestId": browserId }));
	message.destinationName = "Hippocampus_Request";
	message.qos = 1;
	console.log("Requesting memory for: " + identity);
	mqtt.send(message);
};

// True when the answer belonged to a deviceviews request (and was handed to it).
function deviceViewsTakeHistoryResponse(telepathonName, deneWordName, data) {
	var key = telepathonName + ":" + deneWordName;
	var queue = deviceViewsPendingHistory[key];
	if (!queue) return false;
	var now = Date.now();
	while (queue.length && queue[0].expires < now) queue.shift();
	var pending = queue.shift();
	if (!queue.length) delete deviceViewsPendingHistory[key];
	if (!pending) return false;
	pending.callback(data);
	return true;
}
