import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import './FlashcardView.css'

interface Flashcard {
    id: string
    question: string
    expectedAnswer: string
    source: string
    keywords: string[]
}

interface FlashcardResult {
    cardId: string
    question: string
    expectedAnswer: string
    userAnswer: string
    keywords: string[]
    timestamp: string
}

interface FlashcardViewProps {
    cards: Flashcard[]
    pattern: string
    onComplete: (results: FlashcardResult[]) => void
    onCancel: () => void
}

export default function FlashcardView({
    cards,
    pattern,
    onComplete,
    onCancel
}: FlashcardViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [userAnswer, setUserAnswer] = useState('')
    const [showAnswer, setShowAnswer] = useState(false)
    const [results, setResults] = useState<FlashcardResult[]>([])
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)

    const currentCard = cards[currentIndex]
    const isLastCard = currentIndex === cards.length - 1

    const handleSubmit = () => {
        setShowAnswer(true)
    }

    const handleNext = () => {
        // Save result
        const result: FlashcardResult = {
            cardId: currentCard.id,
            question: currentCard.question,
            expectedAnswer: currentCard.expectedAnswer,
            userAnswer,
            keywords: currentCard.keywords,
            timestamp: new Date().toISOString()
        }

        const newResults = [...results, result]
        setResults(newResults)

        if (isLastCard) {
            // Complete session
            onComplete(newResults)
        } else {
            // Move to next card
            setCurrentIndex(currentIndex + 1)
            setUserAnswer('')
            setShowAnswer(false)
        }
    }

    const handleCancelClick = () => {
        setShowCancelConfirm(true)
    }

    const handleConfirmCancel = () => {
        setShowCancelConfirm(false)
        onCancel()
    }

    const highlightKeywords = (text: string, keywords: string[]) => {
        let highlighted = text
        keywords.forEach(keyword => {
            const regex = new RegExp(`(${keyword})`, 'gi')
            highlighted = highlighted.replace(regex, '<strong class="keyword">$1</strong>')
        })
        return highlighted
    }

    return (
        <>
            <ConfirmModal
                isOpen={showCancelConfirm}
                title="Cancel Flashcard Session"
                message="Are you sure you want to cancel this flashcard session? Progress will not be saved."
                confirmText="Cancel Session"
                cancelText="Keep Going"
                onConfirm={handleConfirmCancel}
                onCancel={() => setShowCancelConfirm(false)}
            />

            <div className="flashcard-view">
                <div className="flashcard-header">
                    <div className="flashcard-info">
                        <span className="flashcard-pattern">Pattern: {pattern}</span>
                        <span className="flashcard-progress">
                            {currentIndex + 1} / {cards.length}
                        </span>
                    </div>
                    <button onClick={handleCancelClick} className="flashcard-close">
                        ✕
                    </button>
                </div>

                <div className="flashcard-content">
                    <div className="flashcard-question">
                        <h2>Question</h2>
                        <p>{currentCard.question}</p>
                        <small className="flashcard-source">Source: {currentCard.source}</small>
                    </div>

                    {!showAnswer ? (
                        <div className="flashcard-answer-input">
                            <h3>Your Answer</h3>
                            <textarea
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                placeholder="Type your answer here..."
                                className="flashcard-textarea"
                                autoFocus
                            />
                            <button
                                onClick={handleSubmit}
                                className="flashcard-btn primary"
                                disabled={!userAnswer.trim()}
                            >
                                Submit Answer
                            </button>
                        </div>
                    ) : (
                        <div className="flashcard-comparison">
                            <div className="answer-section">
                                <h3>Your Answer</h3>
                                <div
                                    className="answer-content user-answer"
                                    dangerouslySetInnerHTML={{
                                        __html: highlightKeywords(userAnswer, currentCard.keywords)
                                    }}
                                />
                            </div>

                            <div className="answer-section">
                                <h3>Expected Answer</h3>
                                <div
                                    className="answer-content expected-answer"
                                    dangerouslySetInnerHTML={{
                                        __html: highlightKeywords(currentCard.expectedAnswer, currentCard.keywords)
                                    }}
                                />
                                {currentCard.keywords.length > 0 && (
                                    <div className="keywords-list">
                                        <strong>Keywords:</strong> {currentCard.keywords.join(', ')}
                                    </div>
                                )}
                            </div>

                            <button onClick={handleNext} className="flashcard-btn primary">
                                {isLastCard ? 'Complete Session' : 'Next Question'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flashcard-footer">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </>
    )
}