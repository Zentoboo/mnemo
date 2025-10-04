import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as notesHandler from './notes-handler'
import * as settingsHandler from './settings-handler'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Initialize notes directory and settings
  await notesHandler.initNotesDir()
  await settingsHandler.initSettings()

  // Setup IPC handlers for notes
  ipcMain.handle('notes:getAll', async () => {
    return await notesHandler.getNotes()
  })

  ipcMain.handle('notes:read', async (_, filename: string) => {
    return await notesHandler.readNote(filename)
  })

  ipcMain.handle('notes:write', async (_, filename: string, content: string) => {
    return await notesHandler.writeNote(filename, content)
  })

  ipcMain.handle('notes:create', async (_, hierarchy: string[]) => {
    return await notesHandler.createNote(hierarchy)
  })

  ipcMain.handle('notes:delete', async (_, filename: string) => {
    return await notesHandler.deleteNote(filename)
  })

  // Setup IPC handlers for settings
  ipcMain.handle('settings:get', async () => {
    return await settingsHandler.getSettings()
  })

  ipcMain.handle('settings:update', async (_, settings) => {
    return await settingsHandler.updateSettings(settings)
  })

  ipcMain.handle('settings:reset', async () => {
    return await settingsHandler.resetSettings()
  })

  // Default open or close DevTools by F12 in development
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})