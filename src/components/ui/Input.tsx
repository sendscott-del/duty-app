interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-medium" style={{ color: 'var(--p-muted)' }}>{label}</label>}
      <input
        className={`w-full px-3 py-2.5 rounded-lg text-sm bg-[var(--p-card)] border border-[var(--p-border)] focus:border-[var(--gold-border)] focus:outline-none transition-colors min-h-[44px] ${className}`}
        style={{ color: 'var(--p-text)' }}
        {...props}
      />
    </div>
  )
}
