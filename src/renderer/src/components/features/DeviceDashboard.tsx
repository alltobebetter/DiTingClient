import React, { useState } from 'react';
import { VibrationDashboard } from '../VibrationDashboard';
import { Device } from '../../types';
import { Play, Pause, Save } from 'lucide-react';

interface DeviceDashboardProps {
  activeDevice: Device | undefined;
  waveData: number[];
  score: number;
  latency: string;
  bandwidth: string;
  uptime: string;
  isPaused: boolean;
  pauseStream: () => void;
  resumeStream: () => void;
  onOpenExport: () => void;
}

export const DeviceDashboard: React.FC<DeviceDashboardProps> = ({
  activeDevice, waveData, score, latency, bandwidth, uptime,
  isPaused, pauseStream, resumeStream, onOpenExport
}) => {
  const [frozenStatus, setFrozenStatus] = useState<string | null>(null);

  React.useEffect(() => {
    if (isPaused && frozenStatus === null && activeDevice) {
      setFrozenStatus(activeDevice.status);
    } else if (!isPaused) {
      setFrozenStatus(null);
    }
  }, [isPaused, activeDevice?.status]);

  if (!activeDevice) return null;

  return (
    <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col space-y-4">
      <div className="shrink-0 flex items-center pt-6 pb-2 justify-between bg-bg-base">
        <div className="flex items-center space-x-3">
          <span className="text-[16px] font-bold tracking-wider">{activeDevice.name}</span>
          <span className="text-[10px] bg-bg-active font-mono text-text-secondary px-2 py-0.5 border border-border">ID: {activeDevice.id}</span>
        </div>
      </div>
      <div className="w-full h-[60%] border border-border rounded-xl flex flex-col bg-bg-base relative overflow-hidden shadow-sm">
         <div className="absolute inset-0 opacity-[0.03] dark:opacity-5" style={{ backgroundImage: "linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
          <div className="h-8 border-b border-border flex items-center justify-between px-3 bg-bg-panel z-10 w-full relative shrink-0">
            <span className="text-[11px] text-text-secondary uppercase flex items-center">
               实时主轴振动包络波形
            </span>
            
            <div className="flex items-center space-x-1.5">
               {(isPaused || activeDevice.status !== 'online') && (
                  <button 
                     onClick={onOpenExport}
                     title="保存波形快照"
                     className="flex items-center justify-center p-1.5 rounded transition-colors text-text-secondary hover:text-text-primary hover:bg-bg-active"
                  >
                     <Save size={14} />
                  </button>
               )}
               {activeDevice.status === 'online' && (
                  <button 
                     onClick={isPaused ? resumeStream : pauseStream}
                     title={isPaused ? "恢复实时监控" : "暂停图表更新"}
                     className="flex items-center justify-center p-1.5 rounded transition-colors text-text-secondary hover:text-text-primary hover:bg-bg-active"
                  >
                     {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                  </button>
               )}
            </div>
         </div>
         <div className="flex-1 flex items-center justify-center relative w-full h-full">
            <VibrationDashboard data={waveData} />

            {waveData.length === 0 && (
               <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                 <div className="flex flex-col items-center space-y-2 opacity-50 px-4 py-2 bg-bg-base/30 backdrop-blur-[1px] border border-border rounded shadow-sm">
                   {activeDevice.status === 'online' && !isPaused ? (
                     <>
                       <div className="w-4 h-4 border-2 border-text-secondary border-t-text-primary rounded-full animate-spin"></div>
                       <span className="text-text-secondary text-[11px] tracking-widest font-bold">等待波形数据传入...</span>
                     </>
                   ) : (
                     <span className="text-text-secondary text-[11px] tracking-widest font-bold">暂无波形数据</span>
                   )}
                 </div>
               </div>
            )}
         </div>
      </div>
      
      <div className="w-full flex-1 border border-border rounded-xl flex divide-x divide-border bg-bg-base overflow-hidden shadow-sm">
         <div className="flex-[2] flex flex-col justify-center p-6 relative overflow-hidden">
            <span className="text-xs text-text-secondary uppercase tracking-wider mb-2 font-semibold">健康状态综合预估 (健康度打分)</span>
            <div className="flex items-baseline space-x-2">
               <span className={`text-5xl font-bold font-mono tracking-tight truncate ${score < 50 ? 'text-red-500' : 'text-text-primary'}`}>{score}</span>
               <span className="text-xl font-mono text-text-secondary truncate">/ 100</span>
            </div>
            <div className="w-3/4 max-w-sm h-2 bg-border mt-4 overflow-hidden shrink-0">
               <div 
                  className={`h-full transition-all duration-300 ${score < 50 ? 'bg-red-500' : 'bg-text-primary'}`}
                  style={{ width: `${score}%` }}
               ></div>
            </div>
         </div>
         <div className="flex-1 flex flex-col justify-center p-6 relative min-w-[150px]">
            <span className="text-xs text-text-secondary uppercase tracking-wider mb-2 font-semibold">边缘网络吞吐标定</span>
            <div className="overflow-y-auto space-y-1">
              <div className="flex justify-between items-center text-[13px] py-1 border-b border-border/50">
                <span className="text-text-secondary truncate pr-2">信道握手延迟</span>
                <span className="font-mono text-text-primary font-medium shrink-0">{latency} ms</span>
              </div>
              <div className="flex justify-between items-center text-[13px] py-1 border-b border-border/50">
                <span className="text-text-secondary truncate pr-2">瞬时带宽频宽</span>
                <span className="font-mono text-text-primary font-medium shrink-0">{bandwidth} KB/s</span>
              </div>
              <div className="flex justify-between items-center text-[13px] py-1">
                <span className="text-text-secondary truncate pr-2">硬件通电时长</span>
                <span className="font-mono text-text-primary font-medium shrink-0">{(isPaused && frozenStatus !== null ? frozenStatus : activeDevice.status) === 'online' ? uptime : '离线'}</span>
              </div>
            </div>
         </div>
      </div>
    </div>
  );
};
