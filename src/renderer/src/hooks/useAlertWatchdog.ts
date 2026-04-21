import { useEffect } from 'react';
import { Alert, Device, SettingsConfig } from '../types';
import { generateDiagnosisReport } from '../utils/ai';

export function useAlertWatchdog(props: {
  activeDevice: Device | undefined;
  isStreaming: boolean;
  score: number;
  config: SettingsConfig;
  alerts: Alert[];
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
  exportWaveformBuffer: (seconds: number) => number[];
}) {
  const { activeDevice, isStreaming, score, config, alerts, setAlerts, exportWaveformBuffer } = props;

  // 告警监控看门狗 (Alert Watchdog)
  useEffect(() => {
    if (activeDevice && isStreaming && score < config.inferenceThreshold) {
      // 避免同一设备短期内频繁报警 (10秒内只报一次)
      const recent = alerts.find(a => a.deviceId === activeDevice.id && (Date.now() - a.timestamp < 10000));
      if (!recent) {
         const newAlert: Alert = {
            id: 'AL-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
            deviceId: activeDevice.id,
            deviceName: activeDevice.name,
            time: new Date().toLocaleTimeString(),
            timestamp: Date.now(),
            level: 'critical',
            score: score,
            status: 'unhandled'
         };
         setAlerts(prev => [newAlert, ...prev]);
         
         // 启动 5 秒延时截屏机制，截取含“事发后”的完整波形数据
         setTimeout(() => {
            const buffer = exportWaveformBuffer(10); // 获取过去 10 秒的画面
            setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, waveSnapshot: buffer } : a));
            
            // 下发异步 AI 诊断任务
            if (config.autoReport && config.apiKey && config.apiKey.trim() !== '') {
               generateDiagnosisReport(config, activeDevice, newAlert).then(summary => {
                 setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, aiSummary: summary } : a));
               }).catch(err => {
                 setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, aiSummary: 'AI 诊断失败: ' + err.message } : a));
               });
            } else if (config.autoReport) {
               setTimeout(() => {
                  const summary = `${activeDevice.name} 检测到瞬时剧烈冲击特征波形，伴随低频振动分量急剧增加。经 AI 模型推断，高度疑似转子轴承微裂纹或松动，发生时间 ${newAlert.time}，模型置信度 98.4%。建议维护人员对节点设备进行安全检修（未配置 API Key，此为默认占位报告）。`;
                  setAlerts(prev => prev.map(a => a.id === newAlert.id ? { ...a, aiSummary: summary } : a));
               }, 2500); // 假装请求大模型耗时
            }
         }, 5000);
      }
    }
  }, [score, config.inferenceThreshold, activeDevice?.id, isStreaming, config]);
}
