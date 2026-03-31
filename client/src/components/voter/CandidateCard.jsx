/**
 * Candidate card — used in VotingPage and Results
 * showVoteButton: show vote button (voting page)
 * showVoteCount: show vote count (results page)
 * isWinner: highlight as winner
 */
export default function CandidateCard({
  candidate, onVote, showVoteButton = false,
  showVoteCount = false, isWinner = false, disabled = false, voting = false,
}) {
  const { id, name, partyName, partySymbol, voteCount } = candidate;

  return (
    <div className={`border-2 rounded-lg p-4 flex items-center justify-between transition-all
      ${isWinner ? "border-accent bg-orange-50" : "border-gray-200 hover:border-primary hover:bg-blue-50"}
      ${disabled ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3">
        {partySymbol?.startsWith("http") ? (
          <img src={partySymbol} alt={partyName}
            className="w-12 h-12 object-contain rounded border border-gray-200 bg-white p-1" />
        ) : (
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xl">
            {name[0]}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-dark">{name}</p>
            {isWinner && <span className="badge-success text-xs">🏆 Winner</span>}
          </div>
          <p className="text-xs text-gray-500">{partyName}</p>
          {showVoteCount && (
            <p className="text-sm font-bold text-primary mt-0.5">{voteCount} votes</p>
          )}
        </div>
      </div>

      {showVoteButton && (
        <button
          onClick={() => onVote(id)}
          disabled={disabled || voting}
          className="btn-accent text-sm px-5 py-2 shrink-0">
          {voting ? "..." : "Vote"}
        </button>
      )}
    </div>
  );
}
