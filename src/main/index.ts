import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { startProbeServer } from './probeServer'
import { createServer as createHttpServer } from 'http'
import { networkInterfaces } from 'os'
import { join } from 'path'
import * as fs from 'fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createServer } from 'net'
import * as ort from 'onnxruntime-node'

let mainWindowRef: BrowserWindow | null = null;
let onnxSession: ort.InferenceSession | null = null;


interface DeviceBaseline {
  embeddings: Float32Array[];
  centroid: Float32Array | null;
  noiseFloor: number;       // P90 百分位噪声地板（替代原 baseMaxDist）
  isPoisoned: boolean;
  calibrationCount: number;
  lastSmoothedScore: number; // EMA 平滑评分状态
}
const deviceBaselines: Record<string, DeviceBaseline> = {};
const MAX_CALIBRATION_FRAMES = 20;   // 校准帧数：10→20，提高基线稳定性
const POISON_VARIANCE_THRESHOLD = 0.8; // 放宽毒化阈值：实测正常帧最大距离可达 0.666
const SCORE_DECAY_K = 3.0;            // 指数衰减系数：deviation=0.5→22分, deviation=1.0→5分
const EMA_ALPHA = 0.35;               // 平滑系数：越小越平滑，0.35 ≈ 3帧响应

function cosineDistance(a: Float32Array, b: Float32Array) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
     dotProduct += a[i] * b[i];
     normA += a[i] * a[i];
     normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 1.0;
  return 1.0 - (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)));
}

async function initOnnxEngine() {
  try {
     const modelPath = join(app.getAppPath(), 'resources', 'models', 'diting-core-v2.onnx');
     const devModelPath = join(__dirname, '../../resources/models/diting-core-v2.onnx');
     const targetPath = fs.existsSync(modelPath) ? modelPath : devModelPath;
     if (fs.existsSync(targetPath)) {
       onnxSession = await ort.InferenceSession.create(targetPath);
       console.log('[AI Core] ONNX Edge Engine Mounted: ', targetPath);
     } else {
       console.warn('[AI Core] Target ONNX model not found: ', targetPath);
     }
  } catch (e) {
     console.error('[AI Core] Failed to load ONNX model:', e);
  }
}

const getStorePath = () => join(app.getPath('userData'), 'ui-state.json');

function readStore() {
  try {
    const p = getStorePath();
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (e) {
    console.error("Failed to read store:", e);
  }
  return {};
}

function writeStore(data: any) {
  try {
    fs.writeFileSync(getStorePath(), JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to write store:", e);
  }
}

function getStoreVal(key: string, defaultVal: any = null) {
  const store = readStore();
  return store[key] !== undefined ? store[key] : defaultVal;
}

function setStoreVal(key: string, val: any) {
  const store = readStore();
  store[key] = val;
  writeStore(store);
}

// --- Per-session chat file storage ---
const getChatDir = () => {
  const dir = join(app.getPath('userData'), 'chats');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

function saveChatSession(session: any) {
  const filePath = join(getChatDir(), `${session.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
}

function loadChatSession(id: string) {
  const filePath = join(getChatDir(), `${id}.json`);
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return null;
}

function deleteChatSession(id: string) {
  const filePath = join(getChatDir(), `${id}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

function listChatSessions(): any[] {
  const dir = getChatDir();
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const sessions: any[] = [];
  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(join(dir, file), 'utf-8'));
      // Return lightweight metadata only (no messages) for the list
      sessions.push({ id: data.id, title: data.title, summary: data.summary, timestamp: data.timestamp, isTitleGenerated: data.isTitleGenerated, messageCount: data.messages?.length || 0 });
    } catch (e) { /* skip corrupt files */ }
  }
  return sessions.sort((a, b) => b.timestamp - a.timestamp);
}

function createWindow(): void {
  const windowState = getStoreVal('windowState', { width: 1080, height: 720, isMaximized: false });
  const bounds = {
    width: windowState.width || 1080,
    height: windowState.height || 720,
    ...(windowState.x !== undefined ? { x: windowState.x } : {}),
    ...(windowState.y !== undefined ? { y: windowState.y } : {})
  };

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: 'rgba(0, 0, 0, 0)', // Make it fully transparent so HTML shows through
      symbolColor: '#f9fafb',    // Default dark theme text
      height: 36
    },
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Listen to React theme toggling to dynamically switch native button colors!
  ipcMain.on('theme-changed', (_, mode) => {
    mainWindow.setTitleBarOverlay({
      symbolColor: mode === 'dark' ? '#f9fafb' : '#111827'
    })
  })

  mainWindowRef = mainWindow;

  const saveBounds = () => {
    if (!mainWindow.isMaximized()) {
      setStoreVal('windowState', { ...mainWindow.getBounds(), isMaximized: false });
    } else {
      const current = getStoreVal('windowState', {});
      setStoreVal('windowState', { ...current, isMaximized: true });
    }
  };

  let boundsDebounce: NodeJS.Timeout;
  const dispatchSaveBounds = () => {
    clearTimeout(boundsDebounce);
    boundsDebounce = setTimeout(saveBounds, 500);
  };

  mainWindow.on('resized', dispatchSaveBounds);
  mainWindow.on('moved', dispatchSaveBounds);
  mainWindow.on('maximize', dispatchSaveBounds);
  mainWindow.on('unmaximize', dispatchSaveBounds);

  let forceQuit = false;
  mainWindow.on('close', (e) => {
    if (!forceQuit) {
      e.preventDefault();
      mainWindow.webContents.send('app-close-requested');
    }
  });

  ipcMain.on('app-close-confirmed', () => {
    forceQuit = true;
    app.quit();
  });

  mainWindow.on('ready-to-show', () => {
    if (windowState.isMaximized) {
      mainWindow.maximize();
    }
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

function startMqttBroker() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Aedes = require('aedes')
  const aedes = Aedes()
  const server = createServer(aedes.handle)
  const port = 1883

  server.listen(port, function () {
    console.log('Aedes MQTT broker started and listening on port ', port)
  })

  // Start WebSocket support for MQTT on port 8883
  const ws = require('websocket-stream')
  const wsServer = createHttpServer()
  ws.createServer({ server: wsServer }, aedes.handle)
  wsServer.listen(8883, () => {
    console.log('Aedes MQTT-WS broker started and listening on port 8883')
  })

  aedes.on('publish', function (packet, client) {
    if (client) {
      if (packet.topic.startsWith('diting/device/')) {
        const payloadStr = packet.payload.toString()
        const parts = packet.topic.split('/');
        const deviceId = parts[2] || 'unknown';
        try {
           const payloadJson = JSON.parse(payloadStr)

           // ============================================================
           // 通道A：Mel频谱推理通道 (melFrame → ONNX → 余弦距离打分)
           // 当传感器或模拟脚本发送完整的128×64 Mel频谱矩阵时触发
           // ============================================================
           if (payloadJson.melFrame && Array.isArray(payloadJson.melFrame) && onnxSession) {
             const melArray = payloadJson.melFrame as number[];
             if (melArray.length === 8192) { // 严格校验: 128 × 64 = 8192
               (async () => {
                 try {
                   const tensorData = new Float32Array(melArray);
                   const tensor = new ort.Tensor('float32', tensorData, [1, 1, 128, 64]);
                   const results = await onnxSession!.run({ 'mel_input': tensor });
                   const embedding = results['embedding_output'].data as Float32Array;

                   // --- DCASE Cosine Distance Baseline Scoring (v2: P90 + ExpDecay + EMA) ---
                   if (!deviceBaselines[deviceId]) {
                     deviceBaselines[deviceId] = { embeddings: [], centroid: null, noiseFloor: 0, isPoisoned: false, calibrationCount: 0, lastSmoothedScore: 100 };
                   }
                   const baseline = deviceBaselines[deviceId];
                   let aiScore = 100;

                   if (baseline.isPoisoned) {
                     aiScore = 0;
                   } else if (baseline.calibrationCount < MAX_CALIBRATION_FRAMES) {
                     // 冷启动建库期：收集正常特征向量
                     baseline.embeddings.push(new Float32Array(embedding));
                     baseline.calibrationCount++;
                     aiScore = 100;

                     if (baseline.calibrationCount === MAX_CALIBRATION_FRAMES) {
                       // 计算质心 (Centroid)
                       const dim = embedding.length;
                       const centroid = new Float32Array(dim);
                       for (const emb of baseline.embeddings) {
                         for (let i = 0; i < dim; i++) centroid[i] += emb[i];
                       }
                       for (let i = 0; i < dim; i++) centroid[i] /= MAX_CALIBRATION_FRAMES;

                       // 计算所有校准帧到质心的距离
                       const dists: number[] = [];
                       for (const emb of baseline.embeddings) {
                         dists.push(cosineDistance(emb, centroid));
                       }
                       dists.sort((a, b) => a - b);

                       // 毒化检测：用最大距离判定
                       const maxDist = dists[dists.length - 1];
                       if (maxDist > POISON_VARIANCE_THRESHOLD) {
                         baseline.isPoisoned = true;
                         console.log(`[AI Core] Calibration REJECTED for ${deviceId} — max dist: ${maxDist.toFixed(6)} > threshold ${POISON_VARIANCE_THRESHOLD}`);
                         aiScore = 0;
                       } else {
                         baseline.centroid = centroid;
                         // 使用 P90 百分位数作为噪声地板（抗离群帧）
                         const p90Index = Math.floor(dists.length * 0.9);
                         baseline.noiseFloor = dists[Math.min(p90Index, dists.length - 1)];
                         console.log(`[AI Core] Baseline locked for ${deviceId} — P90 noise floor: ${baseline.noiseFloor.toFixed(6)}, max: ${maxDist.toFixed(6)}`);
                       }
                       baseline.embeddings = []; // 释放内存
                     }
                   } else if (baseline.centroid) {
                     // 实时推理：余弦距离 → 指数衰减打分 → EMA 平滑
                     const dist = cosineDistance(embedding, baseline.centroid);
                     const deviation = Math.max(0, dist - baseline.noiseFloor);
                     // 指数衰减：deviation=0→100, deviation↑→平滑降至0
                     const rawScore = Math.round(100 * Math.exp(-SCORE_DECAY_K * deviation));
                     // EMA 平滑：防止帧间突跳
                     const smoothed = Math.round(EMA_ALPHA * rawScore + (1 - EMA_ALPHA) * baseline.lastSmoothedScore);
                     baseline.lastSmoothedScore = smoothed;
                     aiScore = Math.max(0, Math.min(100, smoothed));
                   }

                   // 构造转发数据：剥离重型melFrame，只传轻量指标给渲染器
                   const forwardData: any = { score: aiScore };
                   if (payloadJson.wavePoint !== undefined) forwardData.wavePoint = payloadJson.wavePoint;
                   if (payloadJson.latency !== undefined) forwardData.latency = payloadJson.latency;
                   if (payloadJson.bandwidth !== undefined) forwardData.bandwidth = payloadJson.bandwidth;
                   if (payloadJson.uptime !== undefined) forwardData.uptime = payloadJson.uptime;

                   if (mainWindowRef) {
                     mainWindowRef.webContents.send('device-stream', {
                       topic: packet.topic,
                       data: forwardData
                     });
                   }
                 } catch (e) {
                   console.error('[AI Core] Inference error:', e);
                 }
               })();
               return; // melFrame 消息已被推理管线接管，不再走下面的透传通道
             }
           }

           // ============================================================
           // 通道B：透传通道 (wavePoint / score / metrics → 直接转发给渲染器)
           // 当传感器只发送波形点或指标数据时，原样透传用于图表展示
           // 不经过ONNX，不覆写任何字段
           // ============================================================
           if (mainWindowRef) {
             mainWindowRef.webContents.send('device-stream', {
               topic: packet.topic,
               data: payloadJson
             })
           }
        } catch (e) {
           console.log("Failed to parse device payload:", e)
        }
      }
    }
  })
  
  aedes.on('client', function (client) {
    console.log('Client Connected: ' + (client ? client.id : client))
  })
}

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('store-get', (_, key) => getStoreVal(key));
  ipcMain.handle('store-set', (_, key, val) => setStoreVal(key, val));
  ipcMain.handle('store-get-all', () => readStore());

  ipcMain.handle('chat-save', (_, session) => saveChatSession(session));
  ipcMain.handle('chat-load', (_, id) => loadChatSession(id));
  ipcMain.handle('chat-delete', (_, id) => deleteChatSession(id));
  ipcMain.handle('chat-list', () => listChatSessions());

  ipcMain.handle('get-local-ip', () => {
    const interfaces = networkInterfaces()
    for (const name of Object.keys(interfaces)) {
      for (const interfaceInfo of interfaces[name] || []) {
        if (
          !interfaceInfo.internal && 
          interfaceInfo.family === 'IPv4' && 
          !interfaceInfo.address.startsWith('169.254') &&
          !interfaceInfo.address.startsWith('198.18') &&
          !interfaceInfo.address.startsWith('198.19') &&
          !interfaceInfo.address.startsWith('172.16') // Often used by docker/wsl
        ) {
          return interfaceInfo.address
        }
      }
    }
    return '127.0.0.1'
  })

  startMqttBroker()
  startProbeServer()
  initOnnxEngine()
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
