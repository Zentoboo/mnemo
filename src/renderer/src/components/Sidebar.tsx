import { useState } from 'react'
import { formatShortcut } from '../utils/keyboard'
import Icon from './Icon'
import './Sidebar.css'

interface Note {
    filename: string
    hierarchy: string[]
    path: string
}

interface SidebarProps {
    notes: Note[]
    selectedNote: string | null
    currentDirectory: string | null
    refreshShortcut?: string
    onNoteSelect: (filename: string) => void
    onRefresh: () => void
    onDirectoryChange: () => void
}

export default function Sidebar({
    notes,
    selectedNote,
    currentDirectory,
    refreshShortcut,
    onNoteSelect,
    onRefresh,
    onDirectoryChange
}: SidebarProps) {
    const [isNote, setIsNote] = useState(true)
    const [isFlashcard, setIsFlashcard] = useState(false)

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>directory</h2>
                <button
                    className="header-settings-btn"
                    onClick={onRefresh}
                    title={`Refresh${refreshShortcut ? ` (${formatShortcut(refreshShortcut)})` : ''}`}
                >
                    <Icon name="refresh" size={20} />
                </button>
            </div>

            {currentDirectory && (
                <div className="directory-info">
                    <div className="current-directory" title={currentDirectory}>
                        📁 {currentDirectory.split(/[/\\]/).pop()}
                    </div>
                    <button onClick={onDirectoryChange} className="change-dir-btn">
                        Change
                    </button>
                </div>
            )}

            {/* used later on */}
            <div className='sidebar-checklist'>
                <label className='checkbox-group'>
                    <input
                        type="checkbox"
                        checked={isNote}
                        onChange={(e) => setIsNote(e.target.checked)}
                    />
                    <span className='custom-checkbox'></span>
                    <p>note</p>
                </label>
                <label className='checkbox-group'>
                    <input
                        type="checkbox"
                        checked={isFlashcard}
                        onChange={(e) => setIsFlashcard(e.target.checked)}
                    />
                    <span className='custom-checkbox'></span>
                    <p>flashcard</p>
                </label>
            </div>

            <div className="notes-list">
                {notes.length === 0 ? (
                    <p className="empty-state">
                        No notes yet. Press Ctrl+K to create one!
                    </p>
                ) : (
                    notes.map((note) => (
                        <div
                            key={note.filename}
                            className={`note-item ${selectedNote === note.filename ? 'active' : ''}`}
                            onClick={() => onNoteSelect(note.filename)}
                        >
                            <div className="note-title">
                                {note.filename.replace('.md', '')}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}