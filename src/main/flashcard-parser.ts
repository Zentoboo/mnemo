// Utility to parse markdown files for flashcard questions

export interface Flashcard {
  id: string
  question: string
  expectedAnswer: string
  source: string // filename where it came from
  keywords: string[] // bold words from expected answer
}

export interface ParsedFlashcards {
  cards: Flashcard[]
  totalQuestions: number
}

/**
 * Parse markdown content to extract flashcards
 * Questions are marked with ## headers
 * Expected answers are the content after the header until the next ## or end
 */
export function parseFlashcardsFromMarkdown(
  content: string,
  filename: string
): ParsedFlashcards {
  const cards: Flashcard[] = []
  
  // Split by ## headers (questions)
  const sections = content.split(/^## /gm).filter(s => s.trim())
  
  sections.forEach((section, index) => {
    const lines = section.split('\n')
    const question = lines[0].trim()
    
    // Get everything after the question line as the answer
    const answerLines = lines.slice(1).join('\n').trim()
    
    if (!question || !answerLines) return
    
    // Extract keywords (bold text marked with **)
    const keywords = extractKeywords(answerLines)
    
    cards.push({
      id: `${filename}-${index}`,
      question,
      expectedAnswer: answerLines,
      source: filename,
      keywords
    })
  })
  
  return {
    cards,
    totalQuestions: cards.length
  }
}

/**
 * Extract bold text (keywords) from markdown
 * Matches **text** patterns
 */
function extractKeywords(text: string): string[] {
  const boldPattern = /\*\*([^*]+)\*\*/g
  const keywords: string[] = []
  let match
  
  while ((match = boldPattern.exec(text)) !== null) {
    keywords.push(match[1].trim())
  }
  
  return keywords
}

/**
 * Check if a pattern matches a filename
 * Supports wildcards like "biology.*" or "*.exam"
 */
export function matchesPattern(filename: string, pattern: string): boolean {
  // Remove .md extension for matching
  const nameWithoutExt = filename.replace('.md', '')
  const patternWithoutExt = pattern.replace('.md', '')
  
  // Convert glob pattern to regex
  const regexPattern = patternWithoutExt
    .replace(/\./g, '\\.') // Escape dots
    .replace(/\*/g, '.*')   // Convert * to .*
  
  const regex = new RegExp(`^${regexPattern}$`)
  return regex.test(nameWithoutExt)
}

/**
 * Clean markdown formatting from text
 * Removes **, *, _, etc. for display
 */
export function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1')     // Remove italic
    .replace(/_([^_]+)_/g, '$1')       // Remove underscore italic
    .replace(/`([^`]+)`/g, '$1')       // Remove code
}

/**
 * Highlight keywords in user's answer
 * Returns HTML string with highlighted keywords
 */
export function highlightKeywords(
  userAnswer: string,
  keywords: string[]
): string {
  let highlighted = userAnswer
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    highlighted = highlighted.replace(
      regex,
      match => `<mark>${match}</mark>`
    )
  })
  
  return highlighted
}