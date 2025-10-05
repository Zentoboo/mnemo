import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  getNotes: () => ipcRenderer.invoke('notes:getAll'),
  readNote: (filename: string) => ipcRenderer.invoke('notes:read', filename),
  writeNote: (filename: string, content: string) => 
    ipcRenderer.invoke('notes:write', filename, content),
  createNote: (hierarchy: string[]) => 
    ipcRenderer.invoke('notes:create', hierarchy),
  deleteNote: (filename: string) => 
    ipcRenderer.invoke('notes:delete', filename),
  selectNotesDirectory: () => ipcRenderer.invoke('notes:selectDirectory'),
  getCurrentDirectory: () => ipcRenderer.invoke('notes:getCurrentDirectory'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  updateSettings: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  resetSettings: () => ipcRenderer.invoke('settings:reset')
}

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