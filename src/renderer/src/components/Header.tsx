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
    return (
        <div className="header">
            <h1 className="header-title">{title}</h1>
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