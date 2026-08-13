// Card + error styling shared by the account-recovery pages, kept in their own
// module so AuthShell.tsx exports only a component (react-refresh rule).
export const authCardStyle: React.CSSProperties = {
  background: '#fff',
  border: '3px solid var(--ink)',
  borderRadius: 18,
  padding: 18,
  boxShadow: 'var(--shadow)',
}

export const authErrorStyle: React.CSSProperties = {
  background: 'var(--red)',
  color: '#fff',
  border: '2.5px solid var(--ink)',
  borderRadius: 8,
  padding: '8px 12px',
  fontWeight: 700,
  fontSize: 13,
}
