import React from 'react';
import { Device } from '../../types';

interface StatusBarProps {
  activeDevice: Device | undefined;
}

export const StatusBar: React.FC<StatusBarProps> = ({ activeDevice }) => {
  return (
    <div className="h-[22px] shrink-0 border-t border-border bg-bg-active flex items-center px-3 text-[10px] text-text-secondary justify-between uppercase tracking-wide z-50">
      <div className="flex space-x-4">
        <span className="flex items-center">
          <span className={`w-1.5 h-1.5 mr-1.5 ${activeDevice?.status === 'online' ? 'bg-[#0d9488]' : 'bg-red-500'}`}></span>
          边缘控制节点 : {activeDevice?.status === 'online' ? '高频捕获中' : '强制挂起断链'}
        </span>
      </div>
      <div className="flex space-x-4">
        <span>推理引擎 : {activeDevice?.model || 'diting_core.onnx'}</span>
        <span>MQTT 软总线握手 : {activeDevice?.status === 'online' ? 'OK' : 'FAIL'}</span>
      </div>
    </div>
  );
};
