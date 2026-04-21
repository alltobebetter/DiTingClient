import React from 'react';
import { Layers } from 'lucide-react';

export const EmptyWorkspace: React.FC = () => {
  return (
    <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col items-center justify-center bg-bg-base">
      <div className="text-center space-y-4">
        <div className="flex justify-center text-text-secondary opacity-20">
           <Layers size={56} strokeWidth={1} />
        </div>
        <p className="text-text-secondary text-[14px] tracking-[0.2em] font-bold">未选择资源</p>
        <p className="text-text-secondary text-[12px] opacity-50 font-mono tracking-wide">
          请在左侧索引栏中指定您要挂载并检视的对象
        </p>
      </div>
    </div>
  );
};
