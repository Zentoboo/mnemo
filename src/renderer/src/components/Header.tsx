import { formatShortcut } from '../utils/keyboard'
import Icon from './Icon'
import './Header.css'

interface HeaderProps {
    title: string
    onSettingsClick: () => void
    onCommandPaletteClick: () => void
    settingsShortcut?: string
    commandPaletteShortcut?: string
    sidebarShortcut?: string
    showSidebar: boolean
    onToggleSidebar: (show: boolean) => void
}

export default function Header({
    title,
    onSettingsClick,
    onCommandPaletteClick,
    settingsShortcut,
    commandPaletteShortcut,
    sidebarShortcut,
    showSidebar,
    onToggleSidebar
}: HeaderProps) {
    return (
        <div className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 className="header-title">{title}</h1>
            </div>

            <div className="header-actions">
                <button
                    className="header-settings-btn"
                    onClick={() => onToggleSidebar(!showSidebar)}
                    title={`Toggle Sidebar ${showSidebar ? '(Hide)' : '(Show)'} ${sidebarShortcut ? `(${formatShortcut(sidebarShortcut)})` : ''}`}
                >
                    <Icon name="sidebar" size={20} />
                </button>
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