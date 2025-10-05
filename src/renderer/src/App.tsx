import { useState, useEffect } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import CommandPalette from './components/CommandPalette'
import Settings from './components/Settings'
import DirectorySelector from './components/DirectorySelector'
import { parseShortcut, formatShortcut } from './utils/keyboard'
import './App.css'
import Icon from './components/Icon'

interface Note {
  filename: string
  hierarchy: string[]
  path: string
}

interface AppSettings {
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

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState<string>('')
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [showDirectorySelector, setShowDirectorySelector] = useState(true)
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (!settings || showDirectorySelector) return

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [settings, selectedNote, noteContent, showDirectorySelector])

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
          />

          <div className="app-content">
            <Sidebar
              notes={notes}
              selectedNote={selectedNote}
              currentDirectory={currentDirectory}
              refreshShortcut={settings?.shortcuts.refreshNotes}
              onNoteSelect={handleSelectNote}
              onRefresh={loadNotes}
              onDirectoryChange={handleDirectoryChange}
            />

            <div className="editor">
              {selectedNote ? (
                <>
                  <div className="editor-header">
                    <h2>{selectedNote.replace('.md', '').split('.').join(' > ')}</h2>
                    <button
                      onClick={handleSaveNote}
                      className="header-settings-btn"
                      title={`Save${settings ? ` (${formatShortcut(settings.shortcuts.saveNote)})` : ''}`}
                    >
                      <Icon name="save" size={20} />
                    </button>
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