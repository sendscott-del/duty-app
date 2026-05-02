export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const px = size === 'sm' ? 18 : size === 'lg' ? 32 : 24
  return (
    <div className="flex items-center justify-center p-4">
      <div
        className="animate-spin"
        style={{
          width: px,
          height: px,
          border: '3px solid var(--ink-15)',
          borderTopColor: 'var(--ink)',
          borderRadius: '50%',
        }}
      />
    </div>
  )
}
