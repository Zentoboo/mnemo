import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Notes APIs
  getNotes: () => ipcRenderer.invoke('notes:getAll'),
  readNote: (filename: string) => ipcRenderer.invoke('notes:read', filename),
  writeNote: (filename: string, content: string) => 
    ipcRenderer.invoke('notes:write', filename, content),
  createNote: (hierarchy: string[]) => 
    ipcRenderer.invoke('notes:create', hierarchy),
  deleteNote: (filename: string) => 
    ipcRenderer.invoke('notes:delete', filename),
  
  // Settings APIs
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  resetSettings: () => ipcRenderer.invoke('settings:reset')
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