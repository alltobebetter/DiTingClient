import React from 'react';
import { X, Mic, Smartphone } from 'lucide-react';
import { Device } from '../../types';

interface AddDeviceModalProps {
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
  newDevice: Device;
  setNewDevice: (device: Device) => void;
  handleSaveDevice: () => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isAdding, setIsAdding, newDevice, setNewDevice, handleSaveDevice
}) => {
  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${isAdding ? 'opacity-100 pointer-events-auto bg-black/40 backdrop-blur-sm' : 'opacity-0 pointer-events-none bg-black/0 backdrop-blur-none'}`}
    >
      <div 
         className={`bg-bg-base border border-border w-[460px] shadow-2xl flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ease-out ${isAdding ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        {/* Modal Header */}
        <div className="h-12 border-b border-border flex items-center justify-between px-5 bg-bg-panel shrink-0">
           <span className="text-[13px] font-bold tracking-wider">接入新设备</span>
           <button onClick={() => setIsAdding(false)} className="text-text-secondary hover:text-text-primary transition-colors"><X size={18}/></button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-4">
           <div className="space-y-1.5">
             <label className="text-[11px] text-text-secondary font-bold uppercase tracking-wide">设备 ID (MAC / 标识符)</label>
             <input value={newDevice.id} onChange={e => setNewDevice({...newDevice, id: e.target.value})} placeholder="例如: FAN-XR-9" className="w-full h-8 bg-bg-base border border-border rounded-lg px-3 text-[13px] text-text-primary outline-none focus:border-text-secondary transition-colors" />
           </div>
           
           <div className="space-y-1.5">
             <label className="text-[11px] text-text-secondary font-bold uppercase tracking-wide">设备名称 (别名)</label>
             <input value={newDevice.name} onChange={e => setNewDevice({...newDevice, name: e.target.value})} placeholder="例如: 2号机房排风扇" className="w-full h-8 bg-bg-base border border-border rounded-lg px-3 text-[13px] text-text-primary outline-none focus:border-text-secondary transition-colors" />
           </div>

           <div className="space-y-1.5">
              <label className="text-[11px] text-text-secondary font-bold uppercase tracking-wide">设备类型</label>
              <div className="flex items-center space-x-1 bg-bg-panel p-1 rounded-lg border border-border">
                 <button 
                    onClick={() => setNewDevice({...newDevice, type: 'iot'})} 
                    className={`flex-1 flex items-center justify-center space-x-2 py-1.5 text-[12px] font-bold rounded-md transition-all duration-200 ${newDevice.type === 'iot' || !newDevice.type ? 'bg-text-primary text-bg-base shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                 >
                    <Mic size={14} />
                    <span>固定采集网关</span>
                 </button>
                 <button 
                    onClick={() => setNewDevice({...newDevice, type: 'mobile'})} 
                    className={`flex-1 flex items-center justify-center space-x-2 py-1.5 text-[12px] font-bold rounded-md transition-all duration-200 ${newDevice.type === 'mobile' ? 'bg-text-primary text-bg-base shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
                 >
                    <Smartphone size={14} />
                    <span>移动端 (手机)</span>
                 </button>
              </div>
           </div>
        </div>

        {/* Modal Footer */}
        <div className="h-14 border-t border-border bg-bg-active/30 flex items-center justify-end px-5 space-x-3 shrink-0">
           <button onClick={() => setIsAdding(false)} className="px-5 py-1.5 text-[12px] font-bold text-text-secondary hover:text-text-primary transition-colors">取消</button>
           <button onClick={handleSaveDevice} className="bg-text-primary text-bg-base px-6 py-1.5 text-[12px] font-bold rounded-lg hover:opacity-80 transition-opacity">确认添加</button>
        </div>
      </div>
    </div>
  );
};
