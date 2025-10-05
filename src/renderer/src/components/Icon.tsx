import './Icon.css'

interface IconProps {
    name: 'refresh' | 'search' | 'setting'
    size?: number
    className?: string
}

export default function Icon({ name, size = 20, className = '' }: IconProps) {
    return (
        <img
            src={`/src/assets/icons/icon-${name}.svg`}
            alt={name}
            className={`icon ${className}`}
            style={{ width: size, height: size }}
        />
    )
}