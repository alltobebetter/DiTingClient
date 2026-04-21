import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

function getValidMobileDevices(): string[] {
  try {
    const storePath = join(app.getPath('userData'), 'ui-state.json')
    if (existsSync(storePath)) {
      const state = JSON.parse(readFileSync(storePath, 'utf-8'))
      if (Array.isArray(state.devices)) {
        return state.devices.filter((d: any) => d.type === 'mobile').map((d: any) => d.id)
      }
    }
  } catch (e) {
    console.error('[ProbeServer] Config store read error:', e)
  }
  return []
}

export function startProbeServer() {
  // 预加载 mqtt.min.js 到内存，后续直接吐出去
  let mqttBrowserBundle = ''
  try {
    mqttBrowserBundle = readFileSync(
      join(__dirname, '../../node_modules/mqtt/dist/mqtt.min.js'),
      'utf-8'
    )
  } catch {
    console.error('[ProbeServer] Failed to load mqtt browser bundle from node_modules')
  }

  const probeServer = createServer((req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`)

    // 本地托管 mqtt.min.js
    if (url.pathname === '/mqtt.min.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' })
      res.end(mqttBrowserBundle)
      return
    }

    // 探针主页面: 动态匹配根级路由视为设备ID (如 http://x.x.x.x:3000/FAN0-XR)
    if (url.pathname !== '/' && url.pathname !== '/favicon.ico') {
      const deviceId = decodeURIComponent(url.pathname.slice(1))
      
      // 鉴权拦截
      const validIds = getValidMobileDevices()
      if (!validIds.includes(deviceId)) {
        res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' })
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width,initial-scale=1.0">
              <title>Access Denied - DiTing Gateway</title>
              <style>
                body{background:#0f172a;color:#f87171;font-family:monospace;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;padding:2rem;text-align:center;}
                h2{font-size:1.5rem;margin-bottom:1rem;color:#ef4444;}
                p{color:#94a3b8;font-size:0.9rem;}
              </style>
            </head>
            <body>
              <h2>HTTP 403: Node Access Refused</h2>
              <p>The identifier <strong>[ ${deviceId} ]</strong> is not authorized or not registered as a legitimate mobile probe.</p>
            </body>
          </html>
        `)
        return
      }

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(buildProbeHTML(deviceId))
      return
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>DiTing Edge IoT Probe Service</h1><p>Please navigate to the specific device route.</p>')
  })

  probeServer.listen(3000, '0.0.0.0', () => {
    console.log('[ProbeServer] Mobile Probe Web Server started on http://0.0.0.0:3000')
  })
}

function buildProbeHTML(deviceId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">
  <title>谛听 - ${deviceId}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="/mqtt.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      --bg-base: #111827;
      --bg-panel: #1f2937;
      --text-primary: #f9fafb;
      --text-secondary: #9ca3af;
      --border-color: #4b5563;
      background: var(--bg-base);
      color: var(--text-primary);
      font-family: "Noto Serif SC", "Source Han Serif SC", "SimSun", serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100vw;
      overflow: hidden;
      padding: 1.5rem;
    }
    
    .container {
      width: 100%;
      max-width: 320px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header {
      text-align: center;
    }
    .title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 6px;
    }
    .badge {
      font-size: 13px;
      color: var(--text-secondary);
      font-family: 'JetBrains Mono', ui-monospace, monospace;
    }

    .wave-container {
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      display: flex;
      align-items: flex-end;
      padding: 16px;
      gap: 3px;
      height: 90px;
    }
    .wave-container .bar {
      flex: 1;
      background: var(--border-color);
      border-radius: 1px;
      min-height: 2px;
      transition: height 0.05s linear;
    }
    .wave-container.active .bar {
      background: #34d399;
    }

    .status-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-secondary);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--border-color);
    }
    .status-dot.active { background: #34d399; }
    .status-dot.error  { background: #f87171; }

    .action-btn {
      width: 100%;
      height: 48px;
      font-family: inherit;
      font-size: 15px;
      font-weight: 700;
      background: var(--text-primary);
      color: var(--bg-base);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .action-btn:active { opacity: 0.8; }
    .action-btn.stop {
      background: var(--bg-panel);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">数据采集探针</div>
      <div class="badge">${deviceId}</div>
    </div>

    <div class="wave-container" id="wave"></div>

    <div class="status-row">
      <div class="status-dot" id="indicator"></div>
      <span id="statusText">就绪准备开启</span>
    </div>

    <button class="action-btn" id="btn">开始采集</button>
  </div>

  <script>
    const DEVICE_ID = '${deviceId}';
    let streaming = false, client = null, t = 0, startTs = 0;
    let currentAcc = {x:0, y:0, z:0};
    let sendLoop = null;
    
    const btn = document.getElementById('btn');
    const statusText = document.getElementById('statusText');
    const waveEl = document.getElementById('wave');
    const indicator = document.getElementById('indicator');

    for(let i=0; i<24; i++){
      const b=document.createElement('div');
      b.className='bar'; 
      waveEl.appendChild(b);
    }
    const bars = waveEl.querySelectorAll('.bar');

    btn.onclick = async () => {
      if (!streaming) {
        if (typeof DeviceMotionEvent!=='undefined' && typeof DeviceMotionEvent.requestPermission==='function') {
           try { 
             const p = await DeviceMotionEvent.requestPermission(); 
             if(p!=='granted'){ 
               statusText.innerText = '需要运动传感器权限'; 
               indicator.className = 'status-dot error';
               return; 
             } 
           } catch(e){}
        }
        statusText.innerText = '连接服务器中...';
        const wsUrl = 'ws://'+location.hostname+':8883';
        client = mqtt.connect(wsUrl, { protocolVersion: 4 });
        
        client.on('connect', () => {
          streaming = true; startTs = Date.now();
          indicator.className = 'status-dot active';
          waveEl.className = 'wave-container active';
          btn.innerText = '停止采集';
          btn.classList.add('stop');
          statusText.innerText = '采集中...';
          
          window.addEventListener('devicemotion', ev => {
             const a = ev.accelerationIncludingGravity || ev.acceleration;
             if (a) currentAcc = a;
          });
          
          sendLoop = setInterval(() => {
            if (!streaming || !client) return;
            t++;
            const now = Date.now();
            let localAccSum = ((currentAcc.x||0)+(currentAcc.y||0)+(currentAcc.z||0));
            
            // 加入模拟工业振动（基频+谐波+随机底噪），让应用端拿到真实的波形效果
            let synthWave = Math.sin(t * 0.15) * 25 + Math.sin(t * 0.33) * 15 + (Math.random() * 16 - 8);
            let wp = (localAccSum * 5) + synthWave; 
            
            for(let i=0; i<bars.length-1; i++){
              bars[i].style.height = bars[i+1].style.height;
            }
            bars[bars.length - 1].style.height = Math.max(2, Math.min(58, Math.abs(wp * 2))) + 'px';
            
            const payload = { wavePoint: wp };
            if (t % 10 === 0) {
              payload.latency = (Math.random() * 2 + 5.1).toFixed(1);
              payload.bandwidth = (Math.random() * 1.5 + 0.8).toFixed(1);
              const s = Math.floor((now - startTs) / 1000), m = Math.floor(s / 60);
              payload.uptime = m > 0 ? m + 'm ' + (s % 60) + 's' : (s % 60) + 's';
            }
            client.publish('diting/device/'+DEVICE_ID+'/stream', JSON.stringify(payload));
          }, 50);
        });

        client.on('error', err => {
          indicator.className = 'status-dot error';
          statusText.innerText = '服务器连接失败';
        });
      } else {
        streaming = false;
        indicator.className = 'status-dot';
        waveEl.className = 'wave-container';
        btn.innerText = '开始采集';
        btn.classList.remove('stop');
        statusText.innerText = '已暂停';
        if (sendLoop) clearInterval(sendLoop);
        bars.forEach(b => b.style.height='2px');
        if(client) client.end();
      }
    };
  </script>
</body>
</html>`;
}
