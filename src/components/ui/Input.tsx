interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', style, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          className="block stadium-eyebrow"
          style={{ marginBottom: 4 }}
        >
          {label}
        </label>
      )}
      <input
        className={`w-full text-base focus:outline-none ${className}`}
        style={{
          background: '#fff',
          color: 'var(--ink)',
          border: '2.5px solid var(--ink)',
          borderRadius: 10,
          padding: '12px 14px',
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          minHeight: 48,
          boxShadow: 'var(--shadow-sm)',
          ...style,
        }}
        {...props}
      />
    </div>
  )
}
