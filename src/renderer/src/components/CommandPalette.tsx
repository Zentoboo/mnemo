import { useState, useEffect, useRef } from 'react'
import './CommandPalette.css'

interface Note {
  filename: string
  hierarchy: string[]
  path: string
}

interface Command {
  name: string
  label: string
  description: string
  icon: string
  action: string
  needsSelection?: boolean
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  selectedNote: string | null
  onSelectNote: (filename: string) => void
  onCreateNote: (hierarchy: string[]) => void
  onStartFlashcard: (pattern: string) => void
  onDeleteNote: (filename: string) => void
}

export default function CommandPalette({
  isOpen,
  onClose,
  notes,
  selectedNote,
  onSelectNote,
  onCreateNote,
  onStartFlashcard,
  onDeleteNote
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const availableCommands: Command[] = [
    {
      name: 'flashcard',
      label: '>flashcard:',
      description: 'Start a flashcard session with a note pattern',
      icon: '🎴',
      action: 'flashcard'
    },
    {
      name: 'delete',
      label: '>delete:',
      description: 'Delete a note file',
      icon: '🗑️',
      action: 'delete',
      needsSelection: true
    }
  ]

  // Parse query
  const trimmedQuery = query.trim()
  const isCommandMode = trimmedQuery.startsWith('>')

  let commandName = ''
  let commandArgs = ''
  let hasColon = false

  if (isCommandMode) {
    const commandPart = trimmedQuery.slice(1) // Remove '>'
    const colonIndex = commandPart.indexOf(':')

    if (colonIndex !== -1) {
      // Has colon: >flashcard:pattern or >delete:filename
      hasColon = true
      commandName = commandPart.slice(0, colonIndex).toLowerCase().trim()
      commandArgs = commandPart.slice(colonIndex + 1).trim()
    } else {
      // No colon yet: >flash or >del
      commandName = commandPart.toLowerCase().trim()
      commandArgs = ''
    }
  }

  // Get matching commands (only show if no colon yet)
  const matchingCommands = isCommandMode && !hasColon
    ? availableCommands.filter(cmd => {
      // Always show commands in autocomplete
      return cmd.name.startsWith(commandName)
    })
    : []

  // Check if we're in a complete command (has colon)
  const activeCommand = hasColon
    ? availableCommands.find(cmd => cmd.name === commandName)
    : null

  // Get file suggestions based on context
  const getFileSuggestions = () => {
    if (activeCommand) {
      // We're in a command with colon, show file suggestions
      if (commandArgs) {
        // Filter files by the argument
        return notes.filter(note =>
          note.filename.toLowerCase().includes(commandArgs.toLowerCase())
        )
      } else {
        // Show all files
        return notes
      }
    } else if (!isCommandMode) {
      // Normal file search
      return notes.filter(note =>
        note.filename.toLowerCase().includes(trimmedQuery.toLowerCase())
      )
    }
    return []
  }

  const fileSuggestions = getFileSuggestions()

  // Check if we should show "create new" option
  const showCreateNew = !isCommandMode &&
    trimmedQuery.length > 0 &&
    fileSuggestions.length === 0

  // Build results list
  const results: Array<{
    type: 'command' | 'file' | 'create' | 'action'
    data: any
  }> = []

  if (matchingCommands.length > 0) {
    // Show command suggestions
    matchingCommands.forEach(cmd => {
      results.push({ type: 'command', data: cmd })
    })
  } else if (activeCommand) {
    // We're in a command, show file suggestions as actions
    if (activeCommand.action === 'flashcard') {
      fileSuggestions.forEach(note => {
        const pattern = note.filename.replace('.md', '')
        results.push({
          type: 'action',
          data: {
            note,
            pattern,
            label: `Start flashcard: ${pattern}`,
            description: note.hierarchy.join(' > '),
            icon: '🎴',
            action: 'flashcard'
          }
        })
      })
    } else if (activeCommand.action === 'delete') {
      fileSuggestions.forEach(note => {
        results.push({
          type: 'action',
          data: {
            note,
            label: `Delete: ${note.filename.replace('.md', '')}`,
            description: 'Permanently delete this note',
            icon: '🗑️',
            action: 'delete'
          }
        })
      })
    }
  } else if (!isCommandMode) {
    // Normal file search results
    fileSuggestions.forEach(note => {
      results.push({ type: 'file', data: note })
    })
    if (showCreateNew) {
      results.push({ type: 'create', data: trimmedQuery })
    }
  }

  const totalResults = results.length

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Update selected index when results change
  useEffect(() => {
    if (selectedIndex >= totalResults) {
      setSelectedIndex(Math.max(0, totalResults - 1))
    }
  }, [totalResults, selectedIndex])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, totalResults - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleSelectItem(selectedIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, totalResults])

  const handleSelectItem = (index: number) => {
    if (index < 0 || index >= results.length) return

    const item = results[index]

    if (item.type === 'command') {
      // Autocomplete the command with colon
      const cmd = item.data as Command
      setQuery(`>${cmd.name}:`)
      setSelectedIndex(0)
      // Keep focus in input
      setTimeout(() => inputRef.current?.focus(), 0)
    } else if (item.type === 'file') {
      onSelectNote(item.data.filename)
      onClose()
    } else if (item.type === 'action') {
      const actionData = item.data
      if (actionData.action === 'flashcard') {
        onStartFlashcard(actionData.pattern)
        onClose()
      } else if (actionData.action === 'delete') {
        onDeleteNote(actionData.note.filename)
        onClose()
      }
    } else if (item.type === 'create') {
      const hierarchy = item.data.split('.').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      if (hierarchy.length > 0) {
        onCreateNote(hierarchy)
        onClose()
      }
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
          placeholder="Search notes or type > for commands (>flashcard: or >delete:)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setSelectedIndex(0)
          }}
        />

        <div className="command-palette-results">
          {results.length === 0 ? (
            <div className="command-palette-empty">
              {isCommandMode
                ? hasColon
                  ? 'No matching files found'
                  : 'Available commands: >flashcard: or >delete:'
                : 'Type to search notes, or > for commands'
              }
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex

              if (item.type === 'command') {
                const cmd = item.data as Command
                return (
                  <div
                    key={`cmd-${cmd.name}`}
                    className={`command-palette-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectItem(index)}
                  >
                    <span className="item-icon">{cmd.icon}</span>
                    <div className="item-content">
                      <div className="item-title">{cmd.label}</div>
                      <div className="item-path">{cmd.description}</div>
                    </div>
                  </div>
                )
              } else if (item.type === 'file') {
                const note = item.data as Note
                return (
                  <div
                    key={`file-${note.filename}`}
                    className={`command-palette-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectItem(index)}
                  >
                    <span className="item-icon">📄</span>
                    <div className="item-content">
                      <div className="item-title">{note.filename.replace('.md', '')}</div>
                      <div className="item-path">{note.hierarchy.join(' > ')}</div>
                    </div>
                  </div>
                )
              } else if (item.type === 'action') {
                const actionData = item.data
                return (
                  <div
                    key={`action-${actionData.note.filename}`}
                    className={`command-palette-item ${isSelected ? 'selected' : ''} ${actionData.action === 'delete' ? 'delete-item' : ''}`}
                    onClick={() => handleSelectItem(index)}
                  >
                    <span className="item-icon">{actionData.icon}</span>
                    <div className="item-content">
                      <div className="item-title">{actionData.label}</div>
                      <div className="item-path">{actionData.description}</div>
                    </div>
                  </div>
                )
              } else if (item.type === 'create') {
                return (
                  <div
                    key="create"
                    className={`command-palette-item create-new ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectItem(index)}
                  >
                    <span className="item-icon">✨</span>
                    <div className="item-content">
                      <div className="item-title">Create: {item.data}</div>
                      <div className="item-path">New markdown file</div>
                    </div>
                  </div>
                )
              }

              return null
            })
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