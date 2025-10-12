import { useState } from 'react'
import { formatShortcut } from '../utils/keyboard'
import Icon from './Icon'
import ConfirmModal from './ConfirmModal'
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
    onDeleteNote: (filename: string) => void
}

export default function Sidebar({
    notes,
    selectedNote,
    currentDirectory,
    refreshShortcut,
    onNoteSelect,
    onRefresh,
    onDirectoryChange,
    onDeleteNote
}: SidebarProps) {
    const [showNotes, setShowNotes] = useState(true)
    const [showFlashcards, setShowFlashcards] = useState(true)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    const filteredNotes = notes.filter((note) => {
        const isFlashcardSession = note.filename.startsWith('flashcard-session.')

        if (isFlashcardSession) {
            return showFlashcards
        }
        else {
            return showNotes
        }
    })

    const handleDeleteClick = (filename: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteConfirm(filename)
    }

    const handleConfirmDelete = async () => {
        if (deleteConfirm) {
            await onDeleteNote(deleteConfirm)
            setDeleteConfirm(null)
        }
    }

    return (
        <>
            <ConfirmModal
                isOpen={deleteConfirm !== null}
                title="Delete Note"
                message={`Are you sure you want to delete "${deleteConfirm}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteConfirm(null)}
            />

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

                <div className='sidebar-checklist'>
                    <label className='checkbox-group'>
                        <input
                            type="checkbox"
                            checked={showNotes}
                            onChange={(e) => setShowNotes(e.target.checked)}
                        />
                        <span className='custom-checkbox'></span>
                        <p>note</p>
                    </label>
                    <label className='checkbox-group'>
                        <input
                            type="checkbox"
                            checked={showFlashcards}
                            onChange={(e) => setShowFlashcards(e.target.checked)}
                        />
                        <span className='custom-checkbox'></span>
                        <p>flashcard</p>
                    </label>
                </div>

                <div className="notes-list">
                    {filteredNotes.length === 0 ? (
                        <p className="empty-state">
                            {!showNotes && !showFlashcards
                                ? 'Enable at least one filter to see files'
                                : 'No files match the selected filters'
                            }
                        </p>
                    ) : (
                        filteredNotes.map((note) => {
                            const isFlashcardSession = note.filename.startsWith('flashcard-session.')
                            return (
                                <div
                                    key={note.filename}
                                    className={`note-item ${selectedNote === note.filename ? 'active' : ''} ${isFlashcardSession ? 'flashcard-item' : ''}`}
                                    onClick={() => onNoteSelect(note.filename)}
                                >
                                    <div className="note-title">
                                        {isFlashcardSession && '[flashcard] '}
                                        {note.filename.replace('.md', '')}
                                    </div>
                                    <button
                                        className="note-delete-btn"
                                        onClick={(e) => handleDeleteClick(note.filename, e)}
                                        title="Delete note"
                                    >
                                        <Icon name="trash" size={16} />
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </>
    )
}