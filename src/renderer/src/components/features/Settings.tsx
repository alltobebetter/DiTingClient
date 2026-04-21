import React from 'react';
import { Wifi } from 'lucide-react';
import { SettingsConfig } from '../../types';

interface SettingsProps {
  config: SettingsConfig;
  setConfig: (config: SettingsConfig) => void;
}

export const SettingsPanel: React.FC<SettingsProps> = ({ config, setConfig }) => {
  return (
    <div className="space-y-4 px-2 pb-4 pt-1">
      <div className="space-y-3">
         <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center"><Wifi size={13} className="mr-1.5"/> 设备通信总线配置</span>
         <div className="space-y-1.5">
            <label className="text-[11px] text-text-secondary font-medium">MQTT Broker 地址</label>
            <input value={config.mqttBroker} onChange={e => setConfig({...config, mqttBroker: e.target.value})} className="w-full h-8 bg-bg-base border border-border rounded-lg px-2.5 text-[11px] text-text-primary outline-none focus:border-text-secondary transition-colors font-mono" />
         </div>
         <div className="space-y-1.5 pt-3 border-t border-border mt-3">
            <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center mb-3">监控图表视窗尺寸</span>
            <select 
               value={config.chartWindowSize} 
               onChange={e => setConfig({...config, chartWindowSize: Number(e.target.value)})}
               className="w-full h-8 bg-bg-base border border-border rounded-lg px-2 text-[11px] text-text-primary outline-none focus:border-text-secondary transition-colors font-mono cursor-pointer appearance-none"
            >
               <option value={15}>15 秒 (动态细节)</option>
               <option value={30}>30 秒 (均衡模式默认)</option>
               <option value={60}>1 分钟 (宏观走势)</option>
               <option value={300}>5 分钟 (压缩呈现, 极耗性能)</option>
            </select>
            <div className="text-[10px] text-text-secondary leading-tight mt-1.5 opacity-80">更改视窗大小只影响前端波形裁切和展示密度；底层设备数据仍会自动缓存最多5分钟的历史记录黑匣子以备导出。</div>
         </div>
      </div>
    </div>
  );
};
