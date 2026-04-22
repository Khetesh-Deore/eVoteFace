import { useEffect } from 'react';

const LoadingModal = ({ isOpen, message = 'Processing...', subMessage = '' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center animate-fadeIn">
        {/* Animated Spinner */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-emerald-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-600 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-3 border-4 border-emerald-400 rounded-full border-t-transparent animate-spin-slow"></div>
        </div>

        {/* Message */}
        <h3 className="text-2xl font-semibold text-slate-900 mb-3">
          {message}
        </h3>
        
        {subMessage && (
          <p className="text-slate-600 text-sm leading-relaxed">
            {subMessage}
          </p>
        )}

        {/* Pulsing Dots */}
        <div className="flex justify-center gap-2 mt-6">
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
