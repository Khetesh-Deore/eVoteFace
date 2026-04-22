import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { ethers } from 'ethers';
import api from '../../utils/api';
import { getElectionContract } from '../../utils/contract';
import WebcamCapture from '../../components/voter/WebcamCapture';
import OTPInput from '../../components/voter/OTPInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LoadingModal from '../../components/common/LoadingModal';
import { toast } from 'react-toastify';

const VotingPage = () => {
  const { electionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { address, isConnected, connectWallet, switchToSepolia, isCorrectNetwork } = useWallet();

  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [voterStatus, setVoterStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Voting flow state
  const [currentStep, setCurrentStep] = useState(1); // 1: Wallet, 2: Face, 3: OTP, 4: Vote, 5: Success
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [liveImage, setLiveImage] = useState(null);
  const [faceVerifiedToken, setFaceVerifiedToken] = useState(null);
  const [voteAuthToken, setVoteAuthToken] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [processingSubMessage, setProcessingSubMessage] = useState('');

  useEffect(() => {
    loadElectionData();
  }, [electionId]);

  useEffect(() => {
    // Auto-advance to step 2 if wallet is connected and verified
    if (currentStep === 1 && isConnected && isCorrectNetwork && voterStatus?.isRegisteredOnChain) {
      setCurrentStep(2);
    }
  }, [isConnected, isCorrectNetwork, voterStatus, currentStep]);

  const loadElectionData = async () => {
    try {
      setLoading(true);

      const electionResponse = await api.get(`/elections/${electionId}`);
      setElection(electionResponse.data);
      setCandidates(electionResponse.data.candidates || []);

      const statusResponse = await api.get(`/voters/elections/${electionId}/status`);
      setVoterStatus(statusResponse.data);

      if (!statusResponse.data.isRegistered) {
        toast.error('You are not registered for this election');
        navigate(`/elections/${electionId}`);
        return;
      }

      if (statusResponse.data.hasVoted) {
        toast.info('You have already voted in this election');
        navigate(`/elections/${electionId}`);
        return;
      }

      if (electionResponse.data.phase !== 'voting') {
        toast.error('Voting is not currently open for this election');
        navigate(`/elections/${electionId}`);
        return;
      }

      if (!statusResponse.data.isVerified || !statusResponse.data.walletAddress || 
          !statusResponse.data.facePhotoUrl || !statusResponse.data.isRegisteredOnChain) {
        toast.error('You do not meet all requirements to vote');
        navigate(`/elections/${electionId}`);
        return;
      }
    } catch (error) {
      console.error('Load election error:', error);
      toast.error('Failed to load election data');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFaceVerification = async () => {
    if (!liveImage) {
      toast.error('Please capture your face photo');
      return;
    }

    try {
      setProcessing(true);
      setProcessingMessage('Verifying your face...');
      setProcessingSubMessage('Using AI to match your face with registered photo');

      const response = await api.post('/face/verify', {
        liveImageBase64: liveImage,
        electionId
      }, {
        timeout: 60000
      });

      if (response.data.match) {
        setFaceVerifiedToken(response.data.faceVerifiedToken);
        toast.success('Face verified successfully!');
        setCurrentStep(3);
      } else {
        toast.error(response.data.message || 'Face verification failed');
        setLiveImage(null);
      }
    } catch (error) {
      console.error('Face verification error:', error);
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Face verification is taking too long. Please ensure the Python service is running.');
      } else {
        toast.error(error.response?.data?.message || 'Face verification failed');
      }
      setLiveImage(null);
    } finally {
      setProcessing(false);
      setProcessingMessage('');
      setProcessingSubMessage('');
    }
  };

  const handleSendOTP = async () => {
    try {
      setProcessing(true);
      setProcessingMessage('Sending OTP...');
      setProcessingSubMessage('A 6-digit code will be sent to your registered email');
      const response = await api.post('/otp/send', { faceVerifiedToken, electionId });
      toast.success(`OTP sent to ${response.data.email}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setProcessing(false);
      setProcessingMessage('');
      setProcessingSubMessage('');
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    try {
      setProcessing(true);
      setProcessingMessage('Verifying OTP...');
      setProcessingSubMessage('Checking your 6-digit code');
      const response = await api.post('/otp/verify', { code: otpCode, electionId });
      if (response.data.verified) {
        setVoteAuthToken(response.data.voteAuthToken);
        toast.success('OTP verified! You can now cast your vote.');
        setCurrentStep(4);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setProcessing(false);
      setProcessingMessage('');
      setProcessingSubMessage('');
    }
  };

  const handleCastVote = async () => {
    if (!selectedCandidate) {
      toast.error('Please select a candidate');
      return;
    }

    try {
      setProcessing(true);
      setProcessingMessage('Casting your vote...');
      setProcessingSubMessage('Please confirm the transaction in MetaMask');

      const contract = await getElectionContract(election.contractAddress);
      const tx = await contract.castVote(selectedCandidate.onChainId);
      
      setProcessingMessage('Transaction submitted');
      setProcessingSubMessage('Waiting for blockchain confirmation...');

      const receipt = await tx.wait();
      const transactionHash = receipt.hash;

      setProcessingMessage('Recording vote...');
      setProcessingSubMessage('Updating database records');

      await api.post('/votes/record', {
        electionId,
        candidateId: selectedCandidate.onChainId,
        txHash: transactionHash,
        voteAuthToken
      });

      setTxHash(transactionHash);
      toast.success('Vote cast successfully on blockchain!');
      setCurrentStep(5);
    } catch (error) {
      console.error('Cast vote error:', error);
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction rejected by user');
      } else if (error.message?.includes('already voted')) {
        toast.error('You have already voted in this election');
      } else {
        toast.error(error.response?.data?.message || 'Failed to cast vote');
      }
    } finally {
      setProcessing(false);
      setProcessingMessage('');
      setProcessingSubMessage('');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <LoadingModal isOpen={processing} message={processingMessage} subMessage={processingSubMessage} />
      <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 bg-emerald-100 text-emerald-700 px-6 py-2 rounded-3xl text-sm font-medium mb-4">
            <i className="fa-solid fa-fingerprint"></i>
            SECURE VOTING BOOTH
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {election.title}
          </h1>
          <p className="text-slate-600 mt-3">Cast your vote securely with biometric verification</p>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 mb-10">
          <div className="flex justify-between items-center">
            {[
              { num: 1, label: 'Wallet', icon: '🦊' },
              { num: 2, label: 'Face ID', icon: '📷' },
              { num: 3, label: 'OTP', icon: '📧' },
              { num: 4, label: 'Vote', icon: '🗳️' },
              { num: 5, label: 'Done', icon: '✅' }
            ].map((step, index) => (
              <div key={step.num} className="flex flex-col items-center relative flex-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 border-4 border-white shadow-sm
                  ${currentStep >= step.num 
                    ? 'bg-emerald-600 text-white scale-110' 
                    : 'bg-slate-100 text-slate-400'}`}>
                  {currentStep > step.num ? '✓' : step.icon}
                </div>
                <span className={`text-xs mt-3 font-medium ${currentStep >= step.num ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {step.label}
                </span>
                
                {index < 4 && (
                  <div className={`absolute top-7 left-1/2 w-full h-[3px] -translate-x-1/2 transition-all
                    ${currentStep > step.num ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
          
          {/* Step 1: Wallet */}
          {currentStep === 1 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6">🦊</div>
              <h2 className="text-3xl font-semibold mb-4">Connect Your Wallet</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-8">
                Your registered MetaMask wallet is required to cast a vote on the blockchain.
              </p>

              {!window.ethereum ? (
                <a href="https://metamask.io" target="_blank" rel="noreferrer" className="inline-block bg-orange-600 text-white px-10 py-4 rounded-3xl font-semibold">
                  Install MetaMask
                </a>
              ) : !isConnected ? (
                <button onClick={connectWallet} className="bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-3xl font-semibold text-lg transition-all">
                  Connect MetaMask
                </button>
              ) : !isCorrectNetwork ? (
                <button onClick={switchToSepolia} className="bg-red-600 text-white px-12 py-5 rounded-3xl font-semibold">
                  Switch to Sepolia Network
                </button>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8">
                  <p className="text-emerald-700 font-medium">Wallet Connected Successfully</p>
                  <p className="font-mono text-sm text-emerald-600 mt-3 break-all">{address}</p>
                  <p className="text-emerald-600 text-sm mt-8">Proceeding to Face Verification...</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Face Verification */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-3xl font-semibold text-center mb-8">Face Verification</h2>
              <p className="text-slate-600 text-center mb-8 max-w-md mx-auto">
                Look directly at the camera. Ensure good lighting and remove glasses if possible.
              </p>

              <WebcamCapture onCapture={setLiveImage} loading={processing} />

              {liveImage && (
                <button
                  onClick={handleFaceVerification}
                  disabled={processing}
                  className="mt-8 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-5 rounded-3xl text-lg transition-all"
                >
                  {processing ? 'Verifying Face...' : 'Verify My Face & Continue'}
                </button>
              )}
            </div>
          )}

          {/* Step 3: OTP */}
          {currentStep === 3 && (
            <div className="text-center">
              <h2 className="text-3xl font-semibold mb-4">Enter OTP</h2>
              <p className="text-slate-600 mb-8">A 6-digit code has been sent to your registered email</p>
              
              <button 
                onClick={handleSendOTP} 
                disabled={processing}
                className="mb-8 px-8 py-3 bg-slate-900 text-white rounded-3xl font-medium"
              >
                {processing ? 'Sending...' : 'Resend OTP'}
              </button>

              <OTPInput onComplete={handleVerifyOTP} loading={processing} />
            </div>
          )}

          {/* Step 4: Select Candidate & Vote */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-3xl font-semibold text-center mb-8">Choose Your Candidate</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {candidates.map((candidate) => (
                  <button
                    key={candidate._id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`border-2 rounded-3xl p-6 text-left transition-all hover:shadow-md ${
                      selectedCandidate?._id === candidate._id 
                        ? 'border-emerald-600 bg-emerald-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex gap-5 items-center">
                      <img 
                        src={candidate.partySymbol} 
                        alt={candidate.partyName} 
                        className="w-20 h-20 object-cover rounded-2xl" 
                      />
                      <div>
                        <h3 className="text-xl font-semibold">{candidate.name}</h3>
                        <p className="text-emerald-600 font-medium">{candidate.partyName}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedCandidate && (
                <button
                  onClick={handleCastVote}
                  disabled={processing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-5 rounded-3xl text-xl transition-all active:scale-[0.985]"
                >
                  {processing ? 'Casting Vote on Blockchain...' : `Cast Vote for ${selectedCandidate.name}`}
                </button>
              )}
            </div>
          )}

          {/* Step 5: Success */}
          {currentStep === 5 && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-8">
                <span className="text-6xl">🎉</span>
              </div>
              <h2 className="text-4xl font-semibold text-slate-900 mb-4">Vote Cast Successfully!</h2>
              <p className="text-slate-600 max-w-md mx-auto mb-8">Your vote has been securely recorded on the Ethereum Sepolia blockchain.</p>

              <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-10 text-left">
                <p className="text-xs text-slate-500 mb-1">Transaction Hash</p>
                <p className="font-mono text-sm break-all text-slate-900">{txHash}</p>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${txHash}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-emerald-600 hover:underline text-sm mt-4 inline-block"
                >
                  View on Etherscan →
                </a>
              </div>

              <div className="flex gap-4 justify-center">
                <button onClick={() => navigate(`/elections/${electionId}`)} className="px-10 py-4 border border-slate-300 rounded-3xl font-medium">
                  View Election
                </button>
                <button onClick={() => navigate('/dashboard')} className="px-10 py-4 bg-emerald-600 text-white rounded-3xl font-medium">
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default VotingPage;