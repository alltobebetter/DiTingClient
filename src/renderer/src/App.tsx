import { useState, useEffect } from 'react'
import { Sparkles, Zap } from 'lucide-react'
import { useMqttStream } from './hooks/useMqttStream'
import { PrimarySidebar } from './components/layout/PrimarySidebar'
import { SecondaryPanel } from './components/layout/SecondaryPanel'
import { MainWorkspace } from './components/layout/MainWorkspace'
import { RightPanel } from './components/layout/RightPanel'
import { StatusBar } from './components/layout/StatusBar'
import { AddDeviceModal } from './components/features/AddDeviceModal'
import { EditDeviceModal } from './components/features/EditDeviceModal'
import { AppCloseModal } from './components/features/AppCloseModal'
import { ExportWaveformModal } from './components/features/ExportWaveformModal'
import { DeleteAlertModal } from './components/features/DeleteAlertModal'
import { DeleteDeviceModal } from './components/features/DeleteDeviceModal'
import { DeleteTicketModal } from './components/features/DeleteTicketModal'
import { useAppLayout } from './hooks/useAppLayout'
import { useAlertWatchdog } from './hooks/useAlertWatchdog'
import 'overlayscrollbars/overlayscrollbars.css'

import { Device, Alert, Ticket, ChatSessionMeta } from './types'

const App = () => {
  const [isStoreLoaded, setIsStoreLoaded] = useState(false)
  
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [activeMenu, setActiveMenu] = useState('monitor')
  const [activeWorkspace, setActiveWorkspace] = useState<'dashboard' | 'search' | 'alert-details' | 'ticket-details'>('dashboard')
  const [searchMode, setSearchMode] = useState<'threshold' | 'semantic' | 'replay'>('threshold')

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicketId, setSelectedTicketId] = useState('')

  const [chatMetas, setChatMetas] = useState<ChatSessionMeta[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [selectedAlertId, setSelectedAlertId] = useState('')
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [showDeleteAlertModal, setShowDeleteAlertModal] = useState(false)
  const [deletingAlertId, setDeletingAlertId] = useState('')
  const [showDeleteTicketModal, setShowDeleteTicketModal] = useState(false)
  const [deletingTicketId, setDeletingTicketId] = useState('')

  const handleConfirmDeleteAlert = () => {
    setAlerts(prev => prev.filter(a => a.id !== deletingAlertId));
    setShowDeleteAlertModal(false);
    if (selectedAlertId === deletingAlertId) {
      setActiveWorkspace('dashboard');
    }
  };

  const defaultConfig = {
    aiBase: '',
    apiKey: '',
    aiModel: '',
    autoReport: true,
    useStream: true,
    mqttBroker: 'mqtt://127.0.0.1:1883',
    inferenceThreshold: 85,
    chartWindowSize: 60
  };

  const [config, setConfig] = useState(defaultConfig)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)
  const [newDevice, setNewDevice] = useState<Device>({ id: '', name: '', ip: '', status: 'offline', model: '', lastSeen: '', type: 'iot' })
  const [isEditing, setIsEditing] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  
  const [showDeleteDeviceModal, setShowDeleteDeviceModal] = useState(false)
  const [deletingDeviceId, setDeletingDeviceId] = useState('')

  const [leftWidth, setLeftWidth] = useState(240)
  const [rightWidth, setRightWidth] = useState(320)

  // System Persistence Hydration
  useEffect(() => {
    window.api.store.getAll().then((data: any) => {
      if (data.theme) setTheme(data.theme)
      if (data.sidebarOpen !== undefined) setSidebarOpen(data.sidebarOpen)
      if (data.activeMenu) setActiveMenu(data.activeMenu)
      if (data.activeWorkspace) setActiveWorkspace(data.activeWorkspace)
      if (data.searchMode) setSearchMode(data.searchMode)
      if (data.config) setConfig({ ...defaultConfig, ...data.config })
      if (data.alerts && data.alerts.length > 0) {
        setAlerts(data.alerts)
      }
      if (data.devices) setDevices(data.devices)
      if (data.tickets) setTickets(data.tickets)
      if (data.activeChatId) setActiveChatId(data.activeChatId)
      if (data.selectedDeviceId) setSelectedDeviceId(data.selectedDeviceId)
      if (data.selectedTicketId) setSelectedTicketId(data.selectedTicketId)
      if (data.leftWidth) setLeftWidth(data.leftWidth)
      if (data.rightWidth) setRightWidth(data.rightWidth)
      if (data.aiPanelOpen !== undefined) setAiPanelOpen(data.aiPanelOpen)
      // Load chat session metas from file system
      window.api.chat.list().then((metas: ChatSessionMeta[]) => setChatMetas(metas));
      setIsStoreLoaded(true)
    })
  }, [])

  // Window Close Interception
  useEffect(() => {
    if (window.electron && window.electron.ipcRenderer) {
      const handleCloseRequest = () => setShowCloseModal(true)
      window.electron.ipcRenderer.on('app-close-requested', handleCloseRequest)
      return () => {
        window.electron.ipcRenderer.removeAllListeners('app-close-requested')
      }
    }
    return undefined
  }, [])

  const handleConfirmClose = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('app-close-confirmed')
    }
  }

  // System Auto-Flush state
  useEffect(() => {
    if (!isStoreLoaded) return;
    const s = window.api.store;
    s.set('theme', theme);
    s.set('sidebarOpen', sidebarOpen);
    s.set('activeMenu', activeMenu);
    s.set('activeWorkspace', activeWorkspace);
    s.set('searchMode', searchMode);
    s.set('config', config);
    s.set('alerts', alerts);
    s.set('tickets', tickets);
    s.set('activeChatId', activeChatId);
    s.set('devices', devices);
    s.set('selectedDeviceId', selectedDeviceId);
    s.set('selectedTicketId', selectedTicketId);
    s.set('leftWidth', leftWidth);
    s.set('rightWidth', rightWidth);
    s.set('aiPanelOpen', aiPanelOpen);
  }, [isStoreLoaded, theme, sidebarOpen, activeMenu, activeWorkspace, searchMode, config, alerts, tickets, activeChatId, devices, selectedDeviceId, selectedTicketId, leftWidth, rightWidth, aiPanelOpen]);

  const handleGenerateTicket = (payload: { title: string, content: string }) => {
    const newTicket: Ticket = {
      id: 'TK-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      title: payload.title,
      content: payload.content,
      timestamp: Date.now()
    };
    setTickets(prev => [newTicket, ...prev]);
    setSelectedTicketId(newTicket.id);
    setActiveWorkspace('ticket-details');
    setActiveMenu('tickets');
    if (!sidebarOpen) {
       setSidebarOpen(true);
       sidebarOpenRef.current = true;
    }
  };

  const handleDeleteTicketRequest = (id: string) => {
    setDeletingTicketId(id);
    setShowDeleteTicketModal(true);
  };

  const handleConfirmDeleteTicket = () => {
    setTickets(prev => prev.filter(t => t.id !== deletingTicketId));
    if (selectedTicketId === deletingTicketId) {
       setActiveWorkspace('dashboard');
       setSelectedTicketId('');
    }
    setShowDeleteTicketModal(false);
  };

  const handleSaveDevice = () => {
    if (!newDevice.id || !newDevice.name) return;
    const deviceToAdd = { ...newDevice, status: 'offline' as 'offline', model: 'pending', lastSeen: 'Never', ip: newDevice.ip || '0.0.0.0', type: newDevice.type || 'iot' }
    setDevices(prev => [deviceToAdd, ...prev]);
    if (devices.length === 0) {
      setSelectedDeviceId(deviceToAdd.id);
    }
    setIsAdding(false);
    setNewDevice({ id: '', name: '', ip: '', status: 'offline', model: '', lastSeen: '', type: 'iot' });

    // 只有移动探针才需要自动弹开编辑面板看二维码
    if (deviceToAdd.type === 'mobile') {
      setEditingDevice(deviceToAdd);
      setIsEditing(true);
    }
  };

  const handleDeleteDevice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingDeviceId(id);
    setShowDeleteDeviceModal(true);
  };

  const handleConfirmDeleteDevice = () => {
    const remainingDevices = devices.filter(d => d.id !== deletingDeviceId);
    setDevices(remainingDevices);
    
    // 如果删除的是当前选中的设备，自动回退到第一个设备，以保证与内容区的 fallback 逻辑同步
    if (deletingDeviceId === selectedDeviceId) {
      setSelectedDeviceId(remainingDevices.length > 0 ? remainingDevices[0].id : '');
    }
    setShowDeleteDeviceModal(false);
  };

  const handleEditDevice = (device: Device, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingDevice(device)
    setIsEditing(true)
  }

  const handleUpdateDevice = () => {
    if (!editingDevice || !editingDevice.id || !editingDevice.name) return;
    setDevices(prev => prev.map(d => d.id === editingDevice.id ? { ...d, name: editingDevice.name, ip: editingDevice.ip || '0.0.0.0' } : d));
    setIsEditing(false);
    setEditingDevice(null);
  };



  const activeDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

  // 挂载高频实时震动曲线接收端 (基于MQTT/IPC流)，同时下发全局心跳状态
  const { score, latency, bandwidth, waveData, isStreaming, uptime, globalOnlineMap, isPaused, pauseStream, resumeStream, exportWaveformBuffer } = useMqttStream(activeDevice ? activeDevice.id : '', true, config.chartWindowSize);

  // 告警监控看门狗 (Alert Watchdog)
  useAlertWatchdog({ activeDevice, isStreaming, score, config, alerts, setAlerts, exportWaveformBuffer });

  // 全局设备状态同步：不再只对 activeDevice，而是对所有设备
  useEffect(() => {
    if (!isStoreLoaded) return;
    setDevices(prev => {
      let changed = false;
      const nextRaw = prev.map(d => {
        const isOnline = globalOnlineMap[d.id] === true;
        const newStatus: 'online' | 'offline' = isOnline ? 'online' : 'offline';
        if (d.status !== newStatus) {
           changed = true;
           return { ...d, status: newStatus, lastSeen: isOnline ? new Date().toLocaleString() : d.lastSeen };
        }
        return d;
      });
      return changed ? nextRaw : prev;
    });
  }, [globalOnlineMap, isStoreLoaded]);

  // UI与窗口伸缩管理引擎
  const { 
    isDraggingLeft, setIsDraggingLeft, isDraggingRight, setIsDraggingRight,
    safeOpenLeftSidebar, safeOpenRightSidebar, aiPanelOpenRef,
    sidebarOpenRef, activeMenuRef
  } = useAppLayout({
    activeMenu, sidebarOpen, aiPanelOpen, leftWidth, rightWidth,
    setSidebarOpen, setAiPanelOpen, setLeftWidth, setRightWidth
  });

  useEffect(() => {
    const handleTheme = () => {
      const isDarkDesktop = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const effectiveTheme = theme === 'system' ? (isDarkDesktop ? 'dark' : 'light') : theme;
      
      if (effectiveTheme === 'dark') {
        document.documentElement.classList.add('dark')
        window.electron?.ipcRenderer?.send('theme-changed', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        window.electron?.ipcRenderer?.send('theme-changed', 'light')
      }
    };

    handleTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => { if (theme === 'system') handleTheme(); };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  }

  const handleMenuClick = (menu: string) => {
    if (sidebarOpen && activeMenu === menu) {
      setSidebarOpen(false)
      sidebarOpenRef.current = false
    } else {
      setActiveMenu(menu)
      activeMenuRef.current = menu
      if (!sidebarOpen) {
        safeOpenLeftSidebar()
      }
    }
  }

  const isMenuSelected = (menu: string) => sidebarOpen && activeMenu === menu;

  if (!isStoreLoaded) {
    // 强制等待底层无感数据桥接完成
    return <div className="h-screen w-screen bg-bg-base" />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-bg-base text-text-primary overflow-hidden">
      
      {/* --- 自定义原生顶部拖拽栏 (Custom Titlebar) --- */}
      <div 
        className="h-[36px] shrink-0 w-full flex items-center justify-between pl-3 pr-0 bg-bg-panel border-b border-border z-50 select-none"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center space-x-2 opacity-80 pl-2">
            <Zap size={15} strokeWidth={2.5} />
            <span className="text-[12px] font-semibold tracking-widest uppercase whitespace-nowrap">谛听边缘物联终端</span>
        </div>

        <div className="flex items-center h-full">
          <button 
            style={{ WebkitAppRegion: 'no-drag' } as any}
            onClick={() => {
              if (aiPanelOpen) {
                setAiPanelOpen(false);
                aiPanelOpenRef.current = false;
              } else {
                safeOpenRightSidebar();
              }
            }}
            title="AI 智能辅助"
            className={`h-full w-[46px] flex items-center justify-center transition-opacity duration-200 ${aiPanelOpen ? 'text-text-primary opacity-100' : 'text-text-secondary opacity-70 hover:text-text-primary hover:opacity-100'}`}
          >
            <Sparkles size={15} strokeWidth={2} />
          </button>
          
          <div className="h-full px-1.5 flex items-center">
             <div className="h-[16px] w-[1px] bg-border opacity-60"></div>
          </div>
          
          <div className="w-[138px] h-full"></div>
        </div>
      </div>

      {/* --- 主体下半截布局区 (Main Layout below Titlebar) --- */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        
        {/* 1. 最左活动栏 (Activity Bar) */}
        <PrimarySidebar 
          theme={theme}
          toggleTheme={toggleTheme}
          handleMenuClick={handleMenuClick}
          isMenuSelected={isMenuSelected}
          hasUnreadAlerts={alerts.some(a => a.status === 'unhandled')}
        />

        {/* 2. 二级边栏 (Explorer / Options) */}
        <SecondaryPanel 
          theme={theme}
          leftWidth={leftWidth}
          activeMenu={activeMenu}
          sidebarOpen={sidebarOpen}
          activeWorkspace={activeWorkspace}
          searchMode={searchMode}
          alerts={alerts}
          tickets={tickets}
          devices={devices}
          selectedAlertId={selectedAlertId}
          selectedTicketId={selectedTicketId}
          selectedDeviceId={activeDevice?.id || ''} // 强制与主内核心区 activeDevice 保持严格统一
          config={config}
          setIsAdding={setIsAdding}
          setSearchMode={setSearchMode}
          setActiveWorkspace={setActiveWorkspace}
          setSelectedAlertId={setSelectedAlertId}
          setSelectedTicketId={setSelectedTicketId}
          setSelectedDeviceId={setSelectedDeviceId}
          setConfig={setConfig}
          handleDeleteDevice={handleDeleteDevice}
          handleEditDevice={handleEditDevice}
          setActiveMenu={setActiveMenu}
          isDraggingLeft={isDraggingLeft}
        />
        <div 
          onMouseDown={() => setIsDraggingLeft(true)}
          className={`absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-text-primary/50 z-50 ${isDraggingLeft ? '' : 'transition-all duration-300 ease-in-out'}`}
          style={{ left: (sidebarOpen && activeMenu) ? leftWidth + 48 : 48 }}
        />

        {/* 3. 中间核心工作区 (Editor / Canvas) 一律呈现可视化与控制台 */}
        <MainWorkspace
          activeWorkspace={activeWorkspace}
          searchMode={searchMode}
          selectedAlertId={selectedAlertId}
          selectedTicketId={selectedTicketId}
          alerts={alerts}
          tickets={tickets}
          onReadAlert={(id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'read' as const } : a))}
          onDeleteAlert={(id) => { setDeletingAlertId(id); setShowDeleteAlertModal(true); }}
          onDeleteTicket={handleDeleteTicketRequest}
          activeDevice={activeDevice}
          waveData={waveData}
          score={score}
          latency={latency}
          bandwidth={bandwidth}
          uptime={uptime}
          safeOpenRightSidebar={safeOpenRightSidebar}
          aiPanelOpenRef={aiPanelOpenRef}
          isPaused={isPaused}
          pauseStream={pauseStream}
          resumeStream={resumeStream}
          onOpenExport={() => setExportModalOpen(true)}
        />

        {/* 4. 最右侧伸缩边栏 (AI Copilot Panel) */}
        <RightPanel 
          aiPanelOpen={aiPanelOpen}
          rightWidth={rightWidth}
          setIsDraggingRight={setIsDraggingRight}
          setAiPanelOpen={setAiPanelOpen}
          aiPanelOpenRef={aiPanelOpenRef}
          isDraggingRight={isDraggingRight}
          theme={theme}
          config={config}
          setConfig={setConfig}
          devices={devices}
          alerts={alerts}
          tickets={tickets}
          chatMetas={chatMetas}
          setChatMetas={setChatMetas}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          onGenerateTicket={handleGenerateTicket}
        />

      </div>

      {/* 5. 底部极窄状态栏 (Status Bar) */}
      <StatusBar activeDevice={activeDevice} />

      {/* --- 全局绝对定级悬浮弹窗 (Modal Base) --- */}
      <AddDeviceModal 
        isAdding={isAdding}
        setIsAdding={setIsAdding}
        newDevice={newDevice}
        setNewDevice={setNewDevice}
        handleSaveDevice={handleSaveDevice}
      />

      <EditDeviceModal 
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        editingDevice={editingDevice}
        setEditingDevice={setEditingDevice}
        handleUpdateDevice={handleUpdateDevice}
      />

      <AppCloseModal 
        isOpen={showCloseModal} 
        onClose={() => setShowCloseModal(false)} 
        onConfirm={handleConfirmClose} 
      />

      <ExportWaveformModal 
        isOpen={exportModalOpen} 
        onClose={() => setExportModalOpen(false)} 
        exportWaveformBuffer={exportWaveformBuffer} 
        defaultWindowSize={config.chartWindowSize} 
      />

      <DeleteAlertModal 
        isOpen={showDeleteAlertModal} 
        onClose={() => setShowDeleteAlertModal(false)} 
        onConfirm={handleConfirmDeleteAlert} 
      />

      <DeleteDeviceModal 
        isOpen={showDeleteDeviceModal} 
        onClose={() => setShowDeleteDeviceModal(false)} 
        onConfirm={handleConfirmDeleteDevice} 
      />

      <DeleteTicketModal
        isOpen={showDeleteTicketModal} 
        onClose={() => setShowDeleteTicketModal(false)} 
        onConfirm={handleConfirmDeleteTicket} 
      />

    </div>
  )
}

export default App

