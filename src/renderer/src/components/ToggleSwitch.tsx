import './ToggleSwitch.css'

interface ToggleSwitchProps {
    options: { value: string; label: string }[]
    name: string
    selected: string
    onChange: (value: string) => void
    heading?: string
}

export default function ToggleSwitch({
    options,
    name,
    selected,
    onChange,
    heading
}: ToggleSwitchProps) {
    return (
        <div className="toggle-switch-container">
            {heading && <div className="toggle-switch-heading">{heading}</div>}
            <div className="toggle-switch-wrapper">
                {options.map((option, index) => (
                    <div key={option.value}>
                        <input
                            className="toggle-input"
                            id={`${name}-${option.value}`}
                            value={option.value}
                            name={name}
                            type="radio"
                            checked={selected === option.value}
                            onChange={() => onChange(option.value)}
                        />
                        <label className="toggle-label" htmlFor={`${name}-${option.value}`}>
                            {option.label}
                        </label>
                    </div>
                ))}
            </div>
        </div>
    )
}