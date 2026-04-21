import React, { useState } from 'react';
import { Plus, Search, Settings, Trash2, Monitor, Bell } from 'lucide-react';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { Device, Alert, SettingsConfig, Ticket } from '../../types';
import { SettingsPanel } from '../features/Settings';
import { AiHubPanel } from '../features/AiHub';

interface SecondaryPanelProps {
  theme: 'light' | 'dark' | 'system';
  leftWidth: number;
  activeMenu: string;
  sidebarOpen: boolean;
  activeWorkspace: string;
  searchMode: string;
  alerts: Alert[];
  tickets: Ticket[];
  devices: Device[];
  selectedAlertId: string;
  selectedTicketId: string;
  selectedDeviceId: string;
  config: SettingsConfig;
  isDraggingLeft: boolean;
  setIsAdding: (val: boolean) => void;
  setSearchMode: (val: 'threshold' | 'semantic' | 'replay') => void;
  setActiveWorkspace: (val: 'dashboard' | 'search' | 'alert-details' | 'ticket-details') => void;
  setSelectedAlertId: (id: string) => void;
  setSelectedTicketId: (id: string) => void;
  setSelectedDeviceId: (id: string) => void;
  setConfig: (config: SettingsConfig) => void;
  handleDeleteDevice: (id: string, e: React.MouseEvent) => void;
  handleEditDevice: (device: Device, e: React.MouseEvent) => void;
  setActiveMenu: (menu: string) => void;
}

export const SecondaryPanel: React.FC<SecondaryPanelProps> = ({
  theme, leftWidth, activeMenu, sidebarOpen, activeWorkspace, alerts, tickets, devices,
  selectedAlertId, selectedTicketId, selectedDeviceId, config, isDraggingLeft,
  setIsAdding, setActiveWorkspace, setSelectedAlertId, setSelectedTicketId, setSelectedDeviceId, setConfig, handleDeleteDevice, handleEditDevice
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div 
      className={`bg-bg-panel border-border shrink-0 flex flex-col relative overflow-hidden ${isDraggingLeft ? '' : 'transition-all duration-300 ease-in-out'} ${sidebarOpen && activeMenu ? 'border-r' : 'border-r-0'}`}
      style={{ width: (sidebarOpen && activeMenu) ? leftWidth : 0 }}
    >
      <div className="h-10 border-b border-border flex items-center justify-between px-4 shrink-0 bg-bg-base overflow-hidden" style={{ minWidth: leftWidth }}>
         <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase whitespace-nowrap">
            {activeMenu === 'monitor' ? '监控总览' : activeMenu === 'alerts' ? '异常告警中心' : activeMenu === 'tickets' ? '诊断与工单归档' : activeMenu === 'settings' ? '设置' : activeMenu === 'ai_hub' ? 'AI 引擎决策核心' : '全局资产检索'}
         </span>
         {activeMenu === 'monitor' && (
            <button title="接入新物联网节点" onClick={() => setIsAdding(true)} className="text-text-secondary hover:text-text-primary transition-colors">
              <Plus size={14} />
            </button>
         )}
      </div>
      
      <OverlayScrollbarsComponent 
         className="flex-1 w-full"
         options={{ 
           scrollbars: { theme: theme === 'dark' ? 'os-theme-light' : 'os-theme-dark', autoHide: 'scroll' },
           overflow: { x: 'hidden' }
         }} 
         defer
      >
         <div className="p-2 space-y-1.5 shrink-0" style={{ width: leftWidth }}>
             {activeMenu === 'settings' ? (
                 <SettingsPanel config={config} setConfig={setConfig} />
             ) : activeMenu === 'ai_hub' ? (
                 <AiHubPanel config={config} setConfig={setConfig} />
             ) : activeMenu === 'alerts' ? (
                <div className="space-y-2">
                  {alerts.map(alert => {
                     const isSelected = selectedAlertId === alert.id && activeWorkspace === 'alert-details';
                     return (
                       <div 
                         key={alert.id}
                         onClick={() => { setSelectedAlertId(alert.id); setActiveWorkspace('alert-details'); }}
                         className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-bg-active border-text-primary/30 shadow-sm' : 'bg-bg-panel border-border hover:border-text-secondary opacity-80 hover:opacity-100'}`}
                       >
                          <div className="flex justify-between items-center mb-1">
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg shadow-sm ${alert.level === 'critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-[#ff9500]/10 text-[#ff9500] border border-[#ff9500]/20'}`}>
                               {alert.score} 分
                             </span>
                             <span className="text-[10px] font-mono text-text-secondary">{alert.time}</span>
                          </div>
                          <div className="text-[12px] font-semibold text-text-primary mt-2 truncate w-full">{alert.deviceName}</div>
                          <div className="flex justify-between items-end mt-1.5">
                             <span className="text-[10px] text-text-secondary truncate block font-mono">{alert.id}</span>
                             {alert.status === 'unhandled' ? (
                               <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50"></span>
                             ) : (
                               <span className="text-[10px] text-text-secondary">已读</span>
                             )}
                          </div>
                       </div>
                     )
                  })}
                  {alerts.length === 0 && (
                     <div className="mt-8 flex flex-col items-center justify-center space-y-2 opacity-40">
                        <span className="text-[10px] tracking-widest font-mono">暂无异常告警</span>
                     </div>
                  )}
                </div>
             ) : activeMenu === 'tickets' ? (
                 <div className="space-y-2 pb-6">
                   {tickets.map(ticket => {
                      const isSelected = selectedTicketId === ticket.id && activeWorkspace === 'ticket-details';
                      return (
                        <div 
                          key={ticket.id}
                          onClick={() => { setSelectedTicketId(ticket.id); setActiveWorkspace('ticket-details'); }}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-bg-active border-text-primary/30 shadow-sm' : 'bg-bg-panel border-border hover:border-text-secondary opacity-80 hover:opacity-100'}`}
                        >
                           <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg shadow-sm bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                AI 归档
                              </span>
                              <span className="text-[10px] font-mono text-text-secondary">{new Date(ticket.timestamp).toLocaleTimeString()}</span>
                           </div>
                           <div className="text-[12px] font-semibold text-text-primary mt-2 truncate w-full">{ticket.title}</div>
                           <div className="flex justify-between items-end mt-1.5">
                              <span className="text-[10px] text-text-secondary truncate block font-mono">{ticket.id}</span>
                           </div>
                        </div>
                      )
                   })}
                   {tickets.length === 0 && (
                      <div className="mt-8 flex flex-col items-center justify-center space-y-2 opacity-40">
                         <span className="text-[10px] tracking-widest font-mono">暂无工单生成</span>
                      </div>
                   )}
                 </div>
             ) : activeMenu === 'search' ? (
                <div className="flex flex-col h-full">
                   <div className="sticky top-0 bg-bg-panel z-10 pb-2 px-1">
                     <div className="flex items-center w-full bg-bg-base border border-border px-3 py-2 focus-within:border-text-primary transition-colors shadow-[0_0_10px_rgba(0,0,0,0.05)]">
                        <Search size={14} className="text-text-secondary mr-2 shrink-0 opacity-70" />
                        <input 
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                           type="text" 
                           placeholder="搜索设备名称或ID..." 
                           className="w-full bg-transparent text-[11px] text-text-primary outline-none font-mono tracking-widest placeholder:text-text-secondary placeholder:opacity-50"
                           autoFocus
                        />
                     </div>
                   </div>
                   <div className="mt-2 space-y-1.5 flex-1 pb-4">
                     {searchQuery.trim() === '' ? (
                       <div className="mt-12 flex flex-col items-center justify-center space-y-3 opacity-30 select-none">
                          <Search size={32} strokeWidth={1} />
                          <span className="text-[10px] uppercase font-semibold text-text-secondary">搜索就绪</span>
                       </div>
                     ) : (
                       <>
                         {devices.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase())).map((device) => {
                           const isSelected = selectedDeviceId === device.id && activeWorkspace === 'dashboard';
                           return (
                             <div 
                               key={`dev-${device.id}`}
                               onClick={() => { setSelectedDeviceId(device.id); setActiveWorkspace('dashboard'); }} 
                               className={`group relative flex items-center justify-between mx-1.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'bg-bg-active border border-border shadow-sm text-text-primary' : 'border border-transparent text-text-secondary hover:bg-bg-panel hover:border-border hover:text-text-primary'}`}
                             >
                                <div className="flex items-center space-x-3 overflow-hidden w-full">
                                   <div className={`shrink-0 flex items-center justify-center w-6 h-6 rounded border border-border bg-bg-base shadow-sm`}>
                                      <Monitor size={12} className="opacity-70" />
                                   </div>
                                   <div className="flex flex-col min-w-0 flex-1">
                                      <div className="flex items-center space-x-2">
                                         <span className="text-[12px] font-semibold tracking-wide truncate">{device.name}</span>
                                         <span className={`shrink-0 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-[4px] uppercase leading-none bg-text-primary/10 text-text-primary/70`}>节点</span>
                                      </div>
                                      <span className="text-[10px] opacity-60 font-mono truncate tracking-tight">{device.id}</span>
                                   </div>
                                </div>
                             </div>
                           );
                         })}
                         {alerts.filter(a => a.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) || a.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) || a.id.toLowerCase().includes(searchQuery.toLowerCase())).map(alert => {
                           const isSelected = selectedAlertId === alert.id && activeWorkspace === 'alert-details';
                           return (
                             <div 
                               key={`alt-${alert.id}`}
                               onClick={() => { setSelectedAlertId(alert.id); setActiveWorkspace('alert-details'); }}
                               className={`group relative flex items-center justify-between mx-1.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'bg-bg-active border border-border shadow-sm text-text-primary' : 'border border-transparent text-text-secondary hover:bg-bg-panel hover:border-border hover:text-text-primary'}`}
                             >
                                <div className="flex items-center space-x-3 overflow-hidden w-full">
                                   <div className={`shrink-0 flex items-center justify-center w-6 h-6 rounded border border-border bg-bg-base shadow-sm`}>
                                      <Bell size={12} className={`${alert.level === 'critical' ? 'text-red-500' : 'text-[#ff9500]'}`} />
                                   </div>
                                   <div className="flex flex-col min-w-0 flex-1">
                                      <div className="flex items-center space-x-2">
                                         <span className="text-[12px] font-semibold tracking-wide truncate">{alert.deviceName}</span>
                                         <span className={`shrink-0 text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-[4px] uppercase leading-none ${alert.level === 'critical' ? 'bg-red-500/10 text-red-500' : 'bg-[#ff9500]/10 text-[#ff9500]'}`}>异常</span>
                                      </div>
                                      <span className="text-[10px] opacity-60 font-mono truncate tracking-tight">编号: {alert.id}</span>
                                   </div>
                                </div>
                             </div>
                           );
                         })}
                         {devices.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && 
                          alerts.filter(a => a.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) || a.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) || a.id.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                            <div className="mt-8 flex flex-col items-center justify-center space-y-2 opacity-40">
                               <span className="text-[10px] tracking-widest font-mono">未找到相关资源</span>
                            </div>
                         )}
                       </>
                     )}
                   </div>
                </div>
             ) : (
             <>
             {devices.map((device) => {
               const isSelected = selectedDeviceId === device.id && activeWorkspace === 'dashboard';
               return (
                 <div 
                   key={device.id} 
                   onClick={() => { setSelectedDeviceId(device.id); setActiveWorkspace('dashboard'); }} 
                   className={`group relative flex items-center justify-between mx-1.5 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ${isSelected ? 'bg-bg-active/80 text-text-primary' : 'text-text-secondary hover:bg-bg-active/40 hover:text-text-primary'}`}
                 >
                    {/* Linear Style Active indicator bar */}
                    {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-text-primary rounded-r-md shadow-[0_0_8px_rgba(255,255,255,0.15)]" />}

                    <div className="flex items-center space-x-3.5 overflow-hidden w-full">
                       {/* Halo status indicator */}
                       <div className={`shrink-0 relative flex items-center justify-center w-3.5 h-3.5 rounded-full border ${device.status === 'online' ? 'border-[#34d399]/40 bg-[#34d399]/10' : 'border-red-500/40 bg-red-500/10'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'bg-[#34d399]' : 'bg-red-500'}`} />
                       </div>

                       <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                             <span className="text-[13px] font-semibold tracking-wide truncate">{device.name}</span>
                             <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-[3px] leading-none ${device.status === 'online' ? 'bg-text-primary/10 text-text-primary/90' : 'bg-red-500/10 text-red-500/90'}`}>
                                {device.status === 'online' ? '在线' : '停机'}
                             </span>
                          </div>
                          <span className="text-[10px] opacity-60 font-mono truncate mt-0.5 tracking-tight">{device.id}</span>
                       </div>
                    </div>

                    {/* Hover Tool Action Area */}
                    <div className="flex items-center space-x-3 text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity pl-2 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); handleEditDevice(device, e); }} title="修改配置" className="hover:text-text-primary transition-colors focus:outline-none cursor-pointer"><Settings size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteDevice(device.id, e); }} title="剔除节点" className="hover:text-red-500 transition-colors focus:outline-none cursor-pointer"><Trash2 size={14} /></button>
                    </div>
                 </div>
               );
             })}
             {devices.length === 0 && (
                <div className="mt-8 flex flex-col items-center justify-center space-y-2 opacity-40">
                   <span className="text-[10px] tracking-widest font-mono">无在线终端设备</span>
                </div>
             )}
             </>
          )}
         </div>
      </OverlayScrollbarsComponent>
    </div>
  );
};
