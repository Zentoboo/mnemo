import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Icon from './Icon'
import ToggleSwitch from './ToggleSwitch'
import { formatShortcut, parseShortcut } from '../utils/keyboard'
import './Editor.css'

interface EditorProps {
    selectedNote: string | null
    noteContent: string
    onNoteContentChange: (content: string) => void
    onSave: () => void
    saveShortcut?: string
    fontSize: number
    commandPaletteShortcut?: string
    boldShortcut?: string
    italicShortcut?: string
}

function Editor({
    selectedNote,
    noteContent,
    onNoteContentChange,
    onSave,
    saveShortcut,
    fontSize,
    commandPaletteShortcut,
    boldShortcut = 'CommandOrControl+B',
    italicShortcut = 'CommandOrControl+I',
}: EditorProps) {
    const [viewMode, setViewMode] = useState('edit')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const wrapText = (wrapper: string) => {
        const textarea = textareaRef.current
        if (!textarea) return

        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = noteContent.substring(start, end)

        if (selectedText.length === 0) {
            // No selection, just insert the wrapper and place cursor in the middle
            const before = noteContent.substring(0, start)
            const after = noteContent.substring(end)
            const newContent = before + wrapper + wrapper + after

            onNoteContentChange(newContent)

            // Set cursor position in the middle of the wrapper
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + wrapper.length
                textarea.focus()
            }, 0)
        } else {
            // Check if selection is already wrapped
            const isWrapped = selectedText.startsWith(wrapper) && selectedText.endsWith(wrapper)

            let newContent: string
            let newSelectionStart: number
            let newSelectionEnd: number

            if (isWrapped) {
                // Remove formatting
                const unwrappedText = selectedText.slice(wrapper.length, -wrapper.length)
                const before = noteContent.substring(0, start)
                const after = noteContent.substring(end)
                newContent = before + unwrappedText + after
                newSelectionStart = start
                newSelectionEnd = start + unwrappedText.length
            } else {
                // Add formatting
                const before = noteContent.substring(0, start)
                const after = noteContent.substring(end)
                newContent = before + wrapper + selectedText + wrapper + after
                newSelectionStart = start + wrapper.length
                newSelectionEnd = start + wrapper.length + selectedText.length
            }

            onNoteContentChange(newContent)

            // Restore selection
            setTimeout(() => {
                textarea.selectionStart = newSelectionStart
                textarea.selectionEnd = newSelectionEnd
                textarea.focus()
            }, 0)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const boldShortcutParsed = parseShortcut(boldShortcut)
        const italicShortcutParsed = parseShortcut(italicShortcut)

        if (boldShortcutParsed.matches(e.nativeEvent)) {
            e.preventDefault()
            wrapText('**')
        } else if (italicShortcutParsed.matches(e.nativeEvent)) {
            e.preventDefault()
            wrapText('*')
        }
    }

    if (!selectedNote) {
        return (
            <div className="editor-empty">
                <h2>Welcome to Mnemo</h2>
                <p>
                    Press <kbd>{commandPaletteShortcut ? formatShortcut(commandPaletteShortcut) : 'Ctrl+K'}</kbd> to create or search for notes
                </p>
                <p className="hint">Try creating: <code>mathematics.calculus</code></p>
                <p className="hint">Start flashcards: <code>&gt;flashcard:biology.*</code></p>
                <p className="hint">
                    Formatting: <kbd>{formatShortcut(boldShortcut)}</kbd> Bold,
                    <kbd>{formatShortcut(italicShortcut)}</kbd> Italic
                </p>
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
                    ref={textareaRef}
                    className="editor-textarea"
                    value={noteContent}
                    onChange={(e) => onNoteContentChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Start writing... (${formatShortcut(boldShortcut)} Bold, ${formatShortcut(italicShortcut)} Italic)`}
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