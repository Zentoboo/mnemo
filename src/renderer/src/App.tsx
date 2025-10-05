import { useState, useEffect } from 'react'
import CommandPalette from './components/CommandPalette'
import Settings from './components/Settings'
import DirectorySelector from './components/DirectorySelector'
import { parseShortcut, formatShortcut } from './utils/keyboard'
import './App.css'

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
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Notes</h2>
            <button
              className="icon-button"
              onClick={() => setIsSettingsOpen(true)}
              title={`Settings (${settings ? formatShortcut(settings.shortcuts.openSettings) : 'Ctrl+,'})`}
            >
              Settings
            </button>
          </div>

          {currentDirectory && (
            <div className="directory-info">
              <div className="current-directory" title={currentDirectory}>
                📁 {currentDirectory.split(/[/\\]/).pop()}
              </div>
              <button onClick={handleDirectoryChange} className="change-dir-btn">
                Change
              </button>
            </div>
          )}

          <div className="tools">
            <button onClick={() => setIsPaletteOpen(true)} title={`Command Palette (${settings ? formatShortcut(settings.shortcuts.openCommandPalette) : 'Ctrl+K'})`}>
              Search
            </button>
            <button onClick={loadNotes} title={`Refresh (${settings ? formatShortcut(settings.shortcuts.refreshNotes) : 'Ctrl+R'})`}>
              Refresh
            </button>
          </div>

          <div className="notes-list">
            {notes.length === 0 ? (
              <p className="empty-state">
                No notes yet. Press {settings ? formatShortcut(settings.shortcuts.openCommandPalette) : 'Ctrl+K'} to create one!
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.filename}
                  className={`note-item ${selectedNote === note.filename ? 'active' : ''}`}
                  onClick={() => handleSelectNote(note.filename)}
                >
                  <div className="note-title">
                    {note.filename.replace('.md', '')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="editor">
          {selectedNote ? (
            <>
              <div className="editor-header">
                <h2>{selectedNote.replace('.md', '').split('.').join(' > ')}</h2>
                <button onClick={handleSaveNote} className="save-button" title={`Save (${settings ? formatShortcut(settings.shortcuts.saveNote) : 'Ctrl+S'})`}>
                  Save
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
    </>
  )
}

export default App