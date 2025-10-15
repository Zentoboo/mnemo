import { useState, useEffect } from 'react'
import { formatShortcut } from '../utils/keyboard'
import ConfirmModal from './ConfirmModal'
import './Settings.css'

interface Settings {
  shortcuts: {
    openCommandPalette: string
    saveNote: string
    refreshNotes: string
    openSettings: string
    toggleSidebar: string
    boldText: string
    italicText: string
    underlineText: string
  }
  theme: 'dark' | 'light'
  fontSize: number
  notesDirectory: string | null
  recentDirectories: string[]
}

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  onDirectoryChange?: () => void
}

export default function Settings({ isOpen, onClose, onDirectoryChange }: SettingsProps) {
  const [originalSettings, setOriginalSettings] = useState<Settings | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  useEffect(() => {
    if (originalSettings && settings) {
      const changed = JSON.stringify(originalSettings) !== JSON.stringify(settings)
      setHasChanges(changed)
    }
  }, [settings, originalSettings])

  useEffect(() => {
    if (!editingShortcut) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()

      if (e.key === 'Escape') {
        setEditingShortcut(null)
        return
      }

      const modifiers: string[] = []
      if (e.ctrlKey || e.metaKey) modifiers.push('CommandOrControl')
      if (e.altKey) modifiers.push('Alt')
      if (e.shiftKey) modifiers.push('Shift')

      const key = e.key.toUpperCase()
      if (key.length === 1 || ['ENTER', 'SPACE', 'TAB'].includes(key)) {
        const accelerator = [...modifiers, key].join('+')

        const updatedSettings = {
          ...settings!,
          shortcuts: {
            ...settings!.shortcuts,
            [editingShortcut]: accelerator
          }
        }
        setSettings(updatedSettings)
        setEditingShortcut(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingShortcut, settings])

  const loadSettings = async () => {
    const data = await window.api.getSettings()
    setOriginalSettings(data)
    setSettings(data)
    setHasChanges(false)
  }

  const handleSave = async () => {
    if (!settings) return
    await window.api.updateSettings(settings)
    onClose()
  }

  const handleCancel = () => {
    if (hasChanges) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false)
    onClose()
  }

  const handleReset = () => {
    setShowResetConfirm(true)
  }

  const handleConfirmReset = async () => {
    setShowResetConfirm(false)
    const defaults = await window.api.resetSettings()
    setOriginalSettings(defaults)
    setSettings(defaults)
    setHasChanges(false)
  }

  const handleChangeDirectory = async () => {
    const newPath = await window.api.selectNotesDirectory()
    if (newPath) {
      await loadSettings()
      if (onDirectoryChange) {
        onDirectoryChange()
      }
    }
  }

  if (!isOpen || !settings) return null

  return (
    <>
      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Discard them?"
        confirmText="Discard"
        cancelText="Keep Editing"
        onConfirm={handleConfirmDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
      />

      <ConfirmModal
        isOpen={showResetConfirm}
        title="Reset Settings"
        message="Reset all settings to default?"
        confirmText="Reset"
        cancelText="Cancel"
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetConfirm(false)}
      />

      <div className="settings-overlay" onClick={handleCancel}>
        <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
          <div className="settings-header">
            <h2>Settings {hasChanges && <span className="unsaved-indicator">•</span>}</h2>
            <button className="close-button" onClick={handleCancel}>✕</button>
          </div>

          <div className="settings-content">
            <section className="settings-section">
              <h3>Notes Directory</h3>

              <div className="setting-item directory-setting">
                <label>Current Directory</label>
                <div className="directory-display">
                  {settings.notesDirectory || 'Not set'}
                </div>
              </div>

              <button onClick={handleChangeDirectory} className="secondary-button">
                Change Notes Directory
              </button>

              {settings.recentDirectories.length > 0 && (
                <div className="recent-dirs-section">
                  <label className="recent-label">Recent Directories</label>
                  <div className="recent-dirs-list">
                    {settings.recentDirectories.map(dir => (
                      <div key={dir} className="recent-dir-item">
                        📁 {dir}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="settings-section">
              <h3>App Shortcuts</h3>

              <div className="setting-item">
                <label>Open Command Palette</label>
                {editingShortcut === 'openCommandPalette' ? (
                  <div className="shortcut-editor">
                    <div className="shortcut-input recording">Press keys...</div>
                    <button onClick={() => setEditingShortcut(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="shortcut-display">
                    <kbd>{formatShortcut(settings.shortcuts.openCommandPalette)}</kbd>
                    <button onClick={() => setEditingShortcut('openCommandPalette')}>Change</button>
                  </div>
                )}
              </div>

              <div className="setting-item">
                <label>Save Note</label>
                {editingShortcut === 'saveNote' ? (
                  <div className="shortcut-editor">
                    <div className="shortcut-input recording">Press keys...</div>
                    <button onClick={() => setEditingShortcut(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="shortcut-display">
                    <kbd>{formatShortcut(settings.shortcuts.saveNote)}</kbd>
                    <button onClick={() => setEditingShortcut('saveNote')}>Change</button>
                  </div>
                )}
              </div>

              <div className="setting-item">
                <label>Refresh Notes</label>
                {editingShortcut === 'refreshNotes' ? (
                  <div className="shortcut-editor">
                    <div className="shortcut-input recording">Press keys...</div>
                    <button onClick={() => setEditingShortcut(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="shortcut-display">
                    <kbd>{formatShortcut(settings.shortcuts.refreshNotes)}</kbd>
                    <button onClick={() => setEditingShortcut('refreshNotes')}>Change</button>
                  </div>
                )}
              </div>

              <div className="setting-item">
                <label>Toggle Sidebar</label>
                {editingShortcut === 'toggleSidebar' ? (
                  <div className="shortcut-editor">
                    <div className="shortcut-input recording">Press keys...</div>
                    <button onClick={() => setEditingShortcut(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="shortcut-display">
                    <kbd>{formatShortcut(settings.shortcuts.toggleSidebar)}</kbd>
                    <button onClick={() => setEditingShortcut('toggleSidebar')}>Change</button>
                  </div>
                )}
              </div>

              <div className="setting-item">
                <label>Open Settings</label>
                {editingShortcut === 'openSettings' ? (
                  <div className="shortcut-editor">
                    <div className="shortcut-input recording">Press keys...</div>
                    <button onClick={() => setEditingShortcut(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="shortcut-display">
                    <kbd>{formatShortcut(settings.shortcuts.openSettings)}</kbd>
                    <button onClick={() => setEditingShortcut('openSettings')}>Change</button>
                  </div>
                )}
              </div>
            </section>

            <section className="settings-section">
              <h3>Appearance</h3>

              <div className="setting-item">
                <label>Theme</label>
                <select
                  value={settings.theme}
                  onChange={(e) => {
                    setSettings({ ...settings, theme: e.target.value as 'dark' | 'light' })
                  }}
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div className="setting-item">
                <label>Font Size</label>
                <input
                  type="number"
                  min="10"
                  max="24"
                  value={settings.fontSize}
                  onChange={(e) => {
                    setSettings({ ...settings, fontSize: parseInt(e.target.value) })
                  }}
                />
              </div>
            </section>

            <section className="settings-section">
              <h3>Editor Shortcuts</h3>
              <div className="setting-item">
                <label>Bold Text</label>
                {editingShortcut === 'boldText' ? (
                  <div className="shortcut-editor">
                    <div className="shortcut-input recording">Press keys...</div>
                    <button onClick={() => setEditingShortcut(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="shortcut-display">
                    <kbd>{formatShortcut(settings.shortcuts.boldText)}</kbd>
                    <button onClick={() => setEditingShortcut('boldText')}>Change</button>
                  </div>
                )}
              </div>

              <div className="setting-item">
                <label>Italic Text</label>
                {editingShortcut === 'italicText' ? (
                  <div className="shortcut-editor">
                    <div className="shortcut-input recording">Press keys...</div>
                    <button onClick={() => setEditingShortcut(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="shortcut-display">
                    <kbd>{formatShortcut(settings.shortcuts.italicText)}</kbd>
                    <button onClick={() => setEditingShortcut('italicText')}>Change</button>
                  </div>
                )}
              </div>

              <div className="setting-item">
                <label>Underline Text</label>
                {editingShortcut === 'underlineText' ? (
                  <div className="shortcut-editor">
                    <div className="shortcut-input recording">Press keys...</div>
                    <button onClick={() => setEditingShortcut(null)}>Cancel</button>
                  </div>
                ) : (
                  <div className="shortcut-display">
                    <kbd>{formatShortcut(settings.shortcuts.underlineText)}</kbd>
                    <button onClick={() => setEditingShortcut('underlineText')}>Change</button>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div className="settings-footer">
            <button onClick={handleReset} className="reset-button">
              Reset to Defaults
            </button>
            <button onClick={handleSave} className="primary-button" disabled={!hasChanges}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  )
}