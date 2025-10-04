import { useState, useEffect } from 'react'
import CommandPalette from './components/CommandPalette'
import Settings from './components/Settings'
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
  }
  theme: 'dark' | 'light'
  fontSize: number
}

function App() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState<string>('')
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    // Load initial data
    loadNotes()
    loadSettings()
  }, [])

  useEffect(() => {
    if (!settings) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Command Palette shortcut
      const paletteShortcut = parseShortcut(settings.shortcuts.openCommandPalette)
      if (paletteShortcut.matches(e)) {
        e.preventDefault()
        setIsPaletteOpen(true)
        return
      }

      // Save Note shortcut
      const saveShortcut = parseShortcut(settings.shortcuts.saveNote)
      if (saveShortcut.matches(e)) {
        e.preventDefault()
        if (selectedNote) {
          handleSaveNote()
        }
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [settings, selectedNote, noteContent])

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
          loadSettings() // Reload settings when closed
        }}
      />

      <div className="app-container">
        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Notes</h2>
            <button
              className="icon-button"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
            >
              Settings
            </button>
          </div>

          <button onClick={() => setIsPaletteOpen(true)}>
            New Note ({settings ? formatShortcut(settings.shortcuts.openCommandPalette) : 'Ctrl+K'})
          </button>
          <button onClick={loadNotes}>Refresh</button>

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
                    {note.hierarchy[note.hierarchy.length - 1]}
                  </div>
                  <div className="note-path">{note.path}</div>
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
                <button onClick={handleSaveNote} className="save-button">
                  Save ({settings ? formatShortcut(settings.shortcuts.saveNote) : 'Ctrl+S'})
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