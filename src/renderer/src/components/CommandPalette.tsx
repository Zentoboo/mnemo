import { useState, useEffect, useRef } from 'react'
import './CommandPalette.css'

interface Note {
  filename: string
  hierarchy: string[]
  path: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  onSelectNote: (filename: string) => void
  onCreateNote: (hierarchy: string[]) => void
}

export default function CommandPalette({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onCreateNote
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter notes based on query
  const filteredNotes = notes.filter((note) =>
    note.path.toLowerCase().includes(query.toLowerCase())
  )

  // Check if query looks like a new note (contains dots or is just text)
  const isNewNote = query.trim().length > 0 && filteredNotes.length === 0

  // Parse query into hierarchy for new note
  const getHierarchyFromQuery = (): string[] => {
    return query
      .trim()
      .split('.')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
  }

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => {
          const maxIndex = isNewNote ? 0 : filteredNotes.length - 1
          return Math.min(prev + 1, maxIndex)
        })
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (isNewNote) {
          const hierarchy = getHierarchyFromQuery()
          if (hierarchy.length > 0) {
            onCreateNote(hierarchy)
            onClose()
          }
        } else if (filteredNotes[selectedIndex]) {
          onSelectNote(filteredNotes[selectedIndex].filename)
          onClose()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredNotes, isNewNote, query, onClose, onCreateNote, onSelectNote])

  const handleSelect = () => {
    if (isNewNote) {
      const hierarchy = getHierarchyFromQuery()
      if (hierarchy.length > 0) {
        onCreateNote(hierarchy)
        onClose()
      }
    } else if (filteredNotes[selectedIndex]) {
      onSelectNote(filteredNotes[selectedIndex].filename)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          className="command-palette-input"
          placeholder="Search or create note (e.g., mathematics.calculus)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(0)
          }}
        />

        <div className="command-palette-results">
          {filteredNotes.length > 0 ? (
            filteredNotes.map((note, index) => (
              <div
                key={note.filename}
                className={`command-palette-item ${index === selectedIndex ? 'selected' : ''
                  }`}
                onClick={() => {
                  onSelectNote(note.filename)
                  onClose()
                }}
              >
                <span className="item-icon">📄</span>
                <div className="item-content">
                  <div className="item-title">{note.hierarchy[note.hierarchy.length - 1]}</div>
                  <div className="item-path">{note.path}</div>
                </div>
              </div>
            ))
          ) : query.trim().length > 0 ? (
            <div
              className={`command-palette-item create-new ${selectedIndex === 0 ? 'selected' : ''
                }`}
              onClick={handleSelect}
            >
              <span className="item-icon">✨</span>
              <div className="item-content">
                <div className="item-title">Create new note</div>
                <div className="item-path">{getHierarchyFromQuery().join(' > ')}</div>
              </div>
            </div>
          ) : (
            <div className="command-palette-empty">Type to search or create a note...</div>
          )}
        </div>

        <div className="command-palette-footer">
          <span className="footer-hint">
            <kbd>↑↓</kbd> Navigate
          </span>
          <span className="footer-hint">
            <kbd>Enter</kbd> Select
          </span>
          <span className="footer-hint">
            <kbd>Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  )
}