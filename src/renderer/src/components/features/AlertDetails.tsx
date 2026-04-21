import React from 'react';
import { Activity, Sparkles, Trash2 } from 'lucide-react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { VibrationDashboard } from '../VibrationDashboard';
import { Alert } from '../../types';

interface AlertDetailsProps {
  selectedAlertId: string;
  alerts: Alert[];
  onReadAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
  safeOpenRightSidebar: () => void;
  aiPanelOpenRef: React.MutableRefObject<boolean>;
}

export const AlertDetails: React.FC<AlertDetailsProps> = ({
  selectedAlertId, alerts, onReadAlert, onDeleteAlert, safeOpenRightSidebar, aiPanelOpenRef
}) => {
  const alert = alerts.find(a => a.id === selectedAlertId);

  if (!alert) return null;
  return (
    <div className="flex-1 overflow-hidden flex flex-col px-6 pb-6 space-y-4">
      <div className="shrink-0 flex items-center bg-bg-base pt-6 pb-2 justify-between">
         <div className="flex items-center space-x-3">
            <span className="text-[16px] font-bold tracking-wider text-text-primary">告警波形现场快照</span>
            <span className={`px-2 py-0.5 border text-[10px] font-mono font-bold rounded-lg ${alert.level === 'critical' ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-[#ff9500]/10 border-[#ff9500]/30 text-[#ff9500]'}`}>
               等级: {alert.level === 'critical' ? '极高' : '一般'}
            </span>
         </div>
         <div className="flex items-center space-x-2">
            <span className="text-[12px] font-mono text-text-secondary bg-bg-active px-3 py-1 rounded-lg border border-border">编号: {alert.id}</span>
            <button title="永久删除此记录" onClick={() => onDeleteAlert(alert.id)} className="h-[26px] w-[26px] flex items-center justify-center rounded-lg border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-text-secondary hover:text-red-500 transition-colors">
               <Trash2 size={13} />
            </button>
         </div>
      </div>
      
      <div className="w-full flex-[3] min-h-0 border border-border rounded-xl flex flex-col bg-bg-base relative overflow-hidden shadow-sm">
         <div className="absolute inset-0 opacity-[0.03] dark:opacity-5" style={{ backgroundImage: "linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
          <div className="h-8 border-b border-border flex items-center px-3 bg-bg-panel z-10 w-full relative shrink-0 justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-widest flex items-center ${alert.level === 'critical' ? 'text-red-500' : 'text-[#ff9500]'}`}><Activity size={12} className="mr-1.5"/> 触发点畸变序列 (-5s ~ +5s)</span>
            <span className="text-[10px] text-text-secondary font-mono">{alert.time}</span>
         </div>
         <div className="flex-1 flex items-center justify-center relative z-10 w-full h-full">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
               <div className={`h-[1px] w-full shadow-[0_0_8px_rgba(239,68,68,1)] ${alert.level === 'critical' ? 'bg-red-500' : 'bg-[#ff9500]'}`}></div>
            </div>
            {alert.waveSnapshot ? (
               <VibrationDashboard data={alert.waveSnapshot} />
            ) : (
               <div className="text-text-secondary text-[12px] animate-pulse">正在等待黑匣子数据回传...</div>
            )}
         </div>
      </div>

      <div className="w-full flex-1 flex space-x-4 shrink-0 overflow-hidden min-h-[140px]">
         <div className="flex-[2] bg-bg-panel border border-border rounded-xl p-4 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 shrink-0">
               <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest">AI 异常诊断分析</span>
            </div>
            <OverlayScrollbarsComponent className="flex-1 text-[13px] leading-relaxed text-text-primary pr-3 font-mono" options={{ scrollbars: { autoHide: 'leave' } }} defer>
               {alert.aiSummary ? (
                   <>
                       <div className="flex items-center space-x-2 mb-2 text-text-secondary">
                          <span>[{alert.time}]</span>
                          <span className="text-[10px]">T_STAMP: {alert.timestamp}</span>
                       </div>
                       <div className="text-text-primary/90">
                          {alert.aiSummary}
                       </div>
                   </>
               ) : (
                   <div className="text-text-secondary animate-pulse mt-2 flex items-center"><Sparkles size={14} className="mr-2 opacity-50"/> 正在分析波形拓扑特征...</div>
               )}
            </OverlayScrollbarsComponent>
         </div>
         
         <div className="flex-[1] bg-bg-panel border border-border rounded-xl p-5 flex flex-col justify-between min-w-[200px]">
            <span className="text-[11px] font-bold text-text-secondary uppercase tracking-widest shrink-0">设备操作与维护</span>
            <div className="mt-2 flex flex-col gap-2.5 justify-end flex-1">
                <button className="w-full py-2 bg-text-primary text-bg-base font-bold text-[12px] rounded-lg border border-transparent hover:opacity-90 transition-opacity">创建检修工单</button>
               {alert.status === 'unhandled' ? (
                   <button onClick={() => onReadAlert(alert.id)} className="w-full py-2 bg-bg-base text-text-primary font-bold text-[12px] rounded-lg border border-border hover:bg-bg-active transition-colors">标记为已读</button>
               ) : (
                   <button disabled className="w-full py-2 bg-bg-base text-text-secondary font-bold text-[12px] rounded-lg border border-border opacity-50 cursor-not-allowed">已读</button>
               )}
               <button onClick={() => { if(!aiPanelOpenRef.current) safeOpenRightSidebar(); }} className="w-full py-2 bg-bg-base text-text-primary font-bold text-[12px] rounded-lg border border-border hover:bg-bg-active transition-colors flex justify-center items-center">
                 <Sparkles size={12} className="mr-1.5 opacity-70" /> 将错误添加进对话
               </button>
            </div>
         </div>
      </div>
   </div>
  );
};
