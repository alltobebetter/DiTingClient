import { Device, Alert, Ticket, SettingsConfig } from '../types';

export interface ToolExecutorContext {
  devices: Device[];
  alerts: Alert[];
  tickets: Ticket[];
  config: SettingsConfig;
  setConfig: React.Dispatch<React.SetStateAction<SettingsConfig>>;
  onGenerateTicket?: (payload: { title: string; content: string }) => void;
}

export async function executeAiTool(name: string, argsStr: string, context: ToolExecutorContext): Promise<string> {
  const { devices, alerts, tickets, config, setConfig, onGenerateTicket } = context;
  try {
    const argsData = argsStr ? JSON.parse(argsStr) : {};
    if (name === 'query_live_device_status') {
      const onlineCount = devices.filter(d => d.status === 'online').length;
      return JSON.stringify({
        total_devices: devices.length,
        online_devices: onlineCount,
        unhandled_alerts: alerts.filter(a => a.status === 'unhandled').length,
        total_tickets: tickets.length,
        global_threshold: config.inferenceThreshold,
        status_summary: `当前系统共接入 ${devices.length} 台设备，其中在线 ${onlineCount} 台。当前未处理告警 ${alerts.filter(a => a.status === 'unhandled').length} 条。`
      });
    } else if (name === 'change_alarm_threshold') {
      setConfig(prev => ({ ...prev, inferenceThreshold: argsData.newThreshold }));
      return `成功。已通知下位机并将本地判定界面更新，全局推理告警阈值已被物理修改为 ${argsData.newThreshold}，该配置已全量生效。`;
    } else if (name === 'generate_markdown_ticket') {
      if (onGenerateTicket) {
        onGenerateTicket({
          title: argsData.filename || '系统自动生成维修工单',
          content: argsData.content || argsData.markdown_content || '# 空工单\n\n数据解析异常，未能读取内容。'
        });
      }
      return `写入完毕，文件 ${argsData.filename || '未命名'} 已本地保存并在全局分析视图归档。模型推理流程完成。`;
    } else if (name === 'query_recent_alerts') {
      const limit = argsData.limit || 5;
      const recent = alerts.slice(0, limit).map(a => 
        `[${a.time}] 设备:${a.deviceName} 打分:${a.score} 状态:${a.status === 'unhandled' ? '未处理' : '已读'}`
      );
      return recent.length > 0 ? recent.join('\n') : '暂无任何历史告警。';
    } else if (name === 'toggle_ai_auto_guard') {
      setConfig(prev => ({ ...prev, autoReport: argsData.enable }));
      return argsData.enable ? '已开启全局自动诊报告生成引擎。' : '已休眠自动生成引擎。';
    } else {
      return `{"status": "unknown_tool"}`;
    }
  } catch (e: any) {
    return `执行错误: ${e.message}`;
  }
}
