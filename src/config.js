// config.js
module.exports = {
  MQTT_USERNAME: process.env.MQTT_USERNAME,
  MQTT_PASSWORD: process.env.MQTT_PASSWORD,
  MQTT_BROKER_URL: process.env.MQTT_BROKER_URL || "mqtt://127.0.0.1",
  INDI_HOST: process.env.INDI_HOST || "127.0.0.1",
  INDI_PORT: process.env.INDI_PORT ? parseInt(process.env.INDI_PORT) : 7624,
  MQTT_BASE_TOPIC: process.env.MQTT_BASE_TOPIC || "indi/data",
  LOG_LEVEL: process.env.LOG_LEVEL || "info"
};

