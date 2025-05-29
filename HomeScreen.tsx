import React, { useEffect, useState, useContext } from 'react';
import { UserContext } from './userContext';
import GetLocation from 'react-native-get-location';
import init from 'react_native_mqtt';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert, Text, TouchableOpacity} from 'react-native';
import Navigation from './Navigation';

import {StatusBar, StyleSheet, useColorScheme, View} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

init({
  size: 10000,
  storageBackend: AsyncStorage,
  defaultExpires: 1000 * 3600 * 24,
  enableCache: true,
  reconnect: true,
  sync: {},
});

const HomeScreen = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';

  const { user, token, refreshUser, setUser, loading } = useContext(UserContext);
  const [location, setLocation] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [mqttClient, setMqttClient] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    const loadDeviceId = async () => {
      let id = await AsyncStorage.getItem('deviceId');
      if (!id) {
        id = 'device_' + Math.random().toString(36).substring(2, 10);
        await AsyncStorage.setItem('deviceId', id);
      }
      setDeviceId(id);
    };
    loadDeviceId();
  }, []);

  const fetchLocation = () => {
    GetLocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 60000,
    })
      .then(location => {
        setLocation({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      })
      .catch(error => {
        const {code, message} = error;
        console.warn('Location error:', code, message);
      });
  };

  useEffect(() => {
    if (authChecked) {
      fetchLocation();
    }
  }, [authChecked]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (mqttClient && location && mqttClient.isConnected()) {
        publishLocation(mqttClient, location);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [mqttClient, location]);

  useEffect(() => {
    if (!authChecked) {return;}

    const host = '100.76.67.50';
    const wsPort = 9001;
    const clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);

    try {
      const client = new Paho.MQTT.Client(host, wsPort, clientId);

      client.onConnectionLost = responseObject => {
        if (responseObject.errorCode !== 0) {
          console.log('onConnectionLost:' + responseObject.errorMessage);
          setConnectionStatus(`Disconnected: ${responseObject.errorMessage}`);
        }
      };

      client.onMessageArrived = message => {
        console.log('onMessageArrived:' + message.payloadString);
      };

      client.connect({
        onSuccess: () => {
          console.log('Connected to MQTT broker');
          setConnectionStatus('Connected ✅');
          client.subscribe('location/updates');
          if (location) {
            publishLocation(client, location);
          }
        },
        onFailure: err => {
          console.error('MQTT connection failed:', err);
          setConnectionStatus(`Connection failed: ${err.errorMessage}`);
        },
        useSSL: false,
      });

      setMqttClient(client);
    } catch (error) {
      console.error('MQTT setup error:', error);
      setConnectionStatus(`Setup error: ${error.message}`);
    }

    return () => {
      if (mqttClient && mqttClient.isConnected()) {
        mqttClient.disconnect();
      }
    };
  }, [authChecked]);

  useEffect(() => {
    if (mqttClient && location && mqttClient.isConnected()) {
      publishLocation(mqttClient, location);
    }
  }, [location, mqttClient]);

  useEffect(() => {
    const reconnectInterval = setInterval(() => {
      if (
        mqttClient &&
        !mqttClient.isConnected() &&
        connectionStatus.startsWith('Disconnected')
      ) {
        console.log('🔁 Attempting auto-reconnect to MQTT...');
        reconnect();
      }
    }, 10000);

    return () => clearInterval(reconnectInterval);
  }, [mqttClient, connectionStatus]);

  const publishLocation = async (client, locationData) => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (client && client.isConnected() && deviceId && userId) {
        const message = new Paho.MQTT.Message(
          JSON.stringify({
            deviceId: deviceId,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            timestamp: new Date().toISOString(),
            user: userId,
          }),
        );
        message.destinationName = 'device/location';
        client.send(message);
        console.log('Location published to MQTT');
      } else {
        console.warn('Missing MQTT connection, deviceId, or user');
        console.log(userId);
      }
    } catch (err) {
      console.error('Napaka pri pošiljanju lokacije:', err);
    }
  };

  const handleLogout = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');

      if (userId) {
        await fetch('http://100.76.67.50:3001/users/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({userId}),
        });

        //await AsyncStorage.removeItem('userId');
      }

      await AsyncStorage.removeItem('token');
      setUser(null);

      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } catch (err) {
      console.error('Napaka pri odjavi:', err);
      Alert.alert('Napaka', 'Pri odjavi je prišlo do napake.');
    }
  };

  const reconnect = () => {
    const host = '100.76.67.50';
    const wsPort = 9001;
    const clientId = 'mqttjs_' + Math.random().toString(16).substr(2, 8);

    try {
      const client = new Paho.MQTT.Client(host, wsPort, clientId);

      client.onConnectionLost = responseObject => {
        if (responseObject.errorCode !== 0) {
          console.log('onConnectionLost:' + responseObject.errorMessage);
          setConnectionStatus(`Disconnected: ${responseObject.errorMessage}`);
        }
      };

      client.onMessageArrived = message => {
        console.log('onMessageArrived:' + message.payloadString);
      };

      client.connect({
        onSuccess: () => {
          console.log('Reconnected to MQTT broker');
          setConnectionStatus('Connected ✅');
          client.subscribe('location/updates');
          if (location) {
            publishLocation(client, location);
          }
        },
        onFailure: err => {
          console.error('MQTT connection failed:', err);
          setConnectionStatus(`Connection failed: ${err.errorMessage}`);
        },
        useSSL: false,
      });

      setMqttClient(client);
    } catch (error) {
      console.error('MQTT reconnect error:', error);
      setConnectionStatus(`Reconnect error: ${error.message}`);
    }
  };

  // Show loading screen while authentication is being checked
  if (loading || !authChecked) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
      }}>
        <Text style={{ color: isDarkMode ? 'white' : 'black' }}>
          Loading...
        </Text>
      </View>
    );
  }

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    padding: '5%',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <View style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />

      <View
        style={{
          backgroundColor: isDarkMode ? '#333' : '#fff',
          borderRadius: 12,
          padding: 20,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 5,
          width: '100%',
          maxWidth: 400,
          alignItems: 'center',
        }}>
        <Text
          style={{
            color: isDarkMode ? '#b0d16b' : '#b0d16b',
            fontSize: 20,
            fontWeight: 'bold',
            marginBottom: 10,
          }}>
          MQTT Status
        </Text>
        <Text
          style={{
            color: isDarkMode ? 'white' : 'black',
            fontSize: 16,
            marginBottom: 20,
            textAlign: 'center',
          }}>
          {connectionStatus}
        </Text>

        <Text
          style={{
            color: isDarkMode ? '#66ccff' : '#003366',
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 10,
          }}>
          Your Location
        </Text>
        <Text
          style={{
            color: isDarkMode ? 'white' : 'black',
            fontSize: 16,
            textAlign: 'center',
          }}>
          {location
            ? `Latitude: ${location.latitude}\nLongitude: ${location.longitude}`
            : 'Fetching your location...'}
        </Text>

        <View
          style={{
            marginTop: 20,
            width: '100%',
            backgroundColor: '#b0d16b',
            color: '#FFFFFF',
            borderRadius: 15,
          }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#b0d16b',
              padding: 10,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={() => fetchLocation()}>
            <Text
              style={{
                color: 'white',
                fontSize: 16,
                fontWeight: 'bold',
              }}>
              Reload Location
            </Text>
          </TouchableOpacity>
        </View>

        {connectionStatus.startsWith('Disconnected') && (
          <View style={{marginTop: 20, width: '100%'}}>
            <TouchableOpacity
              style={{
                backgroundColor: '#ff6347',
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={reconnect}>
              <Text
                style={{
                  color: 'white',
                  fontSize: 16,
                  fontWeight: 'bold',
                }}>
                Reconnect
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <View style={{marginTop: 20, width: '100%'}}>
        <TouchableOpacity
          style={{
            backgroundColor: '#888',
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={handleLogout}>
          <Text
            style={{
              color: 'white',
              fontSize: 16,
              fontWeight: 'bold',
            }}>
            Odjava
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;
