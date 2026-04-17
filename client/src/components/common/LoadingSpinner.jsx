export default function LoadingSpinner({ fullScreen = false, size = "md" }) {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-14 w-14"
  };

  const spinner = (
    <div 
      className={`animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600 ${sizes[size]}`} 
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-50/90 backdrop-blur-sm z-[9999] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            {spinner}
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-fingerprint text-emerald-600 text-3xl animate-pulse" />
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-slate-900 font-medium">Securing your vote...</p>
            <p className="text-xs text-slate-500 mt-1">Please wait while we verify your identity</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        {spinner}
        <p className="text-xs text-slate-500">Loading...</p>
      </div>
    </div>
  );
}