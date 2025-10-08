import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Icon from './Icon'
import ToggleSwitch from './ToggleSwitch'
import { formatShortcut } from '../utils/keyboard'
import './Editor.css'

interface EditorProps {
    selectedNote: string | null
    noteContent: string
    onNoteContentChange: (content: string) => void
    onSave: () => void
    saveShortcut?: string
    fontSize: number
    commandPaletteShortcut?: string
}

function Editor({
    selectedNote,
    noteContent,
    onNoteContentChange,
    onSave,
    saveShortcut,
    fontSize,
    commandPaletteShortcut
}: EditorProps) {
    const [viewMode, setViewMode] = useState('edit')

    if (!selectedNote) {
        return (
            <div className="editor-empty">
                <h2>Welcome to Mnemo</h2>
                <p>
                    Press <kbd>{commandPaletteShortcut ? formatShortcut(commandPaletteShortcut) : 'Ctrl+K'}</kbd> to create or search for notes
                </p>
                <p className="hint">Try creating: <code>mathematics.calculus</code></p>
                <p className="hint">Start flashcards: <code>&gt;flashcard:biology.*</code></p>
            </div>
        )
    }

    return (
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
                        onClick={onSave}
                        className="header-settings-btn"
                        title={`Save${saveShortcut ? ` (${formatShortcut(saveShortcut)})` : ''}`}
                    >
                        <Icon name="save" size={20} />
                    </button>
                </div>
            </div>
            {viewMode === 'edit' ? (
                <textarea
                    className="editor-textarea"
                    value={noteContent}
                    onChange={(e) => onNoteContentChange(e.target.value)}
                    placeholder="Start writing..."
                    style={{
                        fontSize: `${fontSize}px`
                    }}
                />
            ) : (
                <div className="markdown-view" style={{ fontSize: `${fontSize}px` }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {noteContent}
                    </ReactMarkdown>
                </div>
            )}
        </>
    )
}

export default Editor