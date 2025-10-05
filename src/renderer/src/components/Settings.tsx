import { useState, useEffect } from 'react'
import { formatShortcut } from '../utils/keyboard'
import './Settings.css'

interface Settings {
  shortcuts: {
    openCommandPalette: string
    saveNote: string
    refreshNotes: string
    openSettings: string
  }
  theme: 'dark' | 'light'
  fontSize: number
}

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const [originalSettings, setOriginalSettings] = useState<Settings | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

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
      if (confirm('You have unsaved changes. Discard them?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const handleReset = async () => {
    if (confirm('Reset all settings to default?')) {
      const defaults = await window.api.resetSettings()
      setOriginalSettings(defaults)
      setSettings(defaults)
      setHasChanges(false)
    }
  }

  if (!isOpen || !settings) return null

  return (
    <div className="settings-overlay" onClick={handleCancel}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings {hasChanges && <span className="unsaved-indicator">•</span>}</h2>
          <button className="close-button" onClick={handleCancel}>✕</button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>Keyboard Shortcuts</h3>

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
  )
}