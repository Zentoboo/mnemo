import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getNotes: () => Promise<Note[]>
      readNote: (filename: string) => Promise<string>
      writeNote: (filename: string, content: string) => Promise<{ success: boolean }>
      createNote: (hierarchy: string[]) => Promise<string>
      deleteNote: (filename: string) => Promise<{ success: boolean }>
      selectNotesDirectory: () => Promise<string | null>
      getCurrentDirectory: () => Promise<string | null>
      getSettings: () => Promise<Settings>
      updateSettings: (settings: Partial<Settings>) => Promise<Settings>
      resetSettings: () => Promise<Settings>
    }
  }
}

export interface Note {
  filename: string
  hierarchy: string[]
  path: string
  fullPath: string
}

export interface Settings {
  shortcuts: {
    openCommandPalette: string
    saveNote: string
    refreshNotes: string
    openSettings: string
  }
  theme: 'dark' | 'light'
  fontSize: number
  notesDirectory: string | null
  recentDirectories: string[]
}