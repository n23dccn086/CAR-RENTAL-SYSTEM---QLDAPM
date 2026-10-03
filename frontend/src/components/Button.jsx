export default function Button({ children, variant = 'primary', onClick, type = 'button' }) {
  const className = variant === 'primary' ? 'btn-login' : 'btn-secondary'
  return (
    <button type={type} className={className} onClick={onClick}>
      <span>{children}</span>
    </button>
  )
}