import * as fs from 'fs/promises'
import * as path from 'path'
import { parseFlashcardsFromMarkdown, matchesPattern, Flashcard } from './flashcard-parser'

export interface FlashcardSession {
  id: string
  pattern: string
  cards: Flashcard[]
  results: FlashcardResult[]
  createdAt: string
  completedAt?: string
}

export interface FlashcardResult {
  cardId: string
  question: string
  expectedAnswer: string
  userAnswer: string
  keywords: string[]
  timestamp: string
}

/**
 * Get flashcards from notes matching a pattern
 */
export async function getFlashcards(
  notesDir: string,
  pattern: string
): Promise<Flashcard[]> {
  const allCards: Flashcard[] = []
  
  try {
    const files = await fs.readdir(notesDir)
    const mdFiles = files.filter(f => f.endsWith('.md'))
    
    for (const filename of mdFiles) {
      // Check if filename matches pattern
      if (!matchesPattern(filename, pattern)) continue
      
      const filePath = path.join(notesDir, filename)
      const content = await fs.readFile(filePath, 'utf-8')
      
      const parsed = parseFlashcardsFromMarkdown(content, filename)
      allCards.push(...parsed.cards)
    }
  } catch (error) {
    console.error('Error reading flashcards:', error)
    throw error
  }
  
  return allCards
}

/**
 * Create a new flashcard session
 */
export function createSession(pattern: string, cards: Flashcard[]): FlashcardSession {
  return {
    id: `session-${Date.now()}`,
    pattern,
    cards,
    results: [],
    createdAt: new Date().toISOString()
  }
}

/**
 * Save flashcard session results to a markdown file
 */
export async function saveSessionResults(
  notesDir: string,
  session: FlashcardSession
): Promise<string> {
  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `flashcard-session.${timestamp}.${session.id}.md`
  const filePath = path.join(notesDir, filename)
  
  // Generate markdown content
  let content = `# Flashcard Session Results\n\n`
  content += `**Pattern:** ${session.pattern}\n`
  content += `**Date:** ${session.createdAt}\n`
  content += `**Total Questions:** ${session.cards.length}\n`
  content += `**Completed:** ${session.results.length}\n\n`
  content += `---\n\n`
  
  session.results.forEach((result, index) => {
    content += `## Question ${index + 1}\n\n`
    content += `**Q:** ${result.question}\n\n`
    content += `**Your Answer:**\n${result.userAnswer}\n\n`
    content += `**Expected Answer:**\n${result.expectedAnswer}\n\n`
    
    if (result.keywords.length > 0) {
      content += `**Keywords:** ${result.keywords.join(', ')}\n\n`
    }
    
    content += `---\n\n`
  })
  
  await fs.writeFile(filePath, content, 'utf-8')
  
  return filename
}

/**
 * Get all flashcard session files
 */
export async function getFlashcardSessions(notesDir: string): Promise<string[]> {
  try {
    const files = await fs.readdir(notesDir)
    return files.filter(f => f.startsWith('flashcard-session.') && f.endsWith('.md'))
  } catch (error) {
    console.error('Error reading flashcard sessions:', error)
    return []
  }
}