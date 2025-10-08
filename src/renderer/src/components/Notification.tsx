import { useEffect } from 'react'
import './Notification.css'

interface NotificationProps {
    isOpen: boolean
    message: string
    type?: 'success' | 'error' | 'info'
    onClose: () => void
    duration?: number
}

export default function Notification({
    isOpen,
    message,
    type = 'info',
    onClose,
    duration = 3000
}: NotificationProps) {
    useEffect(() => {
        if (!isOpen) return

        const timer = setTimeout(() => {
            onClose()
        }, duration)

        return () => clearTimeout(timer)
    }, [isOpen, duration, onClose])

    if (!isOpen) return null

    return (
        <div className={`notification notification-${type}`}>
            <span className="notification-message">{message}</span>
            <button className="notification-close" onClick={onClose}>
                ✕
            </button>
        </div>
    )
}