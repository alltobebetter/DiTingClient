import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, ChevronRight, ArrowUp, ArrowDown, Paperclip, ImagePlus, Clock, SquarePen, X, FileClock, MessageSquare, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { OverlayScrollbarsComponent, OverlayScrollbarsComponentRef } from 'overlayscrollbars-react';
import { SettingsConfig, ToolInvocation, Device, Alert, Ticket, ChatSession, ChatSessionMeta, UIMessage } from '../../types';
import { chatWithCopilot, ChatMessage } from '../../utils/ai';
import { executeAiTool } from '../../utils/toolExecutor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ToolInvocationCard = ({ invocation: ti }: { invocation: ToolInvocation }) => {
  return (
    <div className="flex w-full items-center space-x-3 bg-bg-base border border-border p-2.5 rounded-xl shadow-sm">
      {ti.status === 'running' ? (
        <Loader2 className="animate-spin text-text-secondary/80" size={16} />
      ) : (
        <CheckCircle2 className="text-green-500/80" size={16} />
      )}
      <div className="flex flex-col">
        <span className="text-[12px] font-bold text-text-primary">
          {ti.toolName === 'query_live_device_status' && '查询设备实时核心状态'}
          {ti.toolName === 'change_alarm_threshold' && '正在调整高级安全阈值'}
          {ti.toolName === 'generate_markdown_ticket' && '自动生成维保诊断书文档'}
          {['query_live_device_status', 'change_alarm_threshold', 'generate_markdown_ticket'].indexOf(ti.toolName) === -1 && `执行组件: ${ti.toolName}`}
        </span>
        <span className="text-[10px] text-text-secondary/60 truncate max-w-[200px]">
          {ti.status === 'running' ? '加载挂载参数缓冲中...' : '交互完成'}
        </span>
      </div>
    </div>
  );
};

interface RightPanelProps {
  aiPanelOpen: boolean;
  rightWidth: number;
  setIsDraggingRight: (val: boolean) => void;
  setAiPanelOpen: (val: boolean) => void;
  aiPanelOpenRef: React.MutableRefObject<boolean>;
  isDraggingRight: boolean;
  theme: 'light' | 'dark' | 'system';
  config: SettingsConfig;
  setConfig: React.Dispatch<React.SetStateAction<SettingsConfig>>;
  devices: Device[];
  alerts: Alert[];
  tickets: Ticket[];
  chatMetas: ChatSessionMeta[];
  setChatMetas: React.Dispatch<React.SetStateAction<ChatSessionMeta[]>>;
  activeChatId: string | null;
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
  onGenerateTicket?: (payload: { title: string, content: string }) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  aiPanelOpen, rightWidth, setIsDraggingRight, setAiPanelOpen, aiPanelOpenRef, isDraggingRight, theme, config, setConfig, devices, alerts, tickets, chatMetas, setChatMetas, activeChatId, setActiveChatId, onGenerateTicket
}) => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  
  const activeChatIdRef = useRef<string | null>(activeChatId);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep ref in sync (for use in closures)
  useEffect(() => { activeChatIdRef.current = activeChatId; }, [activeChatId]);

  // One-time initial load: restore last active session on mount
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (hasRestoredRef.current) return;
    hasRestoredRef.current = true;
    if (activeChatId) {
      window.api.chat.load(activeChatId).then((sess: ChatSession | null) => {
        if (sess) {
          setMessages(sess.messages);
          // Longer delay for initial restore - OS components need time to mount
          setTimeout(() => scrollToBottom('auto'), 300);
        }
      });
    }
  }, []);

  // --- Imperative session management (no reactive useEffect!) ---
  
  const abortCurrentRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsThinking(false);
  }, []);

  const switchToSession = useCallback(async (id: string) => {
    abortCurrentRequest();
    setActiveChatId(id);
    activeChatIdRef.current = id;
    const sess = await window.api.chat.load(id);
    if (sess && activeChatIdRef.current === id) {
      setMessages(sess.messages);
      setTimeout(() => scrollToBottom('auto'), 50);
    }
  }, [abortCurrentRequest, setActiveChatId]);

  const startNewSession = useCallback(() => {
    abortCurrentRequest();
    setActiveChatId(null);
    activeChatIdRef.current = null;
    setMessages([]);
  }, [abortCurrentRequest, setActiveChatId]);

  // Save session to file
  const saveSessionToFile = useCallback((session: ChatSession) => {
    window.api.chat.save(session);
    // Also update meta listing
    setChatMetas(prev => {
      const meta: ChatSessionMeta = { id: session.id, title: session.title, summary: session.summary, timestamp: session.timestamp, isTitleGenerated: session.isTitleGenerated, messageCount: session.messages.length };
      const existing = prev.findIndex(m => m.id === session.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = meta;
        return updated;
      }
      return [meta, ...prev];
    });
  }, [setChatMetas]);

  const chatMetasRef = useRef(chatMetas);
  useEffect(() => { chatMetasRef.current = chatMetas; }, [chatMetas]);

  // Flush current messages to file  
  const flushToFile = useCallback((msgs: UIMessage[], sessionMeta?: Partial<ChatSession>) => {
    const id = activeChatIdRef.current;
    if (!id) return;
    const currentMeta = chatMetasRef.current.find(m => m.id === id);
    const session: ChatSession = {
      id,
      title: sessionMeta?.title || currentMeta?.title || '未命名会话',
      summary: sessionMeta?.summary || currentMeta?.summary || '',
      timestamp: currentMeta?.timestamp || Date.now(),
      messages: msgs,
      isTitleGenerated: sessionMeta?.isTitleGenerated ?? currentMeta?.isTitleGenerated ?? false
    };
    saveSessionToFile(session);
  }, [saveSessionToFile]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const osRef = useRef<OverlayScrollbarsComponentRef>(null);
  const userScrolledUpRef = useRef(false);

  // 监听滚动事件：判断用户是否主动往上翻了
  useEffect(() => {
    if (osRef.current) {
      const osInstance = osRef.current.osInstance();
      if (osInstance) {
        const { viewport } = osInstance.elements();
        const handleScroll = () => {
          const { scrollTop, scrollHeight, clientHeight } = viewport;
          // 容差 40px，如果在底部 40px 内视为在最底部
          const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 40;
          userScrolledUpRef.current = !isAtBottom;
          setShowScrollBottom(!isAtBottom);
        };
        viewport.addEventListener('scroll', handleScroll);
        return () => viewport.removeEventListener('scroll', handleScroll);
      }
    }
    return undefined;
  }, []);

  // 监听大模型返回产生的 messages 更新，智能贴地滚动
  useEffect(() => {
    if (osRef.current && !userScrolledUpRef.current) {
      const osInstance = osRef.current.osInstance();
      if (osInstance) {
        const { viewport } = osInstance.elements();
        // 如果想要顺滑到底部可以改成 behavior: 'smooth'，但对于实时流瞬间贴底体验更好
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'auto' });
      }
    }
  }, [messages]);

  const scrollToBottom = (behavior: 'auto' | 'smooth' = 'smooth', retries = 5) => {
    if (osRef.current) {
      const osInstance = osRef.current.osInstance();
      if (osInstance) {
        const { viewport } = osInstance.elements();
        viewport.scrollTo({ top: viewport.scrollHeight, behavior });
        return;
      }
    }
    // OverlayScrollbars not ready yet, retry
    if (retries > 0) {
      setTimeout(() => scrollToBottom(behavior, retries - 1), 100);
    }
  };

  const executeToolsAndContinue = async (currentHistory: ChatMessage[], activeTools: any[]) => {
    const toolInvs: ToolInvocation[] = activeTools.map(tc => ({
      toolCallId: tc.id,
      toolName: tc.name,
      args: tc.args || '',
      status: 'running'
    }));

    setMessages(prev => {
      const msgs = [...prev];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg) lastMsg.toolInvocations = toolInvs;
      return msgs;
    });

    const toolResults: { id: string; name: string; result: string }[] = [];
    for (const tc of activeTools) {
      const resText = await executeAiTool(tc.name, tc.args, {
        devices, alerts, tickets, config, setConfig, onGenerateTicket
      });
      toolResults.push({ id: tc.id, name: tc.name, result: resText });
    }

    setMessages(prev => {
      const msgs = [...prev];
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && lastMsg.toolInvocations) {
        lastMsg.toolInvocations = lastMsg.toolInvocations.map(ti => ({...ti, status: 'completed'}));
      }
      return msgs;
    });

    const nextHistory = [...currentHistory];
    const lastHist = nextHistory[nextHistory.length - 1];
    if (lastHist && lastHist.role === 'assistant') {
       lastHist.tool_calls = activeTools.map(tc => ({
         id: tc.id,
         type: 'function',
         function: { name: tc.name, arguments: tc.args }
       }));
       if (!lastHist.content) lastHist.content = '';
    }

    for (const tr of toolResults) {
      nextHistory.push({
        role: 'tool',
        content: tr.result,
        tool_call_id: tr.id,
        name: tr.name
      });
    }

    setMessages(prev => [...prev, { role: 'assistant', text: '' }]);
    
    try {
      const response = await chatWithCopilot(config, nextHistory, (chunkText) => {
          setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].text = chunkText;
            return newMsgs;
          });
      }, (tid, tname, targs) => {
          setMessages(prev => {
            const msgs = [...prev];
            const lastMsg = msgs[msgs.length - 1];
            if (!lastMsg.toolInvocations) lastMsg.toolInvocations = [];
            const existing = lastMsg.toolInvocations.find(ti => ti.toolCallId === tid || ti.toolName === tname);
            if (existing) {
              existing.args = targs;
            } else {
              lastMsg.toolInvocations.push({ toolCallId: tid, toolName: tname, args: targs, status: 'running' });
            }
            return msgs;
          });
      });

      if (Array.isArray(response)) {
         nextHistory.push({ role: 'assistant', content: '' }); // We will fill content later if needed
         await executeToolsAndContinue(nextHistory, response);
      } else if (!config.useStream) {
         setMessages(prev => {
            const msgs = [...prev];
            msgs[msgs.length - 1].text = response as string;
            return msgs;
         });
      }
    } catch(err: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `[工具调用后请求错误: ${err.message}]` }]);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;
    const userMsg = inputValue.trim();
    setInputValue('');
    
    let currentId = activeChatId;
    const newMsgs = [...messages, { role: 'user', text: userMsg } as UIMessage];
    setMessages(newMsgs);

    if (!currentId) {
      currentId = 'CHAT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      activeChatIdRef.current = currentId;
      const newSession: ChatSession = {
         id: currentId,
         title: userMsg.substring(0, 15) + (userMsg.length > 15 ? '...' : ''),
         summary: userMsg.substring(0, 30),
         timestamp: Date.now(),
         messages: newMsgs,
         isTitleGenerated: false
      };
      saveSessionToFile(newSession);
      setActiveChatId(currentId);
    }
    
    setIsThinking(true);

    const contextMessages: ChatMessage[] = newMsgs.map(m => {
      const mapped: ChatMessage = { role: m.role, content: m.text };
      if (m.role === 'assistant' && m.toolInvocations && m.toolInvocations.length > 0) {
         mapped.tool_calls = m.toolInvocations.map(ti => ({
           id: ti.toolCallId,
           type: 'function',
           function: { name: ti.toolName, arguments: ti.args }
         }));
         mapped.content = mapped.content || ''; 
      }
      if (m.role === 'tool') {
         mapped.tool_call_id = (m as any).toolCallId;
         mapped.name = (m as any).name;
      }
      return mapped;
    });

    userScrolledUpRef.current = false;
    setTimeout(() => scrollToBottom('auto'), 50);
    
    try {
      if (config.useStream) {
        setMessages(prev => [...prev, { role: 'assistant', text: '' }]);
        const response = await chatWithCopilot(config, contextMessages, (chunkText) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], text: chunkText };
            return updated;
          });
        }, (tid, tname, targs) => {
          setMessages(prev => {
            const msgs = [...prev];
            const lastMsg = { ...msgs[msgs.length - 1] };
            if (!lastMsg.toolInvocations) lastMsg.toolInvocations = [];
            const existing = lastMsg.toolInvocations.find(ti => ti.toolCallId === tid || ti.toolName === tname);
            if (existing) {
              existing.args = targs;
            } else {
              lastMsg.toolInvocations = [...lastMsg.toolInvocations, { toolCallId: tid, toolName: tname, args: targs, status: 'running' }];
            }
            msgs[msgs.length - 1] = lastMsg;
            return msgs;
          });
        });

        if (Array.isArray(response)) {
           const nextHistory = [...contextMessages, { role: 'assistant' as const, content: '' }];
           await executeToolsAndContinue(nextHistory, response);
        }
      } else {
        const reply = await chatWithCopilot(config, contextMessages);
        setMessages(prev => [...prev, { role: 'assistant', text: reply as string } as UIMessage]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return; // User switched sessions
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant') {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], text: updated[updated.length - 1].text + `\n\n[请求错误: ${err.message}]` };
          return updated;
        }
        return [...prev, { role: 'assistant', text: `[请求错误: ${err.message}]` }];
      });
    } finally {
      setIsThinking(false);
      // Final flush to file
      setMessages(prev => {
        flushToFile(prev);
        if (currentId) setTimeout(() => triggerPostSendChecks(prev, currentId), 100);
        return prev;
      });
    }
  };

  const configRef = useRef(config);
  useEffect(() => { configRef.current = config; }, [config]);
  
  const handleGenerateTitle = async (sessionId: string, msgs: UIMessage[]) => {
      const meta = chatMetas.find(s => s.id === sessionId);
      if (meta?.isTitleGenerated) return;

      const firstTwo = msgs.slice(0, 2).map(m => `${m.role}: ${m.text}`).join('\n');
      try {
        const titleResponse = await chatWithCopilot(configRef.current, [{ 
          role: 'user', 
          content: `请为以下包含工业自动化上下文的几句简短对话提取一个绝佳的主题标签。
要求：
1. 只能返回标题文本本身，绝对不要有任何额外字符、标点符号、解释或引号！
2. 尽量控制在 10 个字以内，最多不超过 15 个字。

上下文:
${firstTwo}`
        }], undefined, undefined, false);
        
        const generatedTitle = (titleResponse as string).replace(/["'「」]/g, '').trim();
        if (generatedTitle) {
           flushToFile(msgs, { title: generatedTitle, isTitleGenerated: true });
        }
      } catch (e) {
        console.error("Auto title generation failed", e);
      }
  };

  const triggerPostSendChecks = (msgs: UIMessage[], activeId: string) => {
      if (msgs.length >= 2) {
          const firstAssistantMsg = msgs.find(m => m.role === 'assistant');
          if (firstAssistantMsg) {
              const summarySnippet = firstAssistantMsg.text.substring(0, 45) + (firstAssistantMsg.text.length > 45 ? '...' : '');
              flushToFile(msgs, { summary: summarySnippet });
          }
      }
      const hasTools = msgs.some(m => m.toolInvocations && m.toolInvocations.length > 0);
      if (msgs.length >= 2 || hasTools) {
          handleGenerateTitle(activeId, msgs);
      }
  };

  return (
    <div 
      className={`bg-bg-base border-border shrink-0 flex flex-col overflow-hidden relative ${isDraggingRight ? '' : 'transition-all duration-300'} ${aiPanelOpen ? 'border-l' : 'border-l-0'}`}
      style={{ width: aiPanelOpen ? rightWidth : 0 }}
    >
      <div 
        onMouseDown={() => setIsDraggingRight(true)}
        className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-text-primary/50 transition-colors z-50 -translate-x-[1px]"
      />

      <div className="p-3 border-b border-border flex justify-between items-center bg-bg-panel shrink-0 overflow-hidden" style={{ minWidth: rightWidth }}>
        <div className="flex items-center space-x-1">
           <button 
             title="查看对话历史" 
             onClick={() => setShowHistoryModal(true)}
             className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md hover:bg-text-primary/5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer select-none"
           >
             <Clock size={14} strokeWidth={2.5} />
             <span className="text-[12px] font-semibold tracking-wide">历史记录</span>
           </button>
           <button 
             title="新会话" 
             onClick={() => startNewSession()} 
             className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md hover:bg-text-primary/5 text-text-secondary hover:text-text-primary transition-colors cursor-pointer select-none"
           >
             <SquarePen size={14} strokeWidth={2.5} />
             <span className="text-[12px] font-semibold tracking-wide">新会话</span>
           </button>
        </div>
        <button 
          onClick={() => {
            setAiPanelOpen(false);
            aiPanelOpenRef.current = false;
          }} 
          className="text-text-secondary hover:text-text-primary transition-colors shrink-0"
        >
           <ChevronRight size={16}/>
        </button>
      </div>
      
      <OverlayScrollbarsComponent 
         ref={osRef}
         options={{ 
           scrollbars: { theme: theme === 'dark' ? 'os-theme-light' : 'os-theme-dark', autoHide: 'scroll' },
           overflow: { x: 'hidden' }
         }} 
         className="flex-1 w-full"
         defer
      >
        <div className="p-4 overflow-x-hidden flex flex-col min-h-full" style={{ minWidth: rightWidth }}>
           {messages.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 pb-16">
               <div className="w-14 h-14 bg-text-primary/5 rounded-[40%] flex items-center justify-center mb-2">
                 <Sparkles size={26} className="text-text-primary/70" />
               </div>
               <p className="text-text-primary font-semibold text-[16px] tracking-wide">今天需要什么协助？</p>
               <p className="text-text-secondary/60 text-[11px] px-4">分析异常波形 · 解析维修手册 · 派遣排障工单</p>
             </div>
           ) : (
             messages.filter(m => m.role !== 'tool').map((msg, idx, arr) => {
                const isConsecutive = idx > 0 && msg.role === arr[idx - 1].role;
                const hasText = msg.text && msg.text.trim().length > 0;
                const prevHasTools = isConsecutive && arr[idx - 1]?.toolInvocations && arr[idx - 1].toolInvocations!.length > 0;
                const marginTop = idx === 0 ? '' : (isConsecutive ? (prevHasTools && hasText ? 'mt-4' : 'mt-2') : 'mt-7');
                return (
                  <div key={idx} className={`flex w-full ${marginTop} ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 {msg.role === 'user' ? (
                   <div className="bg-bg-active text-text-primary px-4 py-2.5 rounded-2xl max-w-[85%] text-[13px] leading-relaxed break-words whitespace-pre-wrap">
                     {msg.text}
                   </div>
                 ) : (
                   <div className="w-full flex flex-col pl-1 pr-4">
                      <div className="w-full text-text-primary text-[13px] leading-relaxed break-words markdown-body">
                        {msg.text ? (
                       <ReactMarkdown remarkPlugins={[remarkGfm]}>
                         {msg.text}
                       </ReactMarkdown>
                     ) : (
                        (!msg.toolInvocations || msg.toolInvocations.length === 0) ? (
                          <div className="flex items-center gap-1.5 h-6 px-1 mt-0.5">
                            <div className="ai-typing-dot"></div>
                            <div className="ai-typing-dot"></div>
                          </div>
                        ) : null
                      )}
                      </div>
                      {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                         <div className={`flex flex-col ${(msg.text && msg.text.trim().length > 0) ? 'mt-2' : 'mt-0'} space-y-2 w-[calc(100%+8px)]`}>
                           {msg.toolInvocations.map((ti, i) => (
                              <ToolInvocationCard key={i} invocation={ti} />
                           ))}
                         </div>
                       )}
                    </div>
                  )}
                </div>
               );
             })
           )}
        </div>
      </OverlayScrollbarsComponent>

      <div className="p-4 bg-bg-base shrink-0 pb-4 relative" style={{ minWidth: rightWidth }}>
        {/* 智能滚动悬浮按钮 (类 Cursor / ChatGPT 体验) */}
        <div 
          className={`absolute left-1/2 -translate-x-1/2 -top-12 z-50 transition-all duration-300 pointer-events-none ${showScrollBottom ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
          <button 
            onClick={() => scrollToBottom('smooth')}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-panel border border-border text-text-secondary shadow-md hover:text-text-primary hover:border-text-secondary/50 transition-colors pointer-events-auto"
            title="回到最新消息"
          >
            <ArrowDown size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-col bg-bg-panel border border-border rounded-[1.25rem] shadow-sm focus-within:border-text-secondary/60 focus-within:shadow-md transition-all duration-300">
          
          <textarea 
            rows={1}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="发送波形特征分析或自由进出提问..."
            className="w-full bg-transparent resize-none px-4 pt-4 pb-2 text-[12px] text-text-primary outline-none placeholder:text-text-secondary/50 leading-relaxed hide-scroll-force"
            style={{ minHeight: '80px' }}
          />
          
          <div className="flex justify-between items-center px-3 pb-3 pt-1">
            <div className="flex items-center text-text-secondary/60 space-x-1 pl-1">
              <button title="上传异常波形或机床日志" className="p-1.5 rounded-lg hover:bg-text-primary/10 hover:text-text-primary transition-colors">
                <Paperclip size={16} strokeWidth={2.5} />
              </button>
              <button title="上传设备照片或频谱图" className="p-1.5 rounded-lg hover:bg-text-primary/10 hover:text-text-primary transition-colors">
                <ImagePlus size={16} strokeWidth={2.5} />
              </button>
            </div>
            <button 
              onClick={handleSend}
              disabled={isThinking}
              className={`h-[26px] w-[26px] flex items-center justify-center rounded-[8px] transition-all duration-300 ${inputValue.trim() && !isThinking ? 'bg-text-primary text-bg-base shadow-sm hover:scale-105 active:scale-95' : 'bg-bg-active text-text-secondary/40 cursor-default'}`}
            >
               {isThinking ? (
                 <div className="w-3.5 h-3.5 border-[2.5px] border-text-secondary/40 border-t-text-secondary rounded-full animate-spin"></div>
               ) : (
                 <ArrowUp size={14} strokeWidth={3} />
               )}
            </button>
          </div>

        </div>
      </div>

      {/* 历史记录悬浮弹窗 */}
      <div 
        className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300 ${showHistoryModal ? 'opacity-100 pointer-events-auto bg-black/40 backdrop-blur-sm' : 'opacity-0 pointer-events-none bg-black/0 backdrop-blur-none'}`}
      >
        <div 
           className={`bg-bg-base border border-border w-[580px] shadow-2xl flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ease-out ${showHistoryModal ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
        >
          <div className="h-12 border-b border-border flex items-center justify-between px-5 bg-bg-panel shrink-0">
             <div className="flex items-center space-x-2 text-text-primary">
               <FileClock size={16} />
               <span className="text-[13px] font-bold tracking-wider">对话历史</span>
             </div>
             <button onClick={() => setShowHistoryModal(false)} className="text-text-secondary hover:text-text-primary transition-colors"><X size={18}/></button>
          </div>
          
          <div className="p-0 flex flex-col max-h-[500px]">
            {/* History Header Row */}
            <div className="grid grid-cols-[3fr_5fr_140px_32px] gap-4 px-6 py-3 border-b border-border/50 bg-bg-base text-[11px] font-bold text-text-secondary tracking-widest uppercase shrink-0">
              <div>主题</div>
              <div>内容概要</div>
              <div className="text-right">时间</div>
              <div></div>
            </div>
            
            <OverlayScrollbarsComponent 
              options={{ scrollbars: { theme: theme === 'dark' ? 'os-theme-light' : 'os-theme-dark' }, overflow: { x: 'hidden' } }} 
              className="flex-1 w-full overflow-y-auto"
            >
              <div className="p-3 space-y-2 pb-6">
                 {chatMetas.filter(s => s.messageCount > 0).length === 0 ? (
                    <div className="p-3 pb-6 flex flex-col items-center justify-center min-h-[240px] opacity-50">
                        <span className="text-[11px] tracking-widest font-mono text-text-secondary uppercase mb-2">暂无研判记录历史</span>
                        <span className="text-[9px] text-text-secondary/60">对话记录将持久化保存在本地文件系统</span>
                    </div>
                 ) : (
                    chatMetas.filter(s => s.messageCount > 0).map(sess => (
                      <div 
                        key={sess.id} 
                        onClick={() => { switchToSession(sess.id); setShowHistoryModal(false); }}
                        className="grid grid-cols-[3fr_5fr_140px_32px] gap-4 px-3 py-4 rounded-xl bg-bg-panel border border-border shadow-sm hover:border-text-secondary/30 transition-colors cursor-pointer group"
                      >
                        <div className="flex flex-col justify-center min-w-0">
                          <span className="text-[12px] font-bold text-text-primary truncate">
                            {sess.title}
                          </span>
                          <span className="text-[10px] text-text-secondary/70 truncate mt-1">#{sess.id}</span>
                        </div>
                        <div className="flex items-start space-x-2 min-w-0">
                          <MessageSquare size={14} className="text-text-secondary/50 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                            {sess.summary}
                          </p>
                        </div>
                        <div className="flex items-center justify-end">
                          <span className="text-[11px] font-mono font-medium text-text-secondary/70 group-hover:text-text-primary transition-colors text-right whitespace-nowrap">
                            {new Date(sess.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-center">
                          <button 
                            title="删除此会话"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (activeChatId === sess.id) {
                                setActiveChatId(null);
                                setMessages([]);
                              }
                              window.api.chat.delete(sess.id);
                              setChatMetas(prev => prev.filter(s => s.id !== sess.id));
                            }}
                            className="p-1 rounded-md text-text-secondary/40 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                 )}
              </div>
            </OverlayScrollbarsComponent>
          </div>

          <div className="h-14 border-t border-border bg-bg-active/30 flex items-center justify-end px-5 space-x-3 shrink-0">
             <button onClick={() => setShowHistoryModal(false)} className="px-5 py-1.5 text-[12px] font-bold text-bg-base bg-text-primary hover:opacity-90 rounded-lg transition-all active:scale-95 shadow-sm">关闭</button>
          </div>
        </div>
      </div>
    </div>
  );
};
