import { useEffect } from 'react'
import './ConfirmModal.css'

interface ConfirmModalProps {
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel: () => void
}

export default function ConfirmModal({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                onCancel()
            } else if (e.key === 'Enter') {
                e.preventDefault()
                onConfirm()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onConfirm, onCancel])

    if (!isOpen) return null

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button
                        onClick={onCancel}
                        className="confirm-btn cancel-btn"
                        autoFocus
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="confirm-btn confirm-btn-primary"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}