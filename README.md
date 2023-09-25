# indi-mqtt-bridge

A bridge between INDI and MQTT.

## Running

```bash
git clone https://github.com/rickbassham/indi-mqtt-bridge.git
cd indi-mqtt-bridge
docker build -t indi-mqtt-bridge:latest .
docker run \
    -e INDI_HOST=host.docker.internal \
    -e MQTT_USERNAME=USERNAME \
    -e MQTT_PASSWORD=PASSWORD \
    -e INDI_PORT=7624 \
    -e MQTT_BROKER_URL=mqtt://host.docker.internal \
    -it indi-mqtt-bridge:latest
```

It is also possible to send the log level to Docker run
 
``` -e LOG_LEVEL=debug ```
