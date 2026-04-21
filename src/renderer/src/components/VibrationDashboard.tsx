import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';

interface WaveProps {
  data: number[];
}

export const VibrationDashboard = ({ data }: WaveProps) => {
  const options = {
    animation: false, // 全程依靠极高频 React 数据驱动代替自带缓动，避免重叠卡顿
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(15, 23, 42, 0.85)', // 赛博朋克深色毛玻璃底板
      borderColor: '#334155', // 边框线
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: '#f8fafc', fontSize: 12, fontFamily: 'monospace' },
      axisPointer: {
        type: 'line', // 竖直十字准星
        lineStyle: { color: '#0d9488', width: 1, type: 'dashed' }
      },
      formatter: (params: any) => {
        const value = params[0].value.toFixed(2);
        const isAnomaly = Math.abs(value) > 30;
        const color = isAnomaly ? '#ef4444' : '#0d9488';
        const status = isAnomaly ? '[ 异常 ]' : '[ 正常 ]';
        // HTML 注入强工业级字体排版
        return `
          <div style="font-family: 'JetBrains Mono', monospace; letter-spacing: 1px;">
            <div style="color: #94a3b8; font-size: 10px; margin-bottom: 6px;">OFFSET: -${(150 - params[0].name) * 50}ms</div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 15px;">
               <span style="color: ${color}; font-weight: bold; font-size: 14px;">AMP: ${value}</span>
               <span style="color: ${color}; font-size: 10px;">${status}</span>
            </div>
          </div>
        `;
      }
    },
    grid: {
      left: '-20px', 
      right: '-20px',
      bottom: '-30px', // 隐藏底端标签空间
      top: '40px',
      containLabel: false
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({length: data.length}, (_, i) => i),
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { show: false }
    },
    yAxis: {
      type: 'value',
      min: -80,
      max: 80,
      splitLine: { 
        show: true,
        lineStyle: { color: 'rgba(255, 255, 255, 0.05)', type: 'dashed' }
      },
      axisLine: { show: false },
      axisLabel: { show: false }
    },
    // 将波形上下端映射为报警红色
    visualMap: {
      show: false,
      pieces: [
        { gt: -30, lt: 30, color: '#0d9488' }, // 健康安全的内圈青绿色
      ],
      outOfRange: { color: '#ef4444' } // 一旦超过安全界限，直接变火红警告
    },
    series: [{
      name: 'Vibration',
      type: 'line',
      data: data,
      smooth: 0.3, // 增加流线型的机械平滑感
      symbol: 'none', // 杀掉难看的折点圆圈
      lineStyle: {
        width: 2,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(13, 148, 136, 0.4)' },
          { offset: 1, color: 'rgba(13, 148, 136, 0.01)' }
        ])
      }
    }]
  };

  return (
    <ReactECharts
      option={options}
      notMerge={true} 
      lazyUpdate={true}
      style={{ height: '100%', width: '100%' }}
    />
  );
};
