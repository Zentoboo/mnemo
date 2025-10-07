import { app } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

interface Settings {
  shortcuts: {
    openCommandPalette: string
    saveNote: string
    refreshNotes: string
    openSettings: string
    toggleSidebar: string
  }
  theme: 'dark' | 'light'
  fontSize: number
  notesDirectory: string | null
  recentDirectories: string[]
}

const DEFAULT_SETTINGS: Settings = {
  shortcuts: {
    openCommandPalette: 'CommandOrControl+K',
    saveNote: 'CommandOrControl+S',
    refreshNotes: 'CommandOrControl+R',
    openSettings: 'CommandOrControl+,',
    toggleSidebar: 'CommandOrControl+B'
  },
  theme: 'dark',
  fontSize: 14,
  notesDirectory: null,
  recentDirectories: []
}

let cachedSettings: Settings | null = null

const getSettingsPath = () => {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'settings.json')
}

export const initSettings = async () => {
  const settingsPath = getSettingsPath()
  
  try {
    await fs.access(settingsPath)
    const data = await fs.readFile(settingsPath, 'utf-8')
    const loadedSettings = JSON.parse(data)
    
    cachedSettings = {
      ...DEFAULT_SETTINGS,
      ...loadedSettings,
      shortcuts: {
        ...DEFAULT_SETTINGS.shortcuts,
        ...loadedSettings.shortcuts
      }
    }
    
    await fs.writeFile(settingsPath, JSON.stringify(cachedSettings, null, 2), 'utf-8')
  } catch {
    cachedSettings = DEFAULT_SETTINGS
    await fs.writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
    console.log('Settings file created with defaults')
  }
}

export const getSettings = async (): Promise<Settings> => {
  if (!cachedSettings) {
    await initSettings()
  }
  return cachedSettings || DEFAULT_SETTINGS
}

export const updateSettings = async (newSettings: Partial<Settings>): Promise<Settings> => {
  const currentSettings = await getSettings()
  const updatedSettings = {
    ...currentSettings,
    ...newSettings,
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

export const resetSettings = async (): Promise<Settings> => {
  const settingsPath = getSettingsPath()
  await fs.writeFile(settingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
  cachedSettings = DEFAULT_SETTINGS
  return DEFAULT_SETTINGS
}