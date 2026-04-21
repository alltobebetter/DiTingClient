import React from 'react';
import { LogOut, X } from 'lucide-react';

interface AppCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const AppCloseModal: React.FC<AppCloseModalProps> = ({
  isOpen, onClose, onConfirm
}) => {
  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto bg-black/40 backdrop-blur-sm' : 'opacity-0 pointer-events-none bg-black/0 backdrop-blur-none'}`}
    >
      <div 
         className={`bg-bg-base border border-border w-[420px] shadow-2xl flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        <div className="h-12 border-b border-border flex items-center justify-between px-5 bg-bg-panel shrink-0">
           <span className="text-[13px] font-bold tracking-wider">退出应用</span>
           <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors"><X size={18}/></button>
        </div>
        
        <div className="p-6 space-y-4">
           <div className="flex items-start space-x-4">
              <div className="p-2.5 bg-[#ff9500]/10 rounded-full shrink-0">
                 <LogOut className="text-[#ff9500]" size={20} />
              </div>
              <div className="pt-1">
                 <h3 className="text-[13px] font-bold text-text-primary">确定要退出应用吗？</h3>
                 <p className="text-[11px] text-text-secondary mt-2 leading-relaxed">
                   退出后将会断开当前的实时设备流连接，并清空尚未保存的历史缓冲数据。
                 </p>
              </div>
           </div>
        </div>

        <div className="h-14 border-t border-border bg-bg-active/30 flex items-center justify-end px-5 space-x-3 shrink-0">
           <button onClick={onClose} className="px-5 py-1.5 text-[12px] font-bold text-text-secondary hover:text-text-primary transition-colors">取消</button>
           <button onClick={onConfirm} className="bg-red-500/90 hover:bg-red-500 text-white px-5 py-1.5 text-[12px] font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(239,68,68,0.2)]">确认退出</button>
        </div>
      </div>
    </div>
  );
};
