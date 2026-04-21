import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  store: {
    get: (key: string) => ipcRenderer.invoke('store-get', key),
    set: (key: string, val: any) => ipcRenderer.invoke('store-set', key, val),
    getAll: () => ipcRenderer.invoke('store-get-all')
  },
  chat: {
    save: (session: any) => ipcRenderer.invoke('chat-save', session),
    load: (id: string) => ipcRenderer.invoke('chat-load', id),
    delete: (id: string) => ipcRenderer.invoke('chat-delete', id),
    list: () => ipcRenderer.invoke('chat-list')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
