import React, { useEffect, useState } from "react";
import GetLocation from "react-native-get-location";
import init from "react_native_mqtt";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Button } from "react-native";

import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Platform,
} from "react-native";
import { Colors } from "react-native/Libraries/NewAppScreen";

init({
  size: 10000,
  storageBackend: AsyncStorage,
  defaultExpires: 1000 * 3600 * 24,
  enableCache: true,
  reconnect: true,
  sync: {},
});

const App = (): React.JSX.Element => {
  const isDarkMode = useColorScheme() === "dark";
  const [location, setLocation] = useState<null | {
    latitude: number,
    longitude: number,
  }>(null);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [mqttClient, setMqttClient] = useState(null);

  useEffect(() => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 60000,
    })
      .then((location) => {
        setLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      })
      .catch((error) => {
        const { code, message } = error;
        console.warn("Location error:", code, message);
      });
  }, []);
  useEffect(() => {
    const interval = setInterval(() => {
      if (mqttClient && location && mqttClient.isConnected()) {
        publishLocation(mqttClient, location);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [mqttClient, location]);
  useEffect(() => {
    const host = "164.8.211.101";

    const port = 1883;

    const wsPort = 9001;
    const protocol = "wss://";

    const clientId = "mqttjs_" + Math.random().toString(16).substr(2, 8);

    try {
      const client = new Paho.MQTT.Client(host, wsPort, clientId);

      client.onConnectionLost = (responseObject) => {
        if (responseObject.errorCode !== 0) {
          console.log("onConnectionLost:" + responseObject.errorMessage);
          setConnectionStatus(`Disconnected: ${responseObject.errorMessage}`);
        }
      };

      client.onMessageArrived = (message) => {
        console.log("onMessageArrived:" + message.payloadString);
      };

      client.connect({
        onSuccess: () => {
          console.log("Connected to MQTT broker");
          setConnectionStatus("Connected");
          client.subscribe("location/updates");
          if (location) {
            publishLocation(client, location);
          }
        },
        onFailure: (err) => {
          console.error("MQTT connection failed:", err);
          setConnectionStatus(`Connection failed: ${err.errorMessage}`);
        },
        useSSL: false,
      });

      setMqttClient(client);
    } catch (error) {
      console.error("MQTT setup error:", error);
      setConnectionStatus(`Setup error: ${error.message}`);
    }
    return () => {
      if (mqttClient && mqttClient.isConnected()) {
        mqttClient.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (mqttClient && location && mqttClient.isConnected()) {
      publishLocation(mqttClient, location);
    }
  }, [location, mqttClient]);

  const publishLocation = (client, locationData) => {
    if (client && client.isConnected()) {
      const message = new Paho.MQTT.Message(
        JSON.stringify({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          timestamp: new Date().toISOString(),
        }),
      );
      message.destinationName = "device/location";
      client.send(message);
      console.log("Location published to MQTT");
    }
  };

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    padding: "5%",
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <View style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <Text
        style={{
          color: isDarkMode ? "white" : "black",
          fontSize: 18,
          marginBottom: 20,
        }}
      >
        MQTT Status: {connectionStatus}
      </Text>

      <Text style={{ color: isDarkMode ? "white" : "black", fontSize: 18 }}>
        {location
          ? `Latitude: ${location.latitude}\nLongitude: ${location.longitude}`
          : "Fetching your location..."}
      </Text>
    </View>
  );
};

export default App;
