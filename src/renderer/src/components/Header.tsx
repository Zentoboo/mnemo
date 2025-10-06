import { useState } from 'react'
import { formatShortcut } from '../utils/keyboard'
import Icon from './Icon'
import './Header.css'

interface HeaderProps {
    title: string
    onSettingsClick: () => void
    onCommandPaletteClick: () => void
    settingsShortcut?: string
    commandPaletteShortcut?: string
}

export default function Header({
    title,
    onSettingsClick,
    onCommandPaletteClick,
    settingsShortcut,
    commandPaletteShortcut
}: HeaderProps) {
    const [showSidebar, setShowSidebar] = useState(true)
    const [showNote, setShowNote] = useState(false)
    const [showFlashcard, setShowFlashcard] = useState(true)
    return (
        <div className="header">
            <h1 className="header-title">{title}</h1>

            {/* used later on */}
            <div className='sidebar-checklist'>
                <label className='checkbox-group'>
                    <input
                        type="checkbox"
                        checked={showSidebar}
                        onChange={(e) => setShowSidebar(e.target.checked)}
                    />
                    <span className='custom-checkbox'></span>
                    <p>sidebar</p>
                </label>
                <label className='checkbox-group'>
                    <input
                        type="checkbox"
                        checked={showNote}
                        onChange={(e) => setShowNote(e.target.checked)}
                    />
                    <span className='custom-checkbox'></span>
                    <p>note</p>
                </label>
                <label className='checkbox-group'>
                    <input
                        type="checkbox"
                        checked={showFlashcard}
                        onChange={(e) => setShowFlashcard(e.target.checked)}
                    />
                    <span className='custom-checkbox'></span>
                    <p>flashcard</p>
                </label>
            </div>

            <div className="header-actions">
                <button
                    className="header-settings-btn"
                    onClick={onCommandPaletteClick}
                    title={`Command Palette${commandPaletteShortcut ? ` (${formatShortcut(commandPaletteShortcut)})` : ''}`}
                >
                    <Icon name="search" size={20} />
                </button>
                <button
                    className="header-settings-btn"
                    onClick={onSettingsClick}
                    title={`Settings${settingsShortcut ? ` (${formatShortcut(settingsShortcut)})` : ''}`}
                >
                    <Icon name="setting" size={20} />
                </button>
            </div>
        </div>
    )
}