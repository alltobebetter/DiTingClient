import React from 'react';
import { Activity, Search, Bell, Sun, Moon, Settings, SlidersHorizontal, Monitor, ClipboardList } from 'lucide-react';

interface PrimarySidebarProps {
  theme: 'light' | 'dark' | 'system';
  toggleTheme: () => void;
  handleMenuClick: (menu: string) => void;
  isMenuSelected: (menu: string) => boolean;
  hasUnreadAlerts: boolean;
}

export const PrimarySidebar: React.FC<PrimarySidebarProps> = ({
  theme, toggleTheme, handleMenuClick, isMenuSelected, hasUnreadAlerts
}) => {
  return (
    <div className="w-[48px] shrink-0 border-r border-border bg-bg-panel flex flex-col items-center py-2 z-20">
      <button 
        onClick={() => handleMenuClick('monitor')}
        className="w-[48px] h-[48px] flex items-center justify-center relative group"
        title="监控总览"
      >
        <div className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors ${isMenuSelected('monitor') ? 'bg-text-primary/10 text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
           <Activity size={22} strokeWidth={1.5} />
        </div>
      </button>

      <button 
        onClick={() => handleMenuClick('alerts')}
        className="w-[48px] h-[48px] flex items-center justify-center relative group"
        title="告警中心"
      >
        <div className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors ${isMenuSelected('alerts') ? 'bg-text-primary/10 text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
           <Bell size={22} strokeWidth={1.5} />
           {hasUnreadAlerts && (
             <>
               <div className="absolute top-3 right-3 w-[7px] h-[7px] bg-red-500 rounded-full animate-pulse blur-[1px]"></div>
               <div className="absolute top-3 right-3 w-[7px] h-[7px] bg-red-500 rounded-full border border-bg-panel shadow-sm"></div>
             </>
           )}
        </div>
      </button>
      <button 
        onClick={() => handleMenuClick('tickets')}
        className="w-[48px] h-[48px] flex items-center justify-center relative group"
        title="诊断报告与工单"
      >
        <div className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors ${isMenuSelected('tickets') ? 'bg-text-primary/10 text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
           <ClipboardList size={22} strokeWidth={1.5} />
        </div>
      </button>
      
      <button 
        onClick={() => handleMenuClick('search')}
        className="w-[48px] h-[48px] flex items-center justify-center relative group"
        title="全局设备检索"
      >
        <div className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors ${isMenuSelected('search') ? 'bg-text-primary/10 text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
           <Search size={22} strokeWidth={1.5} />
        </div>
      </button>

      <button 
        onClick={() => handleMenuClick('ai_hub')}
        className="w-[48px] h-[48px] flex items-center justify-center relative group"
        title="AI 核心引擎"
      >
        <div className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors ${isMenuSelected('ai_hub') ? 'bg-text-primary/10 text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
           <SlidersHorizontal size={22} strokeWidth={1.5} />
        </div>
      </button>
      
      <div className="flex-1" />
      
      <button 
        onClick={toggleTheme}
        className="w-[48px] h-[48px] flex items-center justify-center relative group"
        title={theme === 'system' ? "跟随系统亮度" : theme === 'dark' ? "切换浅色模式" : "切换深色模式"}
      >
        <div className="flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors text-text-secondary group-hover:text-text-primary">
           {theme === 'system' ? <Monitor size={22} strokeWidth={1.5}/> : theme === 'dark' ? <Sun size={22} strokeWidth={1.5}/> : <Moon size={22} strokeWidth={1.5}/>}
        </div>
      </button>
      
      <button 
        onClick={() => handleMenuClick('settings')}
        className="w-[48px] h-[48px] flex items-center justify-center relative group"
        title="设置"
      >
        <div className={`flex items-center justify-center w-[34px] h-[34px] rounded-lg transition-colors ${isMenuSelected('settings') ? 'bg-text-primary/10 text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
           <Settings size={22} strokeWidth={1.5} />
        </div>
      </button>
    </div>
  );
};
