export interface Device {
  id: string;
  name: string;
  ip: string;
  status: 'online' | 'offline';
  type?: 'iot' | 'mobile';
  mac?: string;
  uptime?: string;
  version?: string;
  model: string;
  lastSeen: string;
}

export interface Alert {
  id: string;
  deviceId: string;
  deviceName: string;
  time: string;
  timestamp: number;
  level: 'warning' | 'critical';
  score: number;
  status: 'unhandled' | 'read';
  description?: string;
  waveSnapshot?: number[];
  aiSummary?: string;
}

export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: string;
  status: 'running' | 'completed' | 'failed';
  result?: any;
}

export interface SettingsConfig {
  aiBase: string;
  apiKey: string;
  aiModel: string;
  autoReport: boolean;
  mqttBroker: string;
  inferenceThreshold: number;
  chartWindowSize: number;
  useStream: boolean;
}

export interface Ticket {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface UIMessage {
  role: 'user' | 'assistant' | 'tool';
  text: string;
  toolInvocations?: ToolInvocation[];
}

export interface ChatSession {
  id: string;
  title: string;
  summary: string;
  timestamp: number;
  messages: UIMessage[];
  isTitleGenerated: boolean;
}

export interface ChatSessionMeta {
  id: string;
  title: string;
  summary: string;
  timestamp: number;
  isTitleGenerated: boolean;
  messageCount: number;
}
