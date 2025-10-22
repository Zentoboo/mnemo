import { useState, useEffect } from 'react'
import ActivityGraph from './ActivityGraph'
import './Manager.css'

export default function Manager() {
    const [totalSessions, setTotalSessions] = useState(0)
    const [currentStreak, setCurrentStreak] = useState(0)
    const [longestStreak, setLongestStreak] = useState(0)

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const sessionFiles = await window.api.getFlashcardSessions()
            const dates: string[] = []

            for (const filename of sessionFiles) {
                const dateMatch = filename.match(/flashcard-session\.(\d{4}-\d{2}-\d{2})/)
                if (dateMatch) {
                    dates.push(dateMatch[1])
                }
            }

            setTotalSessions(dates.length)

            // Calculate streaks
            const activityMap = new Map<string, number>()
            for (const date of dates) {
                activityMap.set(date, (activityMap.get(date) || 0) + 1)
            }

            // Generate last 365 days for streak calculation
            const days: { date: string; count: number }[] = []
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

            setCurrentStreak(calculateCurrentStreak(days))
            setLongestStreak(calculateLongestStreak(days))
        } catch (error) {
            console.error('Failed to load stats:', error)
        }
    }

    return (
        <>
            <div className="manager-header">
                <h2>Overview</h2>
            </div>

            <div className="manager-container">
                <div className="manager-content">
                    <section className="stats-section">
                        <h3>Statistics</h3>
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">🎯</div>
                                <div className="stat-info">
                                    <span className="stat-value">{totalSessions}</span>
                                    <span className="stat-label">Total Sessions</span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">🔥</div>
                                <div className="stat-info">
                                    <span className="stat-value">{currentStreak}</span>
                                    <span className="stat-label">Current Streak</span>
                                </div>
                            </div>

                            <div className="stat-card">
                                <div className="stat-icon">🏆</div>
                                <div className="stat-info">
                                    <span className="stat-value">{longestStreak}</span>
                                    <span className="stat-label">Longest Streak</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="activity-section">
                        <ActivityGraph />
                    </section>
                </div>
            </div>
        </>
    )
}

function calculateCurrentStreak(activityData: { date: string; count: number }[]): number {
    let streak = 0

    for (let i = activityData.length - 1; i >= 0; i--) {
        if (activityData[i].count > 0) {
            streak++
        } else {
            break
        }
    }

    return streak
}

function calculateLongestStreak(activityData: { date: string; count: number }[]): number {
    let longestStreak = 0
    let currentStreak = 0

    for (const day of activityData) {
        if (day.count > 0) {
            currentStreak++
            longestStreak = Math.max(longestStreak, currentStreak)
        } else {
            currentStreak = 0
        }
    }

    return longestStreak
}