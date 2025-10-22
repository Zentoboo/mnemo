import { useState, useEffect } from 'react'
import './ActivityGraph.css'

interface DayActivity {
    date: string
    count: number
}

type TimeRange = 'last-12-months' | string

export default function ActivityGraph() {
    const [activityData, setActivityData] = useState<DayActivity[]>([])
    const [allSessionDates, setAllSessionDates] = useState<string[]>([])
    const [timeRange, setTimeRange] = useState<TimeRange>('last-12-months')
    const [availableYears, setAvailableYears] = useState<string[]>([])

    useEffect(() => {
        loadActivityData()
    }, [])

    useEffect(() => {
        if (allSessionDates.length > 0) {
            generateActivityData()
        }
    }, [timeRange, allSessionDates])

    const loadActivityData = async () => {
        try {
            const sessionFiles = await window.api.getFlashcardSessions()
            const dates: string[] = []

            for (const filename of sessionFiles) {
                const dateMatch = filename.match(/flashcard-session\.(\d{4}-\d{2}-\d{2})/)
                if (dateMatch) {
                    dates.push(dateMatch[1])
                }
            }

            setAllSessionDates(dates)

            // Get unique years from dates
            const years = Array.from(new Set(dates.map(date => date.substring(0, 4))))
                .sort()
                .reverse()

            setAvailableYears(years)
        } catch (error) {
            console.error('Failed to load activity data:', error)
        }
    }

    const generateActivityData = () => {
        const activityMap = new Map<string, number>()

        // Count sessions per date
        for (const date of allSessionDates) {
            activityMap.set(date, (activityMap.get(date) || 0) + 1)
        }

        const days: DayActivity[] = []

        if (timeRange === 'last-12-months') {
            // Generate last 365 days
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
        } else {
            // Generate days for specific year
            const year = parseInt(timeRange)
            const startDate = new Date(year, 0, 1)
            const endDate = new Date(year, 11, 31)

            let currentDate = new Date(startDate)
            while (currentDate <= endDate) {
                const dateStr = currentDate.toISOString().split('T')[0]
                days.push({
                    date: dateStr,
                    count: activityMap.get(dateStr) || 0
                })
                currentDate.setDate(currentDate.getDate() + 1)
            }
        }

        setActivityData(days)
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

        if (timeRange === 'last-12-months') {
            const today = new Date()
            const startDate = new Date(today)
            startDate.setDate(startDate.getDate() - 364)

            for (let i = 11; i >= 0; i--) {
                const date = new Date(today)
                date.setMonth(date.getMonth() - i, 1) // Set to 1st of the month
                const monthName = date.toLocaleDateString('en-US', { month: 'short' })

                // Calculate the actual position of this month's first day in our activity data
                const daysFromStart = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

                // Calculate week column (each column is 7 days)
                const weekOffset = Math.floor(daysFromStart / 7)

                months.push({ label: monthName, offset: weekOffset })
            }
        } else {
            // For year view, show all 12 months
            const year = parseInt(timeRange)
            const startDate = new Date(year, 0, 1)
            const startDayOfWeek = startDate.getDay()

            for (let month = 0; month < 12; month++) {
                const date = new Date(year, month, 1)
                const monthName = date.toLocaleDateString('en-US', { month: 'short' })

                // Calculate days from start of year
                const dayOfYear = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                // Calculate week offset considering the starting day of week
                const weekOffset = Math.floor((dayOfYear + startDayOfWeek) / 7)

                months.push({ label: monthName, offset: weekOffset })
            }
        }

        return months
    }

    // Group days into weeks (7 days per column)
    const weeks: DayActivity[][] = []
    for (let i = 0; i < activityData.length; i += 7) {
        weeks.push(activityData.slice(i, i + 7))
    }

    const sessionsInRange = activityData.reduce((sum, day) => sum + day.count, 0)

    return (
        <div className="activity-graph-wrapper">
            <div className="activity-controls">
                <div className='activity-title'>
                    <h3>Activity</h3>
                    <div className="time-range-selector">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="time-range-dropdown"
                        >
                            <option value="last-12-months">Last 12 months</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <span className="session-count">{sessionsInRange} sessions</span>
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

            <div className="activity-graph">
                <div className="month-labels">
                    {getMonthLabels().map((month, idx) => (
                        <span
                            key={idx}
                            className="month-label"
                            style={{ left: `${month.offset * 18 + 9}px` }}
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
                    <div className="graph-scroll">
                        {weeks.map((week, weekIdx) => (
                            <div key={weekIdx} className="week-column">
                                {week.map((day) => {
                                    const date = new Date(day.date)
                                    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
                                    const dayNum = date.getDate()
                                    const month = date.toLocaleDateString('en-US', { month: 'long' })
                                    const year = date.getFullYear()
                                    const sessionText = day.count === 1 ? 'session' : 'sessions'
                                    const tooltip = day.count === 0
                                        ? `No sessions on ${dayName}, ${dayNum} ${month} ${year}`
                                        : `${day.count} ${sessionText} on ${dayName}, ${dayNum} ${month} ${year}`

                                    return (
                                        <div
                                            key={day.date}
                                            className={`day-cell ${getIntensityClass(day.count)}`}
                                            title={tooltip}
                                        />
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}