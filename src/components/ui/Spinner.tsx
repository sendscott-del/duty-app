export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }
  return (
    <div className="flex items-center justify-center p-4">
      <div className={`${sizes[size]} border-2 border-[var(--p-dim)] border-t-[var(--gold)] rounded-full animate-spin`} />
    </div>
  )
}
