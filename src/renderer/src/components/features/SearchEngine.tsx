import React from 'react';
import { SlidersHorizontal, BrainCircuit, Film } from 'lucide-react';

interface SearchEngineProps {
  searchMode: string;
}

export const SearchEngine: React.FC<SearchEngineProps> = ({ searchMode }) => {
  return (
    <div className="flex-1 p-6 overflow-hidden flex flex-col items-center justify-center bg-bg-base text-text-secondary text-center space-y-5">
      {searchMode === 'threshold' && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-bg-panel flex items-center justify-center border border-border shadow-sm mb-4">
             <SlidersHorizontal size={28} className="text-text-primary opacity-80" />
          </div>
          <h2 className="text-xl font-bold text-text-primary tracking-wider mb-3">基于物理参数检索</h2>
          <p className="max-w-md text-[13px] leading-relaxed opacity-80">
             通过设定物理参数阈值（如振幅 RMS），快速筛选历史数据中符合条件的异常记录。
          </p>
          <div className="mt-10 border border-border rounded-xl bg-bg-panel p-5 text-left w-full shadow-sm max-w-[600px] border-t-2 border-t-text-primary">
             <div className="flex space-x-4 items-end">
                <div className="flex-1 space-y-1.5">
                   <label className="text-[10px] uppercase font-bold tracking-wider opacity-70">目标阵列</label>
                   <select className="w-full h-9 bg-bg-base border border-border rounded-lg px-2 text-[12px] text-text-primary outline-none focus:border-text-secondary">
                      <option>跨设备全域搜索 (GLOB-ALL)</option>
                   </select>
                </div>
                <div className="flex-1 space-y-1.5">
                   <label className="text-[10px] uppercase font-bold tracking-wider opacity-70">参数阈值设定</label>
                   <input type="text" placeholder="Peak > 0.8g" className="w-full h-9 bg-bg-base border border-border rounded-lg px-3 text-[12px] text-text-primary outline-none focus:border-text-secondary" />
                </div>
                <div className="flex items-end">
                   <button className="h-9 px-6 bg-text-primary text-bg-base text-[12px] font-bold rounded-lg hover:opacity-90 transition-opacity">执行检索</button>
                </div>
             </div>
          </div>
        </div>
      )}
      {searchMode === 'semantic' && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-bg-panel flex items-center justify-center border border-border shadow-sm mb-4">
             <BrainCircuit size={28} className="text-text-primary opacity-80" />
          </div>
          <h2 className="text-xl font-bold text-text-primary tracking-wider mb-3">基于异常特征查询</h2>
          <p className="max-w-md text-[13px] leading-relaxed opacity-80">
             使用自然语言查询特定的异常特征（如“带有轻微轴承摩擦特征的数据片段”）。
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8 max-w-md">
             <span className="px-4 py-1.5 bg-text-primary/10 border border-text-primary/30 text-text-primary rounded-full text-[12px] cursor-pointer shadow-sm hover:bg-text-primary/20 transition-colors"># 断续撞击声 (Impact)</span>
             <span className="px-4 py-1.5 bg-bg-panel border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary rounded-full text-[12px] cursor-pointer transition-colors"># 高频哨音 (Whistle)</span>
             <span className="px-4 py-1.5 bg-bg-panel border border-border text-text-secondary hover:text-text-primary hover:border-text-secondary rounded-full text-[12px] cursor-pointer transition-colors"># 扇叶共振失稳</span>
          </div>
        </div>
      )}
      {searchMode === 'replay' && (
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-bg-panel flex items-center justify-center border border-border shadow-sm mb-4">
             <Film size={28} className="text-text-primary opacity-80" />
          </div>
          <h2 className="text-xl font-bold text-text-primary tracking-wider mb-3">重点历史波形回溯</h2>
          <p className="max-w-md text-[13px] leading-relaxed opacity-80">
             查看指定时间段的高频波形数据，支持缩放、对比及算法插件分析。<br/><br/>
             <span className="opacity-50 italic text-[11px] font-mono tracking-wide">&lt; 请先通过检索功能选择数据记录后进行波形回溯 &gt;</span>
          </p>
        </div>
      )}
    </div>
  );
};
