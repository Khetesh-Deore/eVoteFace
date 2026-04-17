import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useElection } from '../../context/ElectionContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ElectionsList = () => {
  const { user } = useAuth();
  const { fetchPublicElections } = useElection();
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [registrationStatus, setRegistrationStatus] = useState({});
  const [requestingRegistration, setRequestingRegistration] = useState({});
  const [walletInputs, setWalletInputs] = useState({});

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      setLoading(true);
      const data = await fetchPublicElections();
      if (data && Array.isArray(data)) {
        setElections(data);
        if (user) {
          await loadRegistrationStatus(data);
        }
      } else {
        setElections([]);
      }
    } catch (error) {
      console.error('Load elections error:', error);
      toast.error('Failed to load elections');
      setElections([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrationStatus = async (electionsList) => {
    try {
      const response = await api.get('/voters/elections');
      const registeredElections = response.data;
      
      const statusMap = {};
      electionsList.forEach(election => {
        const registered = registeredElections.find(e => e._id === election._id);
        statusMap[election._id] = registered ? (registered.userStatus || {}) : { isRegistered: false };
      });
      
      setRegistrationStatus(statusMap);
    } catch (error) {
      console.error('Load registration status error:', error);
    }
  };

  const handleRequestRegistration = async (electionId) => {
    const walletAddress = walletInputs[electionId];
    
    if (!walletAddress) {
      toast.error('Please enter your wallet address');
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      toast.error('Invalid wallet address format');
      return;
    }

    try {
      setRequestingRegistration(prev => ({ ...prev, [electionId]: true }));
      
      await api.post(`/voters/elections/${electionId}/request-registration`, {
        walletAddress
      });
      
      toast.success('Registration request sent! Waiting for admin approval.');
      
      setWalletInputs(prev => ({ ...prev, [electionId]: '' }));
      await loadElections();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request registration');
    } finally {
      setRequestingRegistration(prev => ({ ...prev, [electionId]: false }));
    }
  };

  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'registration': return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'voting': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'completed': return 'bg-slate-100 text-slate-700 border border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isUpcoming = (election) => {
    const now = new Date();
    const start = new Date(election.startTime);
    return start > now;
  };

  const filteredElections = elections.filter(election => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return isUpcoming(election);
    return election.phase === filter;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="max-w-screen-2xl mx-auto">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Public Elections
          </h1>
          <p className="text-slate-600 mt-3 text-lg">Browse all active, upcoming, and past elections</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 mb-10 overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto">
            {[
              { key: 'all', label: 'All Elections', count: elections.length },
              { key: 'voting', label: 'Active Voting', count: elections.filter(e => e.phase === 'voting').length },
              { key: 'registration', label: 'Registration Open', count: elections.filter(e => e.phase === 'registration').length },
              { key: 'upcoming', label: 'Upcoming', count: elections.filter(e => isUpcoming(e)).length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex-1 min-w-[160px] px-8 py-5 text-sm font-medium transition-all border-b-4 whitespace-nowrap ${
                  filter === tab.key
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs bg-slate-200 px-2.5 py-0.5 rounded-full font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Elections Grid */}
        {filteredElections.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 py-20 text-center">
            <div className="text-6xl mb-6">📭</div>
            <h3 className="text-2xl font-semibold text-slate-900">No elections found</h3>
            <p className="text-slate-600 mt-3 max-w-sm mx-auto">
              {filter === 'all' 
                ? 'There are currently no elections available.' 
                : `No elections match the "${filter}" filter.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredElections.map((election) => {
              const status = registrationStatus[election._id] || {};
              const isRegistered = status.isRegistered !== false;
              const isRequesting = requestingRegistration[election._id] || false;

              return (
                <div
                  key={election._id}
                  className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all card-hover"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <h3 className="text-2xl font-semibold text-slate-900 flex-1 pr-4 line-clamp-2">
                        {election.title}
                      </h3>
                      <span className={`px-5 py-2 rounded-3xl text-sm font-medium whitespace-nowrap ${getPhaseColor(election.phase)}`}>
                        {election.phase}
                      </span>
                    </div>

                    {/* Registration Status */}
                    {user && (
                      <div className="mb-6">
                        {isRegistered ? (
                          status.isVerified ? (
                            <span className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-100 text-emerald-700 rounded-3xl text-sm font-medium">
                              ✓ Registered &amp; Approved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-5 py-2 bg-amber-100 text-amber-700 rounded-3xl text-sm font-medium">
                              ⏳ Pending Admin Approval
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-2 px-5 py-2 bg-slate-100 text-slate-700 rounded-3xl text-sm font-medium">
                            Not Registered
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-slate-600 mb-8 line-clamp-3">{election.description}</p>

                    {/* Dates & Stats */}
                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>📅</span>
                        <span>Starts: {formatDate(election.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-500">
                        <span>📅</span>
                        <span>Ends: {formatDate(election.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-8 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🗳️</span>
                          <span>{election.voterCount || 0} voters</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">👥</span>
                          <span>{election.candidates?.length || 0} candidates</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Area */}
                    <div className="space-y-3">
                      {user && !isRegistered && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                          <p className="text-xs text-slate-600 mb-3">Enter your MetaMask wallet address to register:</p>
                          <input
                            type="text"
                            placeholder="0x1234...abcd"
                            value={walletInputs[election._id] || ''}
                            onChange={(e) => setWalletInputs(prev => ({ ...prev, [election._id]: e.target.value }))}
                            className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-mono focus:border-emerald-500"
                          />
                          <button
                            onClick={() => handleRequestRegistration(election._id)}
                            disabled={isRequesting || !walletInputs[election._id]}
                            className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 rounded-2xl text-sm transition-all"
                          >
                            {isRequesting ? 'Requesting...' : 'Request Registration'}
                          </button>
                        </div>
                      )}

                      <Link
                        to={`/elections/${election._id}`}
                        className="block w-full text-center bg-slate-900 hover:bg-slate-800 text-white font-semibold py-4 rounded-3xl transition-all"
                      >
                        View Election Details →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* How to Participate Info Box */}
        <div className="mt-16 bg-white border border-slate-100 rounded-3xl p-10">
          <div className="flex gap-6">
            <div className="text-5xl">💡</div>
            <div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-4">How to Participate</h3>
              <ul className="space-y-4 text-slate-600">
                <li className="flex gap-4">
                  <span className="font-semibold text-emerald-600 w-6">1.</span>
                  <span>Install MetaMask and copy your wallet address</span>
                </li>
                <li className="flex gap-4">
                  <span className="font-semibold text-emerald-600 w-6">2.</span>
                  <span>Enter your wallet address to request registration</span>
                </li>
                <li className="flex gap-4">
                  <span className="font-semibold text-emerald-600 w-6">3.</span>
                  <span>Wait for admin approval and complete face verification</span>
                </li>
                <li className="flex gap-4">
                  <span className="font-semibold text-emerald-600 w-6">4.</span>
                  <span>Vote securely during the voting phase</span>
                </li>
              </ul>
              <p className="text-xs text-slate-500 mt-8">
                💡 Tip: You can use different wallet addresses for different elections
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectionsList;