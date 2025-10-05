import { app, dialog, BrowserWindow } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as settingsHandler from './settings-handler'

const getNotesDir = async () => {
  const settings = await settingsHandler.getSettings()
  
  if (settings.notesDirectory) {
    return settings.notesDirectory
  }
  
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'notes')
}

export const selectNotesDirectory = async (browserWindow: BrowserWindow | null) => {
  const result = await dialog.showOpenDialog(browserWindow || BrowserWindow.getFocusedWindow()!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Notes Directory'
  })
  
  if (result.canceled || result.filePaths.length === 0) {
    return null
  }
  
  const selectedPath = result.filePaths[0]
  
  const settings = await settingsHandler.getSettings()
  const recentDirs = [selectedPath, ...settings.recentDirectories.filter(d => d !== selectedPath)].slice(0, 5)
  
  await settingsHandler.updateSettings({
    notesDirectory: selectedPath,
    recentDirectories: recentDirs
  })
  
  await initNotesDir()
  
  return selectedPath
}

export const getCurrentDirectory = async () => {
  const settings = await settingsHandler.getSettings()
  return settings.notesDirectory
}

export const initNotesDir = async () => {
  const notesDir = await getNotesDir()
  try {
    await fs.access(notesDir)
  } catch {
    await fs.mkdir(notesDir, { recursive: true })
    console.log('Notes directory created:', notesDir)
  }
}

const parseFileName = (filename: string): string[] => {
  return filename.replace('.md', '').split('.')
}

export const getNotes = async () => {
  const notesDir = await getNotesDir()
  
  try {
    const files = await fs.readdir(notesDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))
    
    const notes = mdFiles.map(filename => {
      const hierarchy = parseFileName(filename)
      return {
        filename,
        hierarchy,
        path: hierarchy.join(' > '),
        fullPath: path.join(notesDir, filename)
      }
    })
    
    return notes
  } catch (error) {
    console.error('Error reading notes:', error)
    return []
  }
}

export const readNote = async (filename: string) => {
  const notesDir = await getNotesDir()
  const filePath = path.join(notesDir, filename)
  
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    console.error('Error reading note:', error)
    throw error
  }
}

export const writeNote = async (filename: string, content: string) => {
  const notesDir = await getNotesDir()
  const filePath = path.join(notesDir, filename)
  
  try {
    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Error writing note:', error)
    throw error
  }
}

export const createNote = async (hierarchy: string[]) => {
  const filename = hierarchy.join('.') + '.md'
  const initialContent = `# ${hierarchy[hierarchy.length - 1]}\n\nStart writing here...`
  
  await writeNote(filename, initialContent)
  return filename
}

export const deleteNote = async (filename: string) => {
  const notesDir = await getNotesDir()
  const filePath = path.join(notesDir, filename)
  
  try {
    await fs.unlink(filePath)
    return { success: true }
  } catch (error) {
    console.error('Error deleting note:', error)
    throw error
  }
}