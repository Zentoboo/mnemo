import { app } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

interface Settings {
  shortcuts: {
    openCommandPalette: string
    saveNote: string
  }
  theme: 'dark' | 'light'
  fontSize: number
}

const DEFAULT_SETTINGS: Settings = {
  shortcuts: {
    openCommandPalette: 'CommandOrControl+K',
    saveNote: 'CommandOrControl+S'
  },
  theme: 'dark',
  fontSize: 14
}

let cachedSettings: Settings | null = null

const getSettingsPath = () => {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'settings.json')
}

// Initialize settings file
export const initSettings = async () => {
  const settingsPath = getSettingsPath()
  
  try {
    await fs.access(settingsPath)
    // Settings file exists, load it
    const data = await fs.readFile(settingsPath, 'utf-8')
    cachedSettings = JSON.parse(data)
  } catch {
    // Settings file doesn't exist, create with defaults
    cachedSettings = DEFAULT_SETTINGS
    await fs.writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
    console.log('Settings file created with defaults')
  }
}

// Get all settings
export const getSettings = async (): Promise<Settings> => {
  if (!cachedSettings) {
    await initSettings()
  }
  return cachedSettings || DEFAULT_SETTINGS
}

// Update settings
export const updateSettings = async (newSettings: Partial<Settings>): Promise<Settings> => {
  const currentSettings = await getSettings()
  const updatedSettings = {
    ...currentSettings,
    ...newSettings,
    // Deep merge shortcuts
    shortcuts: {
      ...currentSettings.shortcuts,
      ...(newSettings.shortcuts || {})
    }
  }
  
  const settingsPath = getSettingsPath()
  await fs.writeFile(settingsPath, JSON.stringify(updatedSettings, null, 2), 'utf-8')
  cachedSettings = updatedSettings
  
  return updatedSettings
}

// Reset to defaults
export const resetSettings = async (): Promise<Settings> => {
  const settingsPath = getSettingsPath()
  await fs.writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
  cachedSettings = DEFAULT_SETTINGS
  return DEFAULT_SETTINGS
}