import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import CommandPalette from './components/CommandPalette'
import Settings from './components/Settings'
import DirectorySelector from './components/DirectorySelector'
import FlashcardView from './components/FlashcardView'
import { parseShortcut, formatShortcut } from './utils/keyboard'
import './App.css'
import Icon from './components/Icon'
import ToggleSwitch from './components/ToggleSwitch'

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
  const [viewMode, setViewMode] = useState('edit')

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
        alert(`No flashcards found matching pattern: ${pattern}`)
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
        alert('Failed to load flashcards. Make sure your notes have ## headers for questions.')
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

      alert(`Session completed! Results saved to: ${savedFilename}`)
    } catch (error) {
      console.error('Failed to save flashcard session:', error)
      alert('Failed to save session results')
    }
  }

  const handleCancelFlashcard = () => {
    if (confirm('Are you sure you want to cancel this flashcard session? Progress will not be saved.')) {
      setIsFlashcardMode(false)
      setFlashcardSession(null)
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
      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        notes={notes}
        onSelectNote={handleSelectNote}
        onCreateNote={handleCreateNote}
        onStartFlashcard={handleStartFlashcard}
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
              ) : selectedNote ? (
                <>
                  <div className="editor-header">
                    <h2>{selectedNote.replace('.md', '').split('.').join(' > ')}</h2>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <ToggleSwitch
                        options={[
                          { value: 'edit', label: 'edit' },
                          { value: 'view', label: 'view' }
                        ]}
                        name="view-mode"
                        selected={viewMode}
                        onChange={setViewMode}
                      />
                      <button
                        onClick={handleSaveNote}
                        className="header-settings-btn"
                        title={`Save${settings ? ` (${formatShortcut(settings.shortcuts.saveNote)})` : ''}`}
                      >
                        <Icon name="save" size={20} />
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="editor-textarea"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Start writing..."
                    style={{
                      fontSize: settings ? `${settings.fontSize}px` : '14px'
                    }}
                  />
                </>
              ) : (
                <div className="editor-empty">
                  <h2>Welcome to Mnemo</h2>
                  <p>
                    Press <kbd>{settings ? formatShortcut(settings.shortcuts.openCommandPalette) : 'Ctrl+K'}</kbd> to create or search for notes
                  </p>
                  <p className="hint">Try creating: <code>mathematics.calculus</code></p>
                  <p className="hint">Start flashcards: <code>&gt;flashcard:biology.*</code></p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default App