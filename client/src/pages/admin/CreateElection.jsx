import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import LoadingModal from '../../components/common/LoadingModal';

const CreateElection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingSubMessage, setLoadingSubMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const start = new Date(formData.startTime);
    const end = new Date(formData.endTime);
    const now = new Date();

    if (start < now) {
      toast.error('Start time must be in the future');
      return;
    }

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Deploying election smart contract...');
      setLoadingSubMessage('This may take 30-60 seconds on Ethereum Sepolia');

      const response = await api.post('/admin/elections', formData);

      toast.success('Election created successfully on blockchain!');
      navigate(`/admin/elections/${response.data.election._id}`);
    } catch (error) {
      console.error('Create election error:', error);
      toast.error(error.response?.data?.message || 'Failed to create election');
    } finally {
      setLoading(false);
      setLoadingMessage('');
      setLoadingSubMessage('');
    }
  };

  return (
    <>
      <LoadingModal isOpen={loading} message={loadingMessage} subMessage={loadingSubMessage} />
      <div className="min-h-screen bg-slate-50 py-12 px-6">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-3xl mb-6">
              <i className="fa-solid fa-plus text-5xl text-emerald-600"></i>
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Create New Election
            </h1>
            <p className="text-slate-600 mt-3 text-lg">Set up a secure blockchain-based voting event</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-2">
                  Election Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Maharashtra Legislative Assembly Election 2026"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 text-lg"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Provide details about the election, constituencies, and rules..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900 placeholder:text-slate-400 resize-y"
                />
              </div>

              {/* Date & Time Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-semibold text-slate-700 mb-2">
                    Start Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-2">Registration and candidate nomination begins</p>
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-semibold text-slate-700 mb-2">
                    End Date &amp; Time *
                  </label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    required
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-2">Voting closes and results are finalized</p>
                </div>
              </div>

              {/* Blockchain Info Box */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-7">
                <div className="flex gap-4">
                  <div className="text-3xl">🔗</div>
                  <div>
                    <h3 className="font-semibold text-emerald-800 mb-2">Blockchain Deployment</h3>
                    <div className="text-sm text-emerald-700 space-y-2">
                      <p>• A smart contract will be automatically deployed on Ethereum Sepolia</p>
                      <p>• The election starts in <strong>Registration</strong> phase</p>
                      <p>• You can later add candidates and approve voters</p>
                      <p>• Switch to <strong>Voting</strong> phase when ready</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => navigate('/admin/elections')}
                  disabled={loading}
                  className="flex-1 py-4 border border-slate-300 text-slate-700 font-semibold rounded-3xl hover:bg-slate-50 transition disabled:opacity-60"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold rounded-3xl transition-all active:scale-[0.985] flex items-center justify-center gap-3 text-lg"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deploying on Blockchain...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-rocket"></i>
                      Create & Deploy Election
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <p className="text-center text-xs text-slate-500 mt-8">
            All elections are secured using Ethereum blockchain technology • Immutable &amp; Transparent
          </p>
        </div>
      </div>
    </>
  );
};

export default CreateElection;
