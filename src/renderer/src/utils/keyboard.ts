// Convert Electron accelerator format to browser KeyboardEvent check
// e.g., "CommandOrControl+K" -> checks if Ctrl/Cmd+K is pressed

export const parseShortcut = (accelerator: string) => {
  const parts = accelerator.split('+').map(p => p.trim())
  
  return {
    keys: parts,
    matches: (event: KeyboardEvent): boolean => {
      const pressedKey = event.key.toLowerCase()
      const lastKey = parts[parts.length - 1].toLowerCase()
      
      // Check if the main key matches
      if (pressedKey !== lastKey) return false
      
      // Check modifiers
      for (const modifier of parts.slice(0, -1)) {
        const mod = modifier.toLowerCase()
        
        if (mod === 'commandorcontrol' || mod === 'cmdorctrl') {
          if (!event.ctrlKey && !event.metaKey) return false
        } else if (mod === 'command' || mod === 'cmd') {
          if (!event.metaKey) return false
        } else if (mod === 'control' || mod === 'ctrl') {
          if (!event.ctrlKey) return false
        } else if (mod === 'alt' || mod === 'option') {
          if (!event.altKey) return false
        } else if (mod === 'shift') {
          if (!event.shiftKey) return false
        }
      }
      
      return true
    }
  }
}

// Format shortcut for display
// e.g., "CommandOrControl+K" -> "Ctrl+K" (or "⌘K" on Mac)
export const formatShortcut = (accelerator: string): string => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  
  return accelerator
    .replace(/CommandOrControl/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/Command/gi, '⌘')
    .replace(/Control/gi, 'Ctrl')
    .replace(/Alt/gi, isMac ? '⌥' : 'Alt')
    .replace(/Shift/gi, isMac ? '⇧' : 'Shift')
}