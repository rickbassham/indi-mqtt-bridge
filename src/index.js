const mqtt = require("mqtt");

const {
  getProperties,
  enableBLOB,
  mapping,
  newSwitchVector,
  newTextVector,
  newNumberVector,
  INDIClient,
} = require("indi-client");

const brokerURL = process.env.MQTT_BROKER_URL || "mqtt://127.0.0.1";
const indiHost = process.env.INDI_HOST || "127.0.0.1";
const indiPort = process.env.INDI_PORT ? parseInt(process.env.INDI_PORT) : 7624;

const indiClient = new INDIClient(indiHost, indiPort);

indiClient.on("connect", () => {
  console.log("indi connection connected");

  indiClient.getProperties();
  indiClient.enableBLOB(null, null, "Also"); // Get blobs as well as everything else.
})

indiClient.on("close", () => {
  console.log("indi connection closed");
})

indiClient.connect();

const mqttClient = mqtt.connect(brokerURL);

Object.keys(mapping).forEach(key => {
  indiClient.on(key, (obj) => {
    let topic = `indi/data/${obj.device}`;

    if (obj.name) topic += `/${obj.name}`;

    topic += `/${key}`;

    mqttClient.publish(topic, JSON.stringify(obj));
  })
});

mqttClient.on("connect", () => {
  mqttClient.subscribe("indi/commands/+", (err) => {
    if (err)
      console.error(err);
  });
});

mqttClient.on("message", (topic, message) => {
  if (topic.endsWith("newTextVector")) {
    const obj = newTextVector.fromJSON(JSON.parse(message));
    indiClient.send(obj);
  } else if (topic.endsWith("newSwitchVector")) {
    const obj = newSwitchVector.fromJSON(JSON.parse(message));
    indiClient.send(obj);
  } else if (topic.endsWith("newNumberVector")) {
    const obj = newNumberVector.fromJSON(JSON.parse(message));
    indiClient.send(obj);
  } else if (topic.endsWith("getProperties")) {
    const obj = getProperties.fromJSON(JSON.parse(message));
    indiClient.send(obj);
  } else if (topic.endsWith("enableBLOB")) {
    const obj = enableBLOB.fromJSON(JSON.parse(message));
    indiClient.send(obj);
  }
});

// The signals we want to handle
// NOTE: although it is tempting, the SIGKILL signal (9) cannot be intercepted and handled
var signals = {
  'SIGHUP': 1,
  'SIGINT': 2,
  'SIGTERM': 15
};

// Do any necessary shutdown logic for our application here
const shutdown = (signal, value) => {
  console.log("shutdown!");

  indiClient.close();
  mqttClient.end();
};

// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    console.log(`process received a ${signal} signal`);
    shutdown(signal, signals[signal]);
  });
});
