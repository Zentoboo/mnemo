import { useState, useEffect } from 'react'
import './FlashcardManager.css'

interface FlashcardSession {
    id: string
    pattern: string
    cards: any[]
    results: any[]
    createdAt: string
    completedAt?: string
}

interface DayActivity {
    date: string
    count: number
}

interface FlashcardManagerProps {
    onClose: () => void
}

export default function FlashcardManager({ onClose }: FlashcardManagerProps) {
    const [activityData, setActivityData] = useState<DayActivity[]>([])

    useEffect(() => {
        loadActivityData()
    }, [])

    const loadActivityData = async () => {
        try {
            // Get all flashcard session files
            const sessionFiles = await window.api.getFlashcardSessions()

            // Parse session data from filenames or read files to get completion dates
            const activityMap = new Map<string, number>()

            for (const filename of sessionFiles) {
                // Extract date from filename: flashcard-session.YYYY-MM-DD.session-timestamp.md
                const dateMatch = filename.match(/flashcard-session\.(\d{4}-\d{2}-\d{2})/)
                if (dateMatch) {
                    const date = dateMatch[1]
                    activityMap.set(date, (activityMap.get(date) || 0) + 1)
                }
            }

            // Generate last 365 days of data
            const days: DayActivity[] = []
            const today = new Date()

            for (let i = 364; i >= 0; i--) {
                const date = new Date(today)
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]

                days.push({
                    date: dateStr,
                    count: activityMap.get(dateStr) || 0
                })
            }

            setActivityData(days)
        } catch (error) {
            console.error('Failed to load activity data:', error)
        }
    }

    const getIntensityClass = (count: number): string => {
        if (count === 0) return 'intensity-0'
        if (count === 1) return 'intensity-1'
        if (count <= 3) return 'intensity-2'
        if (count <= 5) return 'intensity-3'
        return 'intensity-4'
    }

    const getMonthLabels = () => {
        const months: { label: string; offset: number }[] = []
        const today = new Date()

        for (let i = 11; i >= 0; i--) {
            const date = new Date(today)
            date.setMonth(date.getMonth() - i)
            const monthName = date.toLocaleDateString('en-US', { month: 'short' })

            // Calculate which week offset this month starts at
            const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
            const weekOffset = Math.floor((364 - daysAgo) / 7)

            months.push({ label: monthName, offset: weekOffset })
        }

        return months
    }

    // Group days into weeks (7 days per column)
    const weeks: DayActivity[][] = []
    for (let i = 0; i < activityData.length; i += 7) {
        weeks.push(activityData.slice(i, i + 7))
    }

    const totalSessions = activityData.reduce((sum, day) => sum + day.count, 0)
    const currentStreak = calculateCurrentStreak(activityData)

    return (
        <div className="flashcard-manager-overlay" onClick={onClose}>
            <div className="flashcard-manager" onClick={(e) => e.stopPropagation()}>
                <div className="manager-header">
                    <h2>Flashcard Activity</h2>
                    <button className="close-button" onClick={onClose}>✕</button>
                </div>

                <div className="manager-content">
                    <div className="stats-row">
                        <div className="stat-item">
                            <span className="stat-value">{totalSessions}</span>
                            <span className="stat-label">Total Sessions</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{currentStreak}</span>
                            <span className="stat-label">Day Streak</span>
                        </div>
                    </div>

                    <div className="activity-graph">
                        <div className="month-labels">
                            {getMonthLabels().map((month, idx) => (
                                <span
                                    key={idx}
                                    className="month-label"
                                    style={{ left: `${month.offset * 14}px` }}
                                >
                                    {month.label}
                                </span>
                            ))}
                        </div>

                        <div className="day-labels">
                            <span>Mon</span>
                            <span>Wed</span>
                            <span>Fri</span>
                        </div>

                        <div className="graph-container">
                            {weeks.map((week, weekIdx) => (
                                <div key={weekIdx} className="week-column">
                                    {week.map((day, dayIdx) => (
                                        <div
                                            key={day.date}
                                            className={`day-cell ${getIntensityClass(day.count)}`}
                                            title={`${day.date}: ${day.count} session${day.count !== 1 ? 's' : ''}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="legend">
                        <span className="legend-label">Less</span>
                        <div className="day-cell intensity-0"></div>
                        <div className="day-cell intensity-1"></div>
                        <div className="day-cell intensity-2"></div>
                        <div className="day-cell intensity-3"></div>
                        <div className="day-cell intensity-4"></div>
                        <span className="legend-label">More</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

function calculateCurrentStreak(activityData: DayActivity[]): number {
    let streak = 0

    // Start from the most recent day and count backwards
    for (let i = activityData.length - 1; i >= 0; i--) {
        if (activityData[i].count > 0) {
            streak++
        } else {
            break
        }
    }

    return streak
}