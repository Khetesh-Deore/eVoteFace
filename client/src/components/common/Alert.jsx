export const Alert = ({ type = 'info', title, message, onClose }) => {
  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }

  return (
    <div className={`border rounded-lg p-4 ${colors[type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl font-bold">{icons[type]}</span>
        <div className="flex-1">
          {title && <h3 className="font-semibold">{title}</h3>}
          {message && <p className="text-sm mt-1">{message}</p>}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-lg font-bold opacity-50 hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}
