import { SettingsConfig, Alert, Device } from '../types';

export const DITING_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'query_live_device_status',
      description: '查询边缘计算节点中所有设备的实时缓存状态，包括实时平均健康分、连接状态、当前阈值等。必须在用户询问设备当前运行状态时优先调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          deviceId: { type: 'string', description: '需要查询的具体设备ID，若不清楚可传 "all" 查询' }
        },
        required: ['deviceId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'change_alarm_threshold',
      description: '修改边缘计算节点（大屏端）的全局推理告警阈值配置（Inference Threshold）。只有用户明确提出需要调高或调低敏感度、报警线时才使用。',
      parameters: {
        type: 'object',
        properties: {
          newThreshold: { type: 'number', description: '新的告警阈值 (0-100之间的整数，如 85)' }
        },
        required: ['newThreshold']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'generate_markdown_ticket',
      description: '生成一份格式工整的设备维保工单或专家级诊断报告，并将该文件写入保存到磁盘中。',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: '要保存的文件名，如 pump_maintenance.md' },
          content: { type: 'string', description: '非常详尽的维保报告文本内容，支持 Markdown 排版' }
        },
        required: ['filename', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'query_recent_alerts',
      description: '精确检视底层物联网系统近期的详细异常告警记录，用于追溯具体设备的病史。',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', description: '要查询的告警条数上限，默认 5 条' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'toggle_ai_auto_guard',
      description: '开关全局的 "发生警报后自动生成 AI 分析报告" 的看门狗保护机制。如果不希望发生报警后自动消耗配额生成报告，可以关闭它。',
      parameters: {
        type: 'object',
        properties: {
          enable: { type: 'boolean', description: 'true 开启自动生成，false 关闭自动生成' }
        },
        required: ['enable']
      }
    }
  }
];

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export async function chatWithCopilot(
  config: SettingsConfig, 
  messages: ChatMessage[],
  onChunk?: (text: string) => void,
  onToolUpdate?: (toolCallId: string, name: string, argsDelta: string) => void,
  allowTools: boolean = true
): Promise<string | any[]> {
  if (!config.apiKey || config.apiKey.trim() === '') {
    throw new Error('未配置大模型 API Key，请前往设置面板配置。');
  }

  // 确保证 API Base 末尾正确拼接（智能防重）
  const baseUrl = config.aiBase.trim();
  const endpoint = baseUrl.endsWith('/chat/completions') 
    ? baseUrl 
    : (baseUrl.endsWith('/') ? `${baseUrl}chat/completions` : `${baseUrl}/chat/completions`);

  const shouldStream = !!(config.useStream && (onChunk || onToolUpdate));

  const payload: any = {
    model: config.aiModel || 'qwen-max',
    messages: messages,
    stream: shouldStream,
    temperature: 0.7
  };

  if (allowTools) {
    payload.tools = DITING_TOOLS;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey.trim()}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `网络请求失败 (HTTP ${response.status})`);
    }

    if (shouldStream) {
      if (!response.body) throw new Error("ReadableStream not supported by browser");
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let activeToolCalls: Record<number, { id: string; name: string; args: string }> = {};
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
          const tLine = line.trim();
          if (tLine.startsWith('data: ') && tLine !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(tLine.slice(6));
              const delta = parsed.choices?.[0]?.delta || {};

              // 文本流
              if (delta.content && onChunk) {
                fullText += delta.content;
                onChunk(fullText);
              }
              
              // 工具流
              if (delta.tool_calls && onToolUpdate) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index;
                  if (!activeToolCalls[idx]) {
                    activeToolCalls[idx] = { id: tc.id || '', name: tc.function?.name || '', args: '' };
                  }
                  if (tc.function?.arguments) {
                    activeToolCalls[idx].args += tc.function.arguments;
                  }
                  onToolUpdate(activeToolCalls[idx].id, activeToolCalls[idx].name, activeToolCalls[idx].args);
                }
              }
            } catch (e) {}
          }
        }
      }
      
      const completedTools = Object.values(activeToolCalls);
      if (completedTools.length > 0) {
        return completedTools;
      }
      return fullText;
    } else {
      const data = await response.json();
      if (data.choices?.[0]?.message?.tool_calls) {
        const tcs = data.choices[0].message.tool_calls.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          args: tc.function.arguments
        }));
        return tcs;
      }
      const content = data.choices?.[0]?.message?.content || '';
      return content.trim();
    }
  } catch (error: any) {
    throw new Error(`请求大模型异常: ${error.message}`);
  }
}

export async function generateDiagnosisReport(
  config: SettingsConfig, 
  device: Device, 
  alertInfo: Pick<Alert, 'time' | 'score'>
): Promise<string> {
  const systemPrompt = `你是一个资深的工业声纹与振动分析AI专家（谛听智脑）。
目前监控到一台车间设备发生突发异常报警。
【设备信息】
设备名称：${device.name}
【报警信息】
发生时间：${alertInfo.time}
健康评分：${alertInfo.score} 分数（满分为 100，当前大幅跌破正常阈值）

请结合上述信息，用非常专业、干练的口吻（约60-120字），自动生成一份简短的AI定性诊断结论。包含：
1. 分析可能诱发的物理故障原因（如轴承剥落、转子偏心、结构松动等）。
2. 给出一两项明确的维保人员排查建议。`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: '请为本次突发告警即刻下发AI诊断速报。' }
  ];

  // 告警报告强制非流式直出
  return await chatWithCopilot({ ...config, useStream: false }, messages, undefined, undefined, false) as unknown as string;
}
