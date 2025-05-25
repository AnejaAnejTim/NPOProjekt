#!/bin/bash
docker stop mosquitto
docker rm mosquitto 

docker build -t mosquitto-custom -f DockerfileMosquitto .

docker run -d --name mosquitto -p 1883:1883 -p 9001:9001 mosquitto-custom

echo "MQTT broker on port 1883"

