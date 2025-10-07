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
      getFlashcards: (pattern: string) => Promise<Flashcard[]>
      saveFlashcardSession: (session: FlashcardSession) => Promise<string>
      getFlashcardSessions: () => Promise<string[]>
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
    toggleSidebar: string
  }
  theme: 'dark' | 'light'
  fontSize: number
  notesDirectory: string | null
  recentDirectories: string[]
}

export interface Flashcard {
  id: string
  question: string
  expectedAnswer: string
  source: string
  keywords: string[]
}

export interface FlashcardResult {
  cardId: string
  question: string
  expectedAnswer: string
  userAnswer: string
  keywords: string[]
  timestamp: string
}

export interface FlashcardSession {
  id: string
  pattern: string
  cards: Flashcard[]
  results: FlashcardResult[]
  createdAt: string
  completedAt?: string
}