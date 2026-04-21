import { ElectronAPI } from '@electron-toolkit/preload'

interface StoreAPI {
  get: (key: string) => Promise<any>
  set: (key: string, val: any) => Promise<void>
  getAll: () => Promise<Record<string, any>>
}

interface ChatAPI {
  save: (session: any) => Promise<void>
  load: (id: string) => Promise<any>
  delete: (id: string) => Promise<void>
  list: () => Promise<any[]>
}

interface DiTingAPI {
  store: StoreAPI
  chat: ChatAPI
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: DiTingAPI
  }
}
