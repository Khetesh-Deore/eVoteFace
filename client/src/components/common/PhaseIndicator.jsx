const phases = ["Registration", "Voting", "Completed"];

export default function PhaseIndicator({ phase }) {
  const currentIndex = phases.indexOf(phase.charAt(0).toUpperCase() + phase.slice(1));

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-3">
        {phases.map((p, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
            <div key={p} className="flex items-center">
              {/* Phase Step */}
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-3xl text-sm font-medium transition-all
                ${isActive 
                  ? "bg-emerald-600 text-white shadow-sm" 
                  : isCompleted 
                    ? "bg-emerald-100 text-emerald-700" 
                    : "bg-slate-100 text-slate-500"
                }`}>
                {isCompleted && <i className="fa-solid fa-check text-base"></i>}
                {p}
              </div>

              {/* Connector Line */}
              {index < phases.length - 1 && (
                <div className={`h-[3px] w-12 mx-2 rounded-full transition-all
                  ${isCompleted ? "bg-emerald-600" : "bg-slate-200"}`} 
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}