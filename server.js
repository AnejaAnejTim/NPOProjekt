require('dotenv').config();
const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const Location = mongoose.model('Location', {
  deviceId: String,
  latitude: Number,
  longitude: Number,
  timestamp: Date,
  user: Schema.Types.ObjectId
});

app.use(cors());
app.use(express.json());

const client = mqtt.connect('mqtt://100.117.101.70:1883');

client.on('connect', () => {
  console.log('📡 Povezan na MQTT broker');
  client.subscribe('device/location');
});

const activeDevices = new Map();

client.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const { deviceId, latitude, longitude, timestamp, user } = data;
    await Location.create({
      deviceId,
      latitude,
      longitude,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      user
    });
    activeDevices.set(deviceId, Date.now());
  } catch (err) {
    console.error('Napaka pri obdelavi sporočila:', err.message);
  }
});

setInterval(() => {
  const now = Date.now();
  for (const [deviceId, lastSeen] of activeDevices.entries()) {
    if (now - lastSeen > 20 * 1000) {
      activeDevices.delete(deviceId);
    }
  }
}, 60 * 1000);

app.get('/api/locations', async (req, res) => {
  const data = await Location.find().sort({ timestamp: -1 }).limit(100);
  res.json(data);
});

app.get('/api/active-devices', (req, res) => {
  res.json({ count: activeDevices.size, devices: Array.from(activeDevices.keys()) });
});

app.listen(PORT, () => {
  console.log(`🚀 Server teče na http://localhost:${PORT}`);
});

