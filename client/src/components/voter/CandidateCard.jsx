/**
 * Candidate card — used in VotingPage and Results
 * showVoteButton: show vote button (voting page)
 * showVoteCount: show vote count (results page)
 * isWinner: highlight as winner
 */
export default function CandidateCard({
  candidate,
  onVote,
  showVoteButton = false,
  showVoteCount = false,
  isWinner = false,
  disabled = false,
  voting = false,
}) {
  const { id, name, partyName, partySymbol, voteCount = 0 } = candidate;

  return (
    <div className={`border-2 rounded-3xl p-6 flex items-center justify-between transition-all group
      ${isWinner 
        ? "border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50" 
        : "border-slate-200 hover:border-emerald-300 hover:shadow-md"
      }
      ${disabled ? "opacity-60 pointer-events-none" : ""}`}>

      <div className="flex items-center gap-5 flex-1">
        {/* Party Symbol */}
        {partySymbol?.startsWith("http") ? (
          <img 
            src={partySymbol} 
            alt={partyName}
            className="w-20 h-20 object-contain rounded-2xl border border-slate-100 bg-white p-2 shadow-sm" 
          />
        ) : (
          <div className="w-20 h-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-4xl">
            {name?.[0] || "?"}
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-2xl text-slate-900 group-hover:text-emerald-600 transition-colors">
              {name}
            </h3>
            {isWinner && (
              <span className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1 rounded-3xl">
                🏆 WINNER
              </span>
            )}
          </div>
          
          <p className="text-emerald-600 font-medium mt-1">{partyName}</p>

          {showVoteCount && (
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {voteCount.toLocaleString()} votes
            </p>
          )}
        </div>
      </div>

      {/* Vote Button */}
      {showVoteButton && (
        <button
          onClick={() => onVote(id)}
          disabled={disabled || voting}
          className={`px-8 py-4 rounded-3xl font-semibold text-sm transition-all active:scale-95
            ${voting 
              ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
            }`}
        >
          {voting ? "Casting Vote..." : "Vote for this Candidate"}
        </button>
      )}
    </div>
  );
}