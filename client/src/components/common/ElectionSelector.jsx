import { useElection } from '../../context/ElectionContext';

export default function ElectionSelector() {
  const { elections, selectedElectionId, selectElection, loading } = useElection();

  if (loading) {
    return <div className="text-sm text-gray-500">Loading elections...</div>;
  }

  if (elections.length === 0) {
    return <div className="text-sm text-gray-500">No elections available</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="election-select" className="text-sm font-medium text-gray-700">
        Election:
      </label>
      <select
        id="election-select"
        value={selectedElectionId || ''}
        onChange={(e) => selectElection(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {elections.map((election) => (
          <option key={election._id} value={election._id}>
            {election.title} ({election.phase})
          </option>
        ))}
      </select>
    </div>
  );
}
