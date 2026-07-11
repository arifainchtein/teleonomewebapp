package com.teleonome.webapp.servlet;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.apache.log4j.Logger;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallbackExtended;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.json.JSONArray;
import org.json.JSONObject;

import com.teleonome.framework.TeleonomeConstants;
import com.teleonome.framework.denome.DenomeUtils;
import com.teleonome.framework.denome.Identity;

/**
 * Hybrid data retrieval gateway.
 *
 * Routes each query to the appropriate storage:
 *   - Hippocampus (MQTT, in-memory TreeMap) — for variables the hippocampus
 *     actually tracks, within its configured memory window (default 7 days).
 *   - PostgreSQL — for everything else: variables not tracked by the
 *     hippocampus, date ranges beyond the memory window, remembered DeneWords,
 *     full device reports spanning multiple daily tables.
 *
 * The set of hippocampus-tracked identities is derived from the live denome's
 * Internal:Hippocampus:Data dene.  Call refreshTrackedIdentities() whenever
 * the denome changes (WebAppContextListener already does this on startup).
 */
public class TeleonomeDataGateway {

    private static final String BROKER = "tcp://localhost:1883";
    private static final int TIMEOUT_SECONDS = 30;

    private final Logger logger = Logger.getLogger(getClass());
    private final MqttClient client;
    private final ConcurrentHashMap<String, CompletableFuture<JSONObject>> pending = new ConcurrentHashMap<>();

    // Identity strings the hippocampus has in its short-term memory.
    // Format: "@TeleonomeName:Telepathons:DeneChain:Dene:DeneWord"
    private final Set<String> hippocampusTrackedIdentities = new HashSet<>();

    public TeleonomeDataGateway() throws MqttException {
        String clientId = "WebApp_DataGateway_" + UUID.randomUUID().toString().substring(0, 8);
        client = new MqttClient(BROKER, clientId, new MemoryPersistence());

        MqttConnectOptions opts = new MqttConnectOptions();
        opts.setCleanSession(true);
        opts.setAutomaticReconnect(true);
        opts.setKeepAliveInterval(60);

        client.setCallback(new MqttCallbackExtended() {
            @Override
            public void connectComplete(boolean reconnect, String serverURI) {
                try {
                    client.subscribe(TeleonomeConstants.HEART_TOPIC_HIPPOCAMPUS_RESPONSE + "/#", 1);
                    logger.info("TeleonomeDataGateway connected, subscribed to hippocampus response channel");
                } catch (MqttException e) {
                    logger.warn("TeleonomeDataGateway subscribe failed: " + e.getMessage());
                }
            }

            @Override
            public void connectionLost(Throwable cause) {
                logger.warn("TeleonomeDataGateway MQTT connection lost: " + cause.getMessage());
                pending.forEach((id, f) ->
                        f.completeExceptionally(new RuntimeException("MQTT connection lost")));
                pending.clear();
            }

            @Override
            public void messageArrived(String topic, MqttMessage message) {
                try {
                    JSONObject response = new JSONObject(new String(message.getPayload()));
                    String requestId = response.optString("RequestId", "");
                    CompletableFuture<JSONObject> f = pending.remove(requestId);
                    if (f != null) f.complete(response);
                } catch (Exception e) {
                    logger.warn("TeleonomeDataGateway messageArrived error: " + e.getMessage());
                }
            }

            @Override
            public void deliveryComplete(IMqttDeliveryToken token) {}
        });

        client.connect(opts);
    }

    /**
     * Reads Internal:Hippocampus:Data (a list of device TYPES, e.g. "Chinampa",
     * "Daffodil", "Langley") from the live denome, then discovers which actual
     * telepathon instances are present in that same denome and match one of
     * those types. Builds the set of full dene-pointer prefixes the hippocampus
     * is tracking. Mirrors Hippocampus.absorbPulse()'s dynamic discovery, so a
     * new instance of an already-listed type (e.g. LangleyWest) is routed
     * through MQTT/hippocampus automatically instead of silently falling back
     * to the slower Postgres path. Call this once at startup (and optionally on
     * denome refresh).
     *
     * @param denome        the current denome JSONObject (CurrentPulse)
     * @param teleonomeName the organism name
     */
    public synchronized void refreshTrackedIdentities(JSONObject denome, String teleonomeName) {
        hippocampusTrackedIdentities.clear();
        try {
            Identity dataIdentity = new Identity(teleonomeName,
                    TeleonomeConstants.NUCLEI_INTERNAL,
                    TeleonomeConstants.DENECHAIN_INTERNAL_HIPPOCAMPUS,
                    TeleonomeConstants.DENE_HIPPOCAMPUS_DATA_DENE);
            JSONObject dataDene = DenomeUtils.getDeneByIdentity(denome, dataIdentity);
            JSONArray dataDeneWords = dataDene.getJSONArray("DeneWords");

            Set<String> allowedDeviceTypes = new HashSet<>();
            for (int i = 0; i < dataDeneWords.length(); i++) {
                String deviceType = dataDeneWords.getJSONObject(i)
                        .optString(TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE, "");
                if (!deviceType.isEmpty()) allowedDeviceTypes.add(deviceType);
            }

            JSONArray telepathonChains = DenomeUtils.getAllDeneChainsForNucleus(denome, TeleonomeConstants.NUCLEI_TELEPATHONS);
            for (int t = 0; telepathonChains != null && t < telepathonChains.length(); t++) {
                JSONObject telepathonChain = telepathonChains.getJSONObject(t);
                String telepathonName = telepathonChain.getString(TeleonomeConstants.DENE_NAME_ATTRIBUTE);
                JSONArray telepathonDenes = telepathonChain.optJSONArray("Denes");
                if (telepathonDenes == null) continue;

                String deviceType = null;
                for (int d = 0; d < telepathonDenes.length(); d++) {
                    JSONObject dene = telepathonDenes.getJSONObject(d);
                    if (!TeleonomeConstants.TELEPATHON_DENE_CONFIGURATION.equals(dene.getString(TeleonomeConstants.DENE_NAME_ATTRIBUTE))) continue;
                    JSONArray configWords = dene.optJSONArray("DeneWords");
                    for (int c = 0; configWords != null && c < configWords.length(); c++) {
                        JSONObject cw = configWords.getJSONObject(c);
                        if ("Device Type Id".equals(cw.getString(TeleonomeConstants.DENEWORD_NAME_ATTRIBUTE))) {
                            deviceType = cw.optString(TeleonomeConstants.DENEWORD_VALUE_ATTRIBUTE, null);
                        }
                    }
                }
                if (deviceType == null || !allowedDeviceTypes.contains(deviceType)) continue;

                // The hippocampus stores all non-String/non-long DeneWords of the Purpose dene.
                // We store the dene pointer prefix so isTrackedByHippocampus() can match.
                String denePointer = "@" + teleonomeName + ":" + TeleonomeConstants.NUCLEI_TELEPATHONS
                        + ":" + telepathonName + ":" + TeleonomeConstants.TELEPATHON_DENE_PURPOSE;
                hippocampusTrackedIdentities.add(denePointer);
            }
            logger.info("TeleonomeDataGateway: " + hippocampusTrackedIdentities.size()
                    + " denes tracked by hippocampus: " + hippocampusTrackedIdentities);
        } catch (Exception e) {
            logger.warn("TeleonomeDataGateway: could not read hippocampus tracking config: " + e.getMessage());
        }
    }

    /**
     * Returns true if the full identity (@T:Nucleus:DeneChain:Dene:DeneWord) is
     * one the hippocampus is tracking in short-term memory.
     * Matches by stripping the DeneWord suffix and checking against the tracked dene pointers.
     */
    public boolean isTrackedByHippocampus(String identity) {
        // Strip the last segment (DeneWord name) to get the dene pointer
        int lastColon = identity.lastIndexOf(':');
        if (lastColon < 0) return false;
        String denePointer = identity.substring(0, lastColon);
        return hippocampusTrackedIdentities.contains(denePointer);
    }

    /**
     * Queries the hippocampus in-memory store via MQTT. Blocks until response or timeout.
     *
     * @param identity full identity string (@TeleonomeName:Nucleus:DeneChain:Dene:DeneWord)
     * @param rangeMs  milliseconds of history (hippocampus returns all data within its window)
     * @return JSONObject with keys: Identity, Data (JSONArray), telepathonName, deneWordName
     * @throws TimeoutException if hippocampus does not respond within TIMEOUT_SECONDS
     */
    public JSONObject queryHippocampus(String identity, long rangeMs) throws Exception {
        if (!client.isConnected()) {
            throw new IllegalStateException("TeleonomeDataGateway is not connected to MQTT broker");
        }
        String requestId = UUID.randomUUID().toString();
        CompletableFuture<JSONObject> future = new CompletableFuture<>();
        pending.put(requestId, future);
        try {
            JSONObject payload = new JSONObject();
            payload.put("Identity", identity);
            payload.put("Range", rangeMs);
            payload.put("RequestId", requestId);

            MqttMessage msg = new MqttMessage(payload.toString().getBytes());
            msg.setQos(1);
            client.publish("Hippocampus_Request", msg);
            logger.debug("TeleonomeDataGateway: MQTT request for " + identity);

            return future.get(TIMEOUT_SECONDS, TimeUnit.SECONDS);
        } catch (TimeoutException e) {
            pending.remove(requestId);
            throw new TimeoutException("Hippocampus did not respond within " + TIMEOUT_SECONDS + "s for: " + identity);
        } catch (Exception e) {
            pending.remove(requestId);
            throw e;
        }
    }

    public boolean isConnected() {
        return client != null && client.isConnected();
    }

    public void disconnect() {
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
                client.close();
            }
        } catch (MqttException e) {
            logger.warn("TeleonomeDataGateway disconnect error: " + e.getMessage());
        }
    }
}
