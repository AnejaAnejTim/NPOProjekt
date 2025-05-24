#!/bin/bash
docker stop mosquitto
docker stop mongodb
docker stop node
docker stop node

docker rm mosquitto 
docker rm mongodb
docker rm node
docker network rm skupnoomrezje

docker build -t node -f DockerfileNode .
docker build -t mosquitto-custom -f DockerfileMosquitto .

docker network create skupnoomrezje || echo "Network already exists"

docker run -d --name mongodb --network skupnoomrezje mongo

docker run -d --name mosquitto --network skupnoomrezje -p 1883:1883 -p 9001:9001 mosquitto-custom

docker run -d --name node --network skupnoomrezje -p 3000:3000 node

echo "Node.js server on port 3000"
echo "MQTT broker on port 1883"

