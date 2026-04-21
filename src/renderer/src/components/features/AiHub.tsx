import React from 'react';
import { BrainCircuit, SlidersHorizontal } from 'lucide-react';
import { SettingsConfig } from '../../types';

interface AiHubProps {
  config: SettingsConfig;
  setConfig: (config: SettingsConfig) => void;
}

export const AiHubPanel: React.FC<AiHubProps> = ({ config, setConfig }) => {
  return (
    <div className="space-y-4 px-2 pb-4 pt-1">
      <div className="space-y-3">
         <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center"><BrainCircuit size={13} className="mr-1.5"/> AI 接口配置</span>
         <div className="space-y-1.5">
            <label className="text-[11px] text-text-secondary font-medium">API Base URL</label>
            <input value={config.aiBase} onChange={e => setConfig({...config, aiBase: e.target.value})} placeholder="例: https://dashscope.aliyuncs.com/compatible-mode/v1" className="w-full h-8 bg-bg-base border border-border rounded-lg px-2.5 text-[11px] text-text-primary outline-none focus:border-text-secondary transition-colors font-mono" />
         </div>
         <div className="space-y-1.5">
            <label className="text-[11px] text-text-secondary font-medium">私有大模型 API Key</label>
            <input type="password" value={config.apiKey} onChange={e => setConfig({...config, apiKey: e.target.value})} placeholder="填入以 sk- 开头的调用凭证" className="w-full h-8 bg-bg-base border border-border rounded-lg px-2.5 text-[11px] text-text-primary outline-none focus:border-text-secondary transition-colors font-mono tracking-widest placeholder:tracking-normal placeholder:font-sans" />
         </div>
         <div className="space-y-1.5">
            <label className="text-[11px] text-text-secondary font-medium">大语言模型 (Model Name)</label>
            <input value={config.aiModel} onChange={e => setConfig({...config, aiModel: e.target.value})} placeholder="例如: qwen-max" className="w-full h-8 bg-bg-base border border-border rounded-lg px-2.5 text-[11px] text-text-primary outline-none focus:border-text-secondary transition-colors font-mono" />
         </div>
         
         <div className="mt-2 flex items-center justify-between">
            <label className="text-[11px] text-text-secondary font-medium cursor-pointer select-none" onClick={() => setConfig({...config, useStream: !config.useStream})}>开启流式展现 (打字机效果)</label>
            <div 
              onClick={() => setConfig({...config, useStream: !config.useStream})}
              className={`w-8 h-[18px] flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${config.useStream ? 'bg-text-primary' : 'bg-border/60'}`}
            >
              <div className={`bg-bg-base w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-200 ${config.useStream ? 'translate-x-[14px]' : 'translate-x-0'}`}></div>
            </div>
         </div>

         <div className="mt-2 flex items-center justify-between">
            <label className="text-[11px] text-text-secondary font-medium cursor-pointer select-none" onClick={() => setConfig({...config, autoReport: !config.autoReport})}>启用 AI 自动生成全息事故报告</label>
            <div 
              onClick={() => setConfig({...config, autoReport: !config.autoReport})}
              className={`w-8 h-[18px] flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${config.autoReport ? 'bg-text-primary' : 'bg-border/60'}`}
            >
              <div className={`bg-bg-base w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-200 ${config.autoReport ? 'translate-x-[14px]' : 'translate-x-0'}`}></div>
            </div>
         </div>

      </div>
      
      <div className="h-[1px] w-full bg-border/80 my-2"></div>

      <div className="space-y-3">
         <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest flex items-center"><SlidersHorizontal size={13} className="mr-1.5"/> 边缘端推理配置</span>
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] text-text-secondary font-medium pb-0.5 block">核心判别引擎状态</label>
            <div className={`w-full p-2.5 rounded-xl border flex items-center justify-between group bg-text-primary/5 border-text-primary/40 shadow-sm cursor-default`}>
              <div className="flex flex-col min-w-0 pr-2">
                 <span className={`text-[11px] font-bold truncate transition-colors text-text-primary`}>
                    diting-core-v2.onnx [主进程调度]
                 </span>
                 <span className="text-[9px] text-text-secondary/70 mt-0.5 truncate flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1 text-green-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    边缘算力节点模型 (已在后台硬挂载)
                 </span>
              </div>
              <div className="shrink-0 flex items-center h-full">
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-primary/60"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
            </div>
         </div>
         <div className="space-y-2 mt-3">
            <div className="flex justify-between items-center">
               <label className="text-[11px] text-text-secondary font-medium">异常告警触发阈值</label>
               <span className={`text-[11px] font-mono font-bold ${config.inferenceThreshold < 75 ? 'text-red-500' : 'text-[#ff9500]'}`}>{config.inferenceThreshold} 分</span>
            </div>
            <input type="range" min="50" max="99" value={config.inferenceThreshold} onChange={e => setConfig({...config, inferenceThreshold: parseInt(e.target.value)})} className="w-full h-1 bg-border rounded outline-none cursor-pointer accent-text-primary" />
            <p className="text-[10px] text-text-secondary/70 opacity-90 leading-relaxed pt-1">
              设定值越低系统越敏感，但也可能导致环境中微弱波动产生的误报增多。
            </p>
         </div>
      </div>
    </div>
  );
};
