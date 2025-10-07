import { formatShortcut } from '../utils/keyboard'
import Icon from './Icon'
import './Header.css'

interface HeaderProps {
    title: string
    onSettingsClick: () => void
    onCommandPaletteClick: () => void
    settingsShortcut?: string
    commandPaletteShortcut?: string
    showSidebar: boolean
    onToggleSidebar: (show: boolean) => void
}

export default function Header({
    title,
    onSettingsClick,
    onCommandPaletteClick,
    settingsShortcut,
    commandPaletteShortcut,
    showSidebar,
    onToggleSidebar
}: HeaderProps) {
    return (
        <div className="header">
            <h1 className="header-title">{title}</h1>

            <div className='sidebar-checklist'>
                <label className='checkbox-group'>
                    <input
                        type="checkbox"
                        checked={showSidebar}
                        onChange={(e) => onToggleSidebar(e.target.checked)}
                    />
                    <span className='custom-checkbox'></span>
                    <p>sidebar</p>
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