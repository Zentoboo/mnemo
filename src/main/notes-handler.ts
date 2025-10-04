import { app } from 'electron'
import * as fs from 'fs/promises'
import * as path from 'path'

// Get the notes directory path
const getNotesDir = () => {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'notes')
}

// Ensure notes directory exists
export const initNotesDir = async () => {
  const notesDir = getNotesDir()
  try {
    await fs.access(notesDir)
  } catch {
    await fs.mkdir(notesDir, { recursive: true })
    console.log('Notes directory created:', notesDir)
  }
}

// Parse filename into hierarchy
const parseFileName = (filename: string): string[] => {
  return filename.replace('.md', '').split('.')
}

// Get all notes with their hierarchy
export const getNotes = async () => {
  const notesDir = getNotesDir()
  
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

// Read a specific note
export const readNote = async (filename: string) => {
  const notesDir = getNotesDir()
  const filePath = path.join(notesDir, filename)
  
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return content
  } catch (error) {
    console.error('Error reading note:', error)
    throw error
  }
}

// Write/update a note
export const writeNote = async (filename: string, content: string) => {
  const notesDir = getNotesDir()
  const filePath = path.join(notesDir, filename)
  
  try {
    await fs.writeFile(filePath, content, 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Error writing note:', error)
    throw error
  }
}

// Create a new note
export const createNote = async (hierarchy: string[]) => {
  const filename = hierarchy.join('.') + '.md'
  const initialContent = `# ${hierarchy[hierarchy.length - 1]}\n\nStart writing here...`
  
  await writeNote(filename, initialContent)
  return filename
}

// Delete a note
export const deleteNote = async (filename: string) => {
  const notesDir = getNotesDir()
  const filePath = path.join(notesDir, filename)
  
  try {
    await fs.unlink(filePath)
    return { success: true }
  } catch (error) {
    console.error('Error deleting note:', error)
    throw error
  }
}