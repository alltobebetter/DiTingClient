import { useState, useEffect, useRef, useCallback } from 'react';

const HZ = 20; // assumed 50ms packet interval
const MAX_HISTORY_SECONDS = 300; // 5 mins
const MAX_BUFFER_POINTS = MAX_HISTORY_SECONDS * HZ;
const HEARTBEAT_TIMEOUT_MS = 1000; // 1秒无数据即判定为断联
const TRANSITION_DURATION_MS = 400; // 视窗切换缓动时长

interface StreamPacket {
  score?: number;
  latency?: string;
  bandwidth?: string;
  wavePoint?: number;
  uptime?: string;
  [key: string]: any;
}

export const useMqttStream = (deviceId: string, active: boolean = true, windowSizeSeconds: number = 30) => {
  const [metrics, setMetrics] = useState({
    score: 100, // 默认初始分数为 100（健康满分），避免第一帧波形接入但分数尚未到达时触发 0 分报警
    latency: '0.0',
    bandwidth: '0.0',
    uptime: '--'
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [globalOnlineMap, setGlobalOnlineMap] = useState<Record<string, boolean>>({});
  
  const lastPacketTimeRef = useRef<number>(0);
  const allPacketsTimeRef = useRef<Record<string, number>>({});
  const wasHiddenRef = useRef(false);

  const historyBufferRef = useRef<number[]>([]);
  const isPausedRef = useRef(false);

  const [waveData, setWaveData] = useState<number[]>([]);

  const expectedTopicRef = useRef('');

  // 视窗切换平滑过渡控制
  const effectiveWindowRef = useRef(windowSizeSeconds);
  const animFrameRef = useRef<number>(0);
  const isTransitioningRef = useRef(false);

  // 依赖外部控制的暂停/恢复操作
  const pauseStream = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
  }, []);

  const resumeStream = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    // 恢复时立即快进到最新的时间窗口数据
    const visiblePoints = Math.round(effectiveWindowRef.current * HZ);
    setWaveData([...historyBufferRef.current.slice(-visiblePoints)]);
  }, []);

  const exportWaveformBuffer = useCallback((durationSeconds: number) => {
    const points = durationSeconds * HZ;
    return historyBufferRef.current.slice(-points);
  }, []);
  
  useEffect(() => {
    expectedTopicRef.current = `diting/device/${deviceId}/stream`;
    
    // Clear buffer when switching active devices (NOT when window size changes)
    if (active && deviceId) {
       historyBufferRef.current = [];
       setWaveData([]);
       setIsStreaming(false);
       lastPacketTimeRef.current = 0;
       if (!isPausedRef.current) {
         setIsPaused(false);
       }
    }
  }, [deviceId, active]);

  // 当外部动态调整窗口大小时，启动平滑过渡动画
  useEffect(() => {
    const startWindow = effectiveWindowRef.current;
    const targetWindow = windowSizeSeconds;

    // 无需过渡的情况：值相同、暂停中、或没有数据
    if (startWindow === targetWindow || isPausedRef.current || historyBufferRef.current.length === 0) {
      effectiveWindowRef.current = targetWindow;
      return;
    }

    isTransitioningRef.current = true;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / TRANSITION_DURATION_MS, 1);
      // easeOutCubic: 快速启动，平滑减速
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentWindow = startWindow + (targetWindow - startWindow) * eased;
      effectiveWindowRef.current = currentWindow;

      const visiblePoints = Math.round(currentWindow * HZ);
      const history = historyBufferRef.current;
      setWaveData([...history.slice(-visiblePoints)]);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // 动画完成，锁定到目标值
        effectiveWindowRef.current = targetWindow;
        isTransitioningRef.current = false;
      }
    };

    cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      isTransitioningRef.current = false;
      effectiveWindowRef.current = targetWindow;
    };
  }, [windowSizeSeconds]);

  useEffect(() => {
    // 监听窗口可见性变化，防止后台节流导致的误判断连
    const handleVisibility = () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
      } else {
        // 窗口切回来时，刷新时间戳避免误判超时
        if (wasHiddenRef.current) {
          lastPacketTimeRef.current = Date.now();
          wasHiddenRef.current = false;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleDeviceStream = (_event: any, payload: { topic: string, data: StreamPacket }) => {
      const parts = payload.topic.split('/');
      if (parts.length >= 3 && parts[0] === 'diting' && parts[1] === 'device') {
         const incomingId = parts[2];
         allPacketsTimeRef.current[incomingId] = Date.now();
         setGlobalOnlineMap(prev => prev[incomingId] ? prev : { ...prev, [incomingId]: true });
      }

      if (payload.topic === expectedTopicRef.current) {
        const d = payload.data;
        const now = Date.now();
        
        // 如果两次包的间隔超过了超时时间（说明刚刚经历了断连），此时收到的包意味着【重新连接】
        // 需要强制清空遗留黑匣子，避免前后不同时段的数据僵硬地粘合在一起
        // 但如果窗口刚从后台切回来，跳过此检测（Chromium后台节流会制造假超时）
        if (!wasHiddenRef.current && lastPacketTimeRef.current > 0 && now - lastPacketTimeRef.current > HEARTBEAT_TIMEOUT_MS) {
           historyBufferRef.current = [];
           if (!isPausedRef.current) setWaveData([]);
        }
        
        lastPacketTimeRef.current = now;
        setIsStreaming(true);
        
        if (!isPausedRef.current) {
          if (d.score !== undefined || d.latency !== undefined || d.bandwidth !== undefined || d.uptime !== undefined) {
             setMetrics(prev => ({
               score: d.score !== undefined ? d.score : prev.score,
               latency: d.latency !== undefined ? d.latency : prev.latency,
               bandwidth: d.bandwidth !== undefined ? d.bandwidth : prev.bandwidth,
               uptime: d.uptime !== undefined ? d.uptime : prev.uptime
             }));
          }
        }

        if (d.wavePoint !== undefined) {
           // 1. 无脑压入底层的黑匣子缓冲区，永不停止
           historyBufferRef.current.push(d.wavePoint as number);
           if (historyBufferRef.current.length > MAX_BUFFER_POINTS) {
             historyBufferRef.current.shift();
           }

           // 2. 过渡动画进行中时，让动画帧独占 waveData 控制权
           //    否则正常按当前有效窗口切片
           if (!isPausedRef.current && !isTransitioningRef.current) {
             setWaveData(() => {
                const visiblePoints = Math.round(effectiveWindowRef.current * HZ);
                const history = historyBufferRef.current;
                return history.slice(-visiblePoints);
             });
           }
        }
      }
    };

    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.removeAllListeners('device-stream');
      window.electron.ipcRenderer.on('device-stream', handleDeviceStream);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (window.electron && window.electron.ipcRenderer) {
        window.electron.ipcRenderer.removeAllListeners('device-stream');
      }
    };
  }, []); // 不再依赖 windowSizeSeconds，改用 effectiveWindowRef 实时读取

  useEffect(() => {
    if (!active || !deviceId) {
      if (!isPausedRef.current) {
        setWaveData([]);
        historyBufferRef.current = [];
      }
      setIsStreaming(false);
      lastPacketTimeRef.current = 0;
    }

    const heartbeatCheck = setInterval(() => {
      const now = Date.now();
      if (lastPacketTimeRef.current > 0 && now - lastPacketTimeRef.current > HEARTBEAT_TIMEOUT_MS) {
        if (isStreaming) {
          setIsStreaming(false);
          // 在这里我们不再清空黑匣子！让用户保留查看最后现场的权利
        }
      }
      setGlobalOnlineMap(prev => {
        let changed = false;
        let newMap = { ...prev };
        for (const id in allPacketsTimeRef.current) {
           const isOnline = now - allPacketsTimeRef.current[id] <= HEARTBEAT_TIMEOUT_MS;
           if (prev[id] !== isOnline) {
             changed = true;
             newMap[id] = isOnline;
           }
        }
        return changed ? newMap : prev;
      });
    }, 500);

    return () => clearInterval(heartbeatCheck);
  }, [active, deviceId]);

  return { ...metrics, waveData, isStreaming, globalOnlineMap, isPaused, pauseStream, resumeStream, exportWaveformBuffer };
}
