export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  ...props 
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-colors'
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-secondary text-white hover:bg-secondary/90',
    danger: 'bg-danger text-white hover:bg-danger/90',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10',
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
