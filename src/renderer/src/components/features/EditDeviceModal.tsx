import React, { useEffect, useState } from 'react';
import { X, Mic, Smartphone } from 'lucide-react';
import { Device } from '../../types';
import { QRCodeSVG } from 'qrcode.react';

interface EditDeviceModalProps {
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  editingDevice: Device | null;
  setEditingDevice: (device: Device | null) => void;
  handleUpdateDevice: () => void;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  isEditing, setIsEditing, editingDevice, setEditingDevice, handleUpdateDevice
}) => {
  const [localIp, setLocalIp] = useState('127.0.0.1');

  useEffect(() => {
    if (isEditing && window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.invoke('get-local-ip').then((ip: string) => setLocalIp(ip));
    }
  }, [isEditing]);

  return (
    <div 
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${isEditing ? 'opacity-100 pointer-events-auto bg-black/40 backdrop-blur-sm' : 'opacity-0 pointer-events-none bg-black/0 backdrop-blur-none'}`}
    >
      <div 
         className={`bg-bg-base border border-border w-[460px] shadow-2xl flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ease-out ${isEditing ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        {/* Modal Header */}
        <div className="h-12 border-b border-border flex items-center justify-between px-5 bg-bg-panel shrink-0">
           <span className="text-[13px] font-bold tracking-wider">修改设备配置</span>
           <button onClick={() => setIsEditing(false)} className="text-text-secondary hover:text-text-primary transition-colors"><X size={18}/></button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-4">
           <div className="space-y-1.5">
             <label className="text-[11px] text-text-secondary font-bold uppercase tracking-wide">设备 ID (MAC / 标识符)</label>
             <input value={editingDevice?.id || ''} disabled className="w-full h-8 bg-bg-active border border-border rounded-lg px-3 text-[13px] text-text-secondary outline-none cursor-not-allowed" />
             <p className="text-[10px] text-text-secondary/60">设备 ID 作为唯一标识不可修改</p>
           </div>
           
           <div className="space-y-1.5">
             <label className="text-[11px] text-text-secondary font-bold uppercase tracking-wide">设备名称 (别名)</label>
             <input value={editingDevice?.name || ''} onChange={e => editingDevice && setEditingDevice({...editingDevice, name: e.target.value})} placeholder="例如: 2号机房排风扇" className="w-full h-8 bg-bg-base border border-border rounded-lg px-3 text-[13px] text-text-primary outline-none focus:border-text-secondary transition-colors" />
           </div>

           <div className="space-y-1.5">
              <label className="text-[11px] text-text-secondary font-bold uppercase tracking-wide">设备类型</label>
              <div className="flex items-center space-x-1 bg-bg-panel p-1 rounded-lg border border-border cursor-not-allowed opacity-80">
                 <button 
                    disabled
                    className={`flex-1 flex items-center justify-center space-x-2 py-1.5 text-[12px] font-bold rounded-md transition-all duration-200 ${editingDevice?.type === 'iot' || !editingDevice?.type ? 'bg-text-secondary text-bg-base shadow-sm' : 'text-text-secondary/50'}`}
                 >
                    <Mic size={14} />
                    <span>固定采集网关</span>
                 </button>
                 <button 
                    disabled
                    className={`flex-1 flex items-center justify-center space-x-2 py-1.5 text-[12px] font-bold rounded-md transition-all duration-200 ${editingDevice?.type === 'mobile' ? 'bg-text-secondary text-bg-base shadow-sm' : 'text-text-secondary/50'}`}
                 >
                    <Smartphone size={14} />
                    <span>移动端 (手机)</span>
                 </button>
              </div>
              <p className="text-[10px] text-text-secondary/60">添加后设备类型不可更改</p>
           </div>

           {/* 移动端探针专用：二维码扫码区域 */}
           {editingDevice?.type === 'mobile' && (
             <div className="p-4 border border-border bg-bg-panel rounded-xl flex items-center space-x-4">
                <div className="p-2 bg-white rounded-lg shrink-0">
                   <QRCodeSVG value={`http://${localIp}:3000/${editingDevice.id}`} size={80} />
                </div>
                <div className="flex flex-col space-y-1 min-w-0">
                   <h3 className="text-[13px] font-bold text-text-primary">扫码开启数据采集</h3>
                   <p className="text-[11px] text-text-secondary leading-relaxed">请确保手机与主机位于同一局域网内。通过手机浏览器扫码即可开始上传周围环境音频参数。</p>
                   <span className="text-[10px] text-blue-400 break-all mt-1 font-mono select-all">
                     http://{localIp}:3000/{editingDevice.id}
                   </span>
                </div>
             </div>
           )}
        </div>

        {/* Modal Footer */}
        <div className="h-14 border-t border-border bg-bg-active/30 flex items-center justify-end px-5 space-x-3 shrink-0">
           <button onClick={() => setIsEditing(false)} className="px-5 py-1.5 text-[12px] font-bold text-text-secondary hover:text-text-primary transition-colors">取消</button>
           <button onClick={handleUpdateDevice} className="bg-text-primary text-bg-base px-6 py-1.5 text-[12px] font-bold rounded-lg hover:opacity-80 transition-opacity">保存修改</button>
        </div>
      </div>
    </div>
  );
};
