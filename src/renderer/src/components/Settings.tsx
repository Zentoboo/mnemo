import { useState, useEffect } from 'react'
import { formatShortcut } from '../utils/keyboard'
import './Settings.css'

interface Settings {
  shortcuts: {
    openCommandPalette: string
    saveNote: string
  }
  theme: 'dark' | 'light'
  fontSize: number
}

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
}

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [pendingKey, setPendingKey] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  useEffect(() => {
    if (!editingShortcut) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      
      if (e.key === 'Escape') {
        setEditingShortcut(null)
        setPendingKey('')
        return
      }

      // Build the accelerator string
      const modifiers: string[] = []
      if (e.ctrlKey || e.metaKey) modifiers.push('CommandOrControl')
      if (e.altKey) modifiers.push('Alt')
      if (e.shiftKey) modifiers.push('Shift')
      
      const key = e.key.toUpperCase()
      if (key.length === 1 || ['Enter', 'Space', 'Tab'].includes(key)) {
        const accelerator = [...modifiers, key].join('+')
        setPendingKey(accelerator)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingShortcut])

  const loadSettings = async () => {
    const data = await window.api.getSettings()
    setSettings(data)
  }

  const handleSaveShortcut = async () => {
    if (!editingShortcut || !pendingKey || !settings) return

    const updatedSettings = {
      ...settings,
      shortcuts: {
        ...settings.shortcuts,
        [editingShortcut]: pendingKey
      }
    }

    await window.api.updateSettings(updatedSettings)
    setSettings(updatedSettings)
    setEditingShortcut(null)
    setPendingKey('')
  }

  const handleReset = async () => {
    if (confirm('Reset all settings to default?')) {
      const defaults = await window.api.resetSettings()
      setSettings(defaults)
    }
  }

  if (!isOpen || !settings) return null

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>Keyboard Shortcuts</h3>
            
            <div className="setting-item">
              <label>Open Command Palette</label>
              {editingShortcut === 'openCommandPalette' ? (
                <div className="shortcut-editor">
                  <div className="shortcut-input">
                    {pendingKey ? formatShortcut(pendingKey) : 'Press keys...'}
                  </div>
                  <button onClick={handleSaveShortcut} disabled={!pendingKey}>
                    Save
                  </button>
                  <button onClick={() => {
                    setEditingShortcut(null)
                    setPendingKey('')
                  }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="shortcut-display">
                  <kbd>{formatShortcut(settings.shortcuts.openCommandPalette)}</kbd>
                  <button onClick={() => setEditingShortcut('openCommandPalette')}>
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="setting-item">
              <label>Save Note</label>
              {editingShortcut === 'saveNote' ? (
                <div className="shortcut-editor">
                  <div className="shortcut-input">
                    {pendingKey ? formatShortcut(pendingKey) : 'Press keys...'}
                  </div>
                  <button onClick={handleSaveShortcut} disabled={!pendingKey}>
                    Save
                  </button>
                  <button onClick={() => {
                    setEditingShortcut(null)
                    setPendingKey('')
                  }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="shortcut-display">
                  <kbd>{formatShortcut(settings.shortcuts.saveNote)}</kbd>
                  <button onClick={() => setEditingShortcut('saveNote')}>
                    Edit
                  </button>
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
                onChange={async (e) => {
                  const newSettings = { ...settings, theme: e.target.value as 'dark' | 'light' }
                  await window.api.updateSettings(newSettings)
                  setSettings(newSettings)
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
                onChange={async (e) => {
                  const newSettings = { ...settings, fontSize: parseInt(e.target.value) }
                  await window.api.updateSettings(newSettings)
                  setSettings(newSettings)
                }}
              />
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button onClick={handleReset} className="reset-button">
            Reset to Defaults
          </button>
          <button onClick={onClose} className="primary-button">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}