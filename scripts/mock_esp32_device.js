const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

// The device ID matching the one in the React UI
const DEVICE_ID = process.argv[2] || 'FAN-XR-9';
const BROKER_URL = 'mqtt://127.0.0.1:1883';

console.log(`[ESP32 Simulator] Booting device: ${DEVICE_ID}`);
console.log(`[ESP32 Simulator] Connecting to broker at ${BROKER_URL}...`);

let dataset = null;
try {
  dataset = JSON.parse(fs.readFileSync(path.join(__dirname, 'mock_mel_dataset.json'), 'utf8'));
  console.log(`[ESP32 Simulator] Loaded realistic Mel dataset (${dataset.length} frames)`);
} catch (e) {
  console.error('[ESP32 Simulator] Warning: mock_mel_dataset.json not found! AI channel will be idle.');
}

const client = mqtt.connect(BROKER_URL, { protocolVersion: 4 });

client.on('connect', () => {
  console.log(`[ESP32 Simulator] Connected successfully as ${DEVICE_ID}!`);
  
  // Topic to stream live data
  const streamTopic = `diting/device/${DEVICE_ID}/stream`;
  
  let timeOffset = 0;
  let frameIndex = 0;
  const startTime = Date.now();
  
  // Simulate high-frequency 50ms wave streaming payload
  setInterval(() => {
    timeOffset += 1;
    
    let wavePoint = Math.sin(timeOffset * 0.2) * 15 + Math.sin(timeOffset * 0.8) * 5 + (Math.random() * 8 - 4);
    
    // Random spikes (anomalies) visually for the chart
    if (Math.random() > 0.98) {
       wavePoint += (Math.random() > 0.5 ? 45 : -45); 
    }

    const payload = {
      wavePoint,
    };
    
    // Periodically send metric updates (latency, bandwidth, uptime) every ~500ms
    if (timeOffset % 10 === 0) {
       payload.latency = (Math.random() * 2 + 2.1).toFixed(1);
       payload.bandwidth = (Math.random() * 2.5 + 0.8).toFixed(1);
       
       // Calculate uptime since device "powered on"
       const elapsed = Math.floor((Date.now() - startTime) / 1000);
       const mins = Math.floor(elapsed / 60);
       const secs = elapsed % 60;
       payload.uptime = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
    }

    // AI Trigger Channel: Bind the heavy realistic mel-spectrogram frame every 1s (20 ticks)
    if (timeOffset % 20 === 0 && dataset) {
        const frame = dataset[frameIndex];
        payload.melFrame = frame.melFrame;
        // console.log(`[ESP32 Simulator] Transmitting real Mel frame ${frameIndex} (${frame.type}) for AI Inference!`);
        frameIndex = (frameIndex + 1) % dataset.length;
    }
    
    client.publish(streamTopic, JSON.stringify(payload));
  }, 50); // 50ms frequency
  
  console.log(`[ESP32 Simulator] Started streaming to ${streamTopic}`);
});

client.on('error', (err) => {
  console.error('[ESP32 Simulator] Connection error:', err);
  client.end();
});
