const mqtt = require("mqtt");
const { INDIClient, getProperties, enableBLOB, mapping, newSwitchVector, newTextVector, newNumberVector } = require("indi-client");
const winston = require("winston");
const config = require("./config"); // Import configuration

// Configure the Winston logger
const logger = winston.createLogger({
  level: config.LOG_LEVEL, // Set the log level as needed
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}] ${message}`;
    })
  ),
  transports: [new winston.transports.Console()], // You can add more transports if needed
});

const mqttOptions = {
  username: config.MQTT_USERNAME,
  password: config.MQTT_PASSWORD,
};

const brokerURL = config.MQTT_BROKER_URL;
const indiHost = config.INDI_HOST;
const indiPort = config.INDI_PORT;
const baseMqttTopic = config.MQTT_BASE_TOPIC;

const indiClient = new INDIClient(indiHost, indiPort);

indiClient.on("connect", () => {
  logger.info("INDI connection connected");
  indiClient.getProperties();
  indiClient.enableBLOB(null, null, "Also"); // Get blobs as well as everything else.
});

indiClient.on("close", () => {
  logger.info("INDI connection closed");
});

indiClient.connect();

const mqttClient = mqtt.connect(brokerURL, mqttOptions);

Object.keys(mapping).forEach((key) => {
  indiClient.on(key, (obj) => {
    let topic = `${baseMqttTopic}/${obj.device}`;

    if (obj.name) topic += `/${obj.name}`;

    topic += `/${key}`;

    mqttClient.publish(topic, JSON.stringify(obj));
    logger.debug(`Published MQTT message on topic: ${topic}`);
  });
});

mqttClient.on("connect", () => {
  mqttClient.subscribe(`${baseMqttTopic}/+/+`, (err) => {
    if (err) {
      logger.error(`Error subscribing to MQTT topic: ${err.message}`);
    } else {
      logger.info("Connected to MQTT broker");
    }
  });
});

const handleMqttMessage = (topic, message) => {
  const topicSuffix = topic.split("/").pop();
  let obj;

  switch (topicSuffix) {
    case "newTextVector":
      obj = newTextVector.fromJSON(JSON.parse(message));
      break;
    case "newSwitchVector":
      obj = newSwitchVector.fromJSON(JSON.parse(message));
      break;
    case "newNumberVector":
      obj = newNumberVector.fromJSON(JSON.parse(message));
      break;
    case "getProperties":
      obj = getProperties.fromJSON(JSON.parse(message));
      break;
    case "enableBLOB":
      obj = enableBLOB.fromJSON(JSON.parse(message));
      break;
    default:
      break;
  }

  if (obj) {
    indiClient.send(obj);
    logger.debug(`Received and processed MQTT message on topic: ${topic}`);
  }
};

mqttClient.on("message", handleMqttMessage);

// Handle shutdown signals
const signals = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGTERM: 15,
};

const shutdown = (signal, value) => {
  logger.info("Shutdown signal received. Shutting down...");
  indiClient.close();
  mqttClient.end();
};

Object.keys(signals).forEach((signal) => {
  process.on(signal, () => {
    logger.info(`Process received a ${signal} signal`);
    shutdown(signal, signals[signal]);
  });
});

