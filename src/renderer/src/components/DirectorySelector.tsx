import { useState } from 'react'
import './DirectorySelector.css'

interface DirectorySelectorProps {
  recentDirectories: string[]
  onSelectDirectory: (path: string) => void
}

export default function DirectorySelector({
  recentDirectories,
  onSelectDirectory
}: DirectorySelectorProps) {
  const [isSelecting, setIsSelecting] = useState(false)

  const handleBrowse = async () => {
    setIsSelecting(true)
    const path = await window.api.selectNotesDirectory()
    setIsSelecting(false)
    if (path) {
      onSelectDirectory(path)
    }
  }

  return (
    <div className="directory-selector-overlay">
      <div className="directory-selector">
        <h1>Welcome to Mnemo</h1>
        <p className="subtitle">Select a directory to store your notes</p>

        {recentDirectories.length > 0 && (
          <div className="recent-directories">
            <h3>Recent Directories</h3>
            <div className="recent-list">
              {recentDirectories.map((dir) => (
                <button
                  key={dir}
                  className="directory-item"
                  onClick={() => onSelectDirectory(dir)}
                >
                  <span className="dir-icon">📁</span>
                  <span className="dir-path">{dir}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          className="browse-button"
          onClick={handleBrowse}
          disabled={isSelecting}
        >
          {isSelecting ? 'Selecting...' : '📂 Browse for Directory'}
        </button>
      </div>
    </div>
  )
}