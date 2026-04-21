import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ExportWaveformModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportWaveformBuffer: (durationSeconds: number) => number[];
  defaultWindowSize: number;
}

export const ExportWaveformModal: React.FC<ExportWaveformModalProps> = ({
  isOpen, onClose, exportWaveformBuffer, defaultWindowSize
}) => {
  const [duration, setDuration] = useState<number>(defaultWindowSize);

  const handleExport = () => {
    const data = exportWaveformBuffer(duration);

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waveform_export_${duration}s_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onClose();
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto bg-black/40 backdrop-blur-sm' : 'opacity-0 pointer-events-none bg-black/0 backdrop-blur-none'}`}
    >
      <div 
         className={`bg-bg-base border border-border w-[460px] shadow-2xl flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ease-out ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        {/* Modal Header */}
        <div className="h-12 border-b border-border flex items-center justify-between px-5 bg-bg-panel shrink-0">
           <span className="text-[13px] font-bold tracking-wider">波形快照导出</span>
           <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors"><X size={18}/></button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-5">
           <div className="space-y-1.5">
             <label className="text-[11px] text-text-secondary font-bold uppercase tracking-wide">截取时间跨度 (Export Duration)</label>
             <select 
               value={duration}
               onChange={(e) => setDuration(Number(e.target.value))}
               className="w-full h-8 bg-bg-base border border-border rounded-lg px-3 text-[13px] text-text-primary outline-none focus:border-text-secondary transition-colors appearance-none cursor-pointer"
             >
               <option value={15}>最新 15 秒</option>
               <option value={30}>最新 30 秒</option>
               <option value={60}>最新 1 分钟</option>
               <option value={120}>最新 2 分钟</option>
               <option value={300}>最大黑匣子 (5 分钟)</option>
             </select>
             <p className="text-[10px] text-text-secondary/60">设备探针数据已在后台持续缓冲，请选择您想要截取的黑匣子时间跨度。</p>
           </div>
        </div>

        {/* Modal Footer */}
        <div className="h-14 border-t border-border bg-bg-active/30 flex items-center justify-end px-5 space-x-3 shrink-0">
           <button onClick={onClose} className="px-5 py-1.5 text-[12px] font-bold text-text-secondary hover:text-text-primary transition-colors">取消</button>
           <button onClick={handleExport} className="bg-text-primary text-bg-base px-6 py-1.5 text-[12px] font-bold rounded-lg hover:opacity-80 transition-opacity">确认导出</button>
        </div>
      </div>
    </div>
  );
};
