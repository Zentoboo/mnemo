import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import * as notesHandler from './notes-handler'
import * as settingsHandler from './settings-handler'
import * as flashcardHandler from './flashcard-handler'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
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
    mainWindow!.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  await settingsHandler.initSettings()
  await notesHandler.initNotesDir()

  // Notes IPC handlers
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

  ipcMain.handle('notes:selectDirectory', async () => {
    return await notesHandler.selectNotesDirectory(mainWindow)
  })

  ipcMain.handle('notes:getCurrentDirectory', async () => {
    return await notesHandler.getCurrentDirectory()
  })

  // Settings IPC handlers
  ipcMain.handle('settings:get', async () => {
    return await settingsHandler.getSettings()
  })

  ipcMain.handle('settings:update', async (_, settings) => {
    return await settingsHandler.updateSettings(settings)
  })

  ipcMain.handle('settings:reset', async () => {
    return await settingsHandler.resetSettings()
  })

  // Flashcard IPC handlers
  ipcMain.handle('flashcard:getCards', async (_, pattern: string) => {
    const settings = await settingsHandler.getSettings()
    if (!settings.notesDirectory) {
      throw new Error('No notes directory selected')
    }
    return await flashcardHandler.getFlashcards(settings.notesDirectory, pattern)
  })

  ipcMain.handle('flashcard:saveSession', async (_, session) => {
    const settings = await settingsHandler.getSettings()
    if (!settings.notesDirectory) {
      throw new Error('No notes directory selected')
    }
    return await flashcardHandler.saveSessionResults(settings.notesDirectory, session)
  })

  ipcMain.handle('flashcard:getSessions', async () => {
    const settings = await settingsHandler.getSettings()
    if (!settings.notesDirectory) {
      return []
    }
    return await flashcardHandler.getFlashcardSessions(settings.notesDirectory)
  })

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