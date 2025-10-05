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
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Notes</h2>
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

            <div className="tools">
                <button
                    onClick={onRefresh}
                    title={`Refresh${refreshShortcut ? ` (${formatShortcut(refreshShortcut)})` : ''}`}
                >
                    <Icon name="refresh" size={16} />
                    <span>Refresh</span>
                </button>
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