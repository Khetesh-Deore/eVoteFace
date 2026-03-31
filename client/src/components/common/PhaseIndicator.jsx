const phases = ["Registration", "Voting", "Completed"];

export default function PhaseIndicator({ phase }) {
  const current = phases.indexOf(phase);

  return (
    <div className="flex items-center gap-2">
      {phases.map((p, i) => (
        <div key={p} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
            ${i === current ? "bg-accent text-white" : i < current ? "bg-success text-white" : "bg-gray-200 text-gray-500"}`}>
            {i < current && <span>✓</span>}
            {p}
          </div>
          {i < phases.length - 1 && (
            <div className={`h-0.5 w-6 ${i < current ? "bg-success" : "bg-gray-300"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
