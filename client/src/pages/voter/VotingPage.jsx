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

  useEffect(() => {
    loadElectionData();
  }, [electionId]);

  useEffect(() => {
    // Auto-advance to step 2 if wallet is connected and verified
    if (currentStep === 1 && isConnected && isCorrectNetwork && voterStatus?.walletAddress) {
      if (address.toLowerCase() === voterStatus.walletAddress.toLowerCase()) {
        setCurrentStep(2);
      }
    }
  }, [isConnected, isCorrectNetwork, address, voterStatus, currentStep]);

  const loadElectionData = async () => {
    try {
      setLoading(true);

      // Fetch election details
      const electionResponse = await api.get(`/elections/${electionId}`);
      setElection(electionResponse.data);
      setCandidates(electionResponse.data.candidates || []);

      // Fetch voter status
      const statusResponse = await api.get(`/voters/elections/${electionId}/status`);
      setVoterStatus(statusResponse.data);

      // Validate voter eligibility
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

      const response = await api.post('/face/verify', {
        liveImageBase64: liveImage,
        electionId
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
      toast.error(error.response?.data?.message || 'Face verification failed');
      setLiveImage(null);
    } finally {
      setProcessing(false);
    }
  };

  const handleSendOTP = async () => {
    try {
      setProcessing(true);

      const response = await api.post('/otp/send', {
        faceVerifiedToken,
        electionId
      });

      toast.success(`OTP sent to ${response.data.email}`);
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyOTP = async (otpCode) => {
    try {
      setProcessing(true);

      const response = await api.post('/otp/verify', {
        code: otpCode,
        electionId
      });

      if (response.data.verified) {
        setVoteAuthToken(response.data.voteAuthToken);
        toast.success('OTP verified! You can now cast your vote.');
        setCurrentStep(4);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setProcessing(false);
    }
  };

  const handleCastVote = async () => {
    if (!selectedCandidate) {
      toast.error('Please select a candidate');
      return;
    }

    try {
      setProcessing(true);

      // Get contract instance
      const contract = await getElectionContract(election.contractAddress);

      // Cast vote on blockchain
      const tx = await contract.vote(selectedCandidate.onChainId);
      toast.info('Transaction submitted. Waiting for confirmation...');

      const receipt = await tx.wait();
      const transactionHash = receipt.hash;

      // Record vote on backend
      await api.post('/votes/record', {
        electionId,
        candidateId: selectedCandidate.onChainId,
        txHash: transactionHash,
        voteAuthToken
      });

      setTxHash(transactionHash);
      toast.success('Vote cast successfully!');
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
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!election) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cast Your Vote</h1>
        <p className="text-gray-600">{election.title}</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Wallet', icon: '🦊' },
            { num: 2, label: 'Face', icon: '📷' },
            { num: 3, label: 'OTP', icon: '📧' },
            { num: 4, label: 'Vote', icon: '🗳️' },
            { num: 5, label: 'Success', icon: '✓' }
          ].map((step, index) => (
            <div key={step.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition ${
                    currentStep >= step.num
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.num ? '✓' : step.icon}
                </div>
                <span className="text-xs mt-2 text-gray-600">{step.label}</span>
              </div>
              {index < 4 && (
                <div
                  className={`w-16 h-1 mx-2 transition ${
                    currentStep > step.num ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow p-8">
        {/* Step 1: Wallet Verification */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Wallet Verification</h2>
              <p className="text-gray-600">Connect your registered MetaMask wallet to continue</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Registered Wallet:</strong>{' '}
                <span className="font-mono">{voterStatus?.walletAddress}</span>
              </p>
            </div>

            {!window.ethereum ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">MetaMask is not installed</p>
                <a
                  href="https://metamask.io"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
                >
                  Install MetaMask
                </a>
              </div>
            ) : !isConnected ? (
              <div className="text-center py-8">
                <button
                  onClick={connectWallet}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  🦊 Connect MetaMask
                </button>
              </div>
            ) : !isCorrectNetwork ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">Wrong network detected</p>
                <button
                  onClick={switchToSepolia}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Switch to Sepolia
                </button>
              </div>
            ) : address.toLowerCase() !== voterStatus?.walletAddress.toLowerCase() ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">
                  <strong>Error:</strong> Connected wallet does not match your registered wallet.
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Connected: <span className="font-mono">{address}</span>
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Wallet verified! Proceeding to face verification...
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Face Verification */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Face Verification</h2>
              <p className="text-gray-600">Capture your live photo for biometric verification</p>
            </div>

            <WebcamCapture
              onCapture={setLiveImage}
              loading={processing}
              disabled={processing}
            />

            {liveImage && (
              <button
                onClick={handleFaceVerification}
                disabled={processing}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {processing ? 'Verifying...' : 'Verify Face & Continue'}
              </button>
            )}
          </div>
        )}

        {/* Step 3: OTP Verification */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 3: OTP Verification</h2>
              <p className="text-gray-600">Enter the 6-digit code sent to your email</p>
            </div>

            <div className="text-center py-4">
              <button
                onClick={handleSendOTP}
                disabled={processing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 mb-6"
              >
                {processing ? 'Sending...' : 'Send OTP'}
              </button>
            </div>

            <OTPInput onComplete={handleVerifyOTP} loading={processing} />

            <p className="text-sm text-gray-500 text-center">
              Didn't receive the code?{' '}
              <button
                onClick={handleSendOTP}
                disabled={processing}
                className="text-blue-600 hover:underline disabled:opacity-50"
              >
                Resend OTP
              </button>
            </p>
          </div>
        )}

        {/* Step 4: Cast Vote */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 4: Select Candidate</h2>
              <p className="text-gray-600">Choose your candidate and cast your vote</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidates.map((candidate) => (
                <button
                  key={candidate._id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className={`border-2 rounded-lg p-4 text-left transition ${
                    selectedCandidate?._id === candidate._id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={candidate.partySymbol}
                      alt={candidate.partyName}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                      <p className="text-sm text-gray-600">{candidate.partyName}</p>
                    </div>
                    {selectedCandidate?._id === candidate._id && (
                      <svg className="w-6 h-6 text-blue-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {selectedCandidate && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  ⚠️ You are about to vote for: <strong>{selectedCandidate.name}</strong>
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  This action cannot be undone. Please confirm your selection.
                </p>
              </div>
            )}

            <button
              onClick={handleCastVote}
              disabled={!selectedCandidate || processing}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Casting Vote...' : 'Cast Vote'}
            </button>
          </div>
        )}

        {/* Step 5: Success */}
        {currentStep === 5 && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Vote Cast Successfully!</h2>
              <p className="text-gray-600">Your vote has been recorded on the blockchain</p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
              <p className="font-mono text-xs break-all text-gray-900">{txHash}</p>
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm mt-3"
              >
                View on Etherscan
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(`/elections/${electionId}`)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                View Election Details
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VotingPage;
