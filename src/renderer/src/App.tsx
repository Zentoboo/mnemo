import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import CommandPalette from './components/CommandPalette'
import Settings from './components/Settings'
import DirectorySelector from './components/DirectorySelector'
import FlashcardView from './components/FlashcardView'
import Editor from './components/Editor'
import Notification from './components/Notification'
import { parseShortcut } from './utils/keyboard'
import './App.css'

interface Note {
  filename: string
  hierarchy: string[]
  path: string
}

interface Flashcard {
  id: string
  question: string
  expectedAnswer: string
  source: string
  keywords: string[]
}

interface FlashcardResult {
  cardId: string
  question: string
  expectedAnswer: string
  userAnswer: string
  keywords: string[]
  timestamp: string
}

interface FlashcardSession {
  id: string
  pattern: string
  cards: Flashcard[]
  results: FlashcardResult[]
  createdAt: string
  completedAt?: string
}

interface AppSettings {
  shortcuts: {
    openCommandPalette: string
    saveNote: string
    refreshNotes: string
    openSettings: string
    toggleSidebar: string
    boldText: string
    italicText: string
  }
  theme: 'dark' | 'light'
  fontSize: number
  notesDirectory: string | null
  recentDirectories: string[]
}

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState<string>('')
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [showDirectorySelector, setShowDirectorySelector] = useState(true)
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)

  const [flashcardSession, setFlashcardSession] = useState<FlashcardSession | null>(null)
  const [isFlashcardMode, setIsFlashcardMode] = useState(false)

  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
  } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (!settings || showDirectorySelector) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const sidebarShortcut = parseShortcut(settings.shortcuts.toggleSidebar)
      if (sidebarShortcut.matches(e)) {
        e.preventDefault()
        setShowSidebar(prev => !prev)
        return
      }

      const paletteShortcut = parseShortcut(settings.shortcuts.openCommandPalette)
      if (paletteShortcut.matches(e)) {
        e.preventDefault()
        setIsPaletteOpen(true)
        return
      }

      const saveShortcut = parseShortcut(settings.shortcuts.saveNote)
      if (saveShortcut.matches(e)) {
        e.preventDefault()
        if (selectedNote) {
          handleSaveNote()
        }
        return
      }

      const refreshShortcut = parseShortcut(settings.shortcuts.refreshNotes)
      if (refreshShortcut.matches(e)) {
        e.preventDefault()
        loadNotes()
        return
      }

      const settingsShortcut = parseShortcut(settings.shortcuts.openSettings)
      if (settingsShortcut.matches(e)) {
        e.preventDefault()
        setIsSettingsOpen(true)
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settings, selectedNote, noteContent, showDirectorySelector, showSidebar])

  const loadSettings = async () => {
    const data = await window.api.getSettings()
    setSettings(data)
  }

  const loadNotes = async () => {
    try {
      const notesList = await window.api.getNotes()
      setNotes(notesList)
    } catch (error) {
      console.error('Failed to load notes:', error)
    }
  }

  const handleSelectNote = async (filename: string) => {
    try {
      const content = await window.api.readNote(filename)
      setSelectedNote(filename)
      setNoteContent(content)
      setIsFlashcardMode(false)
    } catch (error) {
      console.error('Failed to read note:', error)
    }
  }

  const handleCreateNote = async (hierarchy: string[]) => {
    try {
      const filename = await window.api.createNote(hierarchy)
      await loadNotes()
      await handleSelectNote(filename)
    } catch (error) {
      console.error('Failed to create note:', error)
    }
  }

  const handleSaveNote = async () => {
    if (!selectedNote) return

    try {
      await window.api.writeNote(selectedNote, noteContent)
      console.log('Note saved!')
    } catch (error) {
      console.error('Failed to save note:', error)
    }
  }

  const handleStartFlashcard = async (pattern: string) => {
    try {
      const cards = await window.api.getFlashcards(pattern)

      if (cards.length === 0) {
        setNotification({
          message: `No flashcards found matching pattern: ${pattern}`,
          type: 'error'
        })
        return
      }

      const session: FlashcardSession = {
        id: `session-${Date.now()}`,
        pattern,
        cards,
        results: [],
        createdAt: new Date().toISOString()
      }

      setFlashcardSession(session)
      setIsFlashcardMode(true)
      setSelectedNote(null)
    } catch (error) {
      console.error('Failed to start flashcard session:', error)
      setIsPaletteOpen(false)
      setTimeout(() => {
        setNotification({
          message: 'Failed to load flashcards. Make sure your notes have ## headers for questions.',
          type: 'error'
        })
      }, 100)
    }
  }

  const handleCompleteFlashcard = async (results: FlashcardResult[]) => {
    if (!flashcardSession) return

    const completedSession: FlashcardSession = {
      ...flashcardSession,
      results,
      completedAt: new Date().toISOString()
    }

    try {
      const savedFilename = await window.api.saveFlashcardSession(completedSession)
      console.log('Flashcard session saved:', savedFilename)

      setIsFlashcardMode(false)
      setFlashcardSession(null)

      await loadNotes()

      setNotification({
        message: `Session completed! Results saved to: ${savedFilename}`,
        type: 'success'
      })
    } catch (error) {
      console.error('Failed to save flashcard session:', error)
      setNotification({
        message: 'Failed to save session results',
        type: 'error'
      })
    }
  }

  const handleCancelFlashcard = () => {
    setIsFlashcardMode(false)
    setFlashcardSession(null)
  }

  const handleDeleteNote = async (filename: string) => {
    try {
      await window.api.deleteNote(filename)

      // If the deleted note was selected, clear selection
      if (selectedNote === filename) {
        setSelectedNote(null)
        setNoteContent('')
      }

      // Refresh notes list
      await loadNotes()

      setNotification({
        message: `Note "${filename}" deleted successfully`,
        type: 'success'
      })
    } catch (error) {
      console.error('Failed to delete note:', error)
      setNotification({
        message: 'Failed to delete note',
        type: 'error'
      })
    }
  }

  const handleDirectorySelected = async (path: string) => {
    setCurrentDirectory(path)
    setShowDirectorySelector(false)
    await loadSettings()
    await loadNotes()
  }

  const handleDirectoryChange = async () => {
    setShowDirectorySelector(true)
    setCurrentDirectory(null)
  }

  if (showDirectorySelector && settings) {
    return (
      <DirectorySelector
        recentDirectories={settings.recentDirectories}
        onSelectDirectory={handleDirectorySelected}
      />
    )
  }

  return (
    <>
      <Notification
        isOpen={notification !== null}
        message={notification?.message || ''}
        type={notification?.type || 'info'}
        onClose={() => setNotification(null)}
      />

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        notes={notes}
        selectedNote={selectedNote}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onStartFlashcard={handleStartFlashcard}
        onDeleteNote={handleDeleteNote}
      />

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false)
          loadSettings()
        }}
        onDirectoryChange={handleDirectoryChange}
      />

      <div className="app-container">
        <div className="app-layout">
          <Header
            title="Mnemo"
            onSettingsClick={() => setIsSettingsOpen(true)}
            onCommandPaletteClick={() => setIsPaletteOpen(true)}
            settingsShortcut={settings?.shortcuts.openSettings}
            commandPaletteShortcut={settings?.shortcuts.openCommandPalette}
            sidebarShortcut={settings?.shortcuts.toggleSidebar}
            showSidebar={showSidebar}
            onToggleSidebar={setShowSidebar}
          />

          <div className="app-content">
            {showSidebar && (
              <Sidebar
                notes={notes}
                selectedNote={selectedNote}
                currentDirectory={currentDirectory}
                refreshShortcut={settings?.shortcuts.refreshNotes}
                onNoteSelect={handleSelectNote}
                onRefresh={loadNotes}
                onDirectoryChange={handleDirectoryChange}
                onDeleteNote={handleDeleteNote}
              />
            )}

            <div className="editor">
              {isFlashcardMode && flashcardSession ? (
                <FlashcardView
                  cards={flashcardSession.cards}
                  pattern={flashcardSession.pattern}
                  onComplete={handleCompleteFlashcard}
                  onCancel={handleCancelFlashcard}
                />
              ) : (
                <Editor
                  selectedNote={selectedNote}
                  noteContent={noteContent}
                  onNoteContentChange={setNoteContent}
                  onSave={handleSaveNote}
                  saveShortcut={settings?.shortcuts.saveNote}
                  fontSize={settings?.fontSize || 14}
                  commandPaletteShortcut={settings?.shortcuts.openCommandPalette}
                  boldShortcut={settings?.shortcuts.boldText}
                  italicShortcut={settings?.shortcuts.italicText}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App