import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { Wallet, Camera, Mail, Vote as VoteIcon, CheckCircle2, AlertTriangle, Users, FileText, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import MetaMaskConnect from '../components/MetaMaskConnect';
import WebcamCapture from '../components/WebcamCapture';
import OTPInput from '../components/OTPInput';
import LoadingSpinner from '../components/LoadingSpinner';
import axiosInstance from '../lib/axios';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { VOTING_CONTRACT_ABI } from '../lib/contract-abi';

type VotingStep = 0 | 1 | 2 | 3 | 4;

export default function VotingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isConnected, isCorrectNetwork, signer, address } = useWallet();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<VotingStep>(0);
  const [election, setElection] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Step 1: Face verification
  const [faceVerifying, setFaceVerifying] = useState(false);
  const [faceVerifiedToken, setFaceVerifiedToken] = useState('');
  
  // Step 2: OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [voteAuthToken, setVoteAuthToken] = useState('');
  
  // Step 3: Voting
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [voting, setVoting] = useState(false);
  
  // Step 4: Success
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    loadElectionData();
  }, [id]);

  useEffect(() => {
    if (otpCode.length === 6 && !otpVerifying) {
      verifyOTP();
    }
  }, [otpCode]);

  const loadElectionData = async () => {
    if (!id) return;
    
    try {
      const response = await axiosInstance.get(`/elections/${id}`);
      setElection(response.data);
      
      const candidatesResponse = await axiosInstance.get(`/elections/${id}/votes/candidates`);
      setCandidates(candidatesResponse.data || response.data.candidates || []);
    } catch (error) {
      toast.error('Failed to load election data');
    } finally {
      setLoading(false);
    }
  };

  // Step 0: Verify wallet
  const verifyWallet = async () => {
    if (!isConnected || !isCorrectNetwork) {
      toast.error('Please connect MetaMask to Sepolia network');
      return;
    }
    
    toast.success('Wallet verified! Moving to face verification...');
    setCurrentStep(1);
  };

  // Step 1: Verify face
  const handleFaceCapture = async (imageBase64: string) => {
    setFaceVerifying(true);
    try {
      const response = await axiosInstance.post('/face/verify', {
        liveImageBase64: imageBase64,
        electionId: id
      });
      
      setFaceVerifiedToken(response.data.faceVerifiedToken);
      toast.success('Face verified successfully!');
      setCurrentStep(2);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Face verification failed');
    } finally {
      setFaceVerifying(false);
    }
  };

  // Step 2: Send OTP
  const sendOTP = async () => {
    try {
      await axiosInstance.post('/otp/send', {
        faceVerifiedToken,
        electionId: id
      });
      
      setOtpSent(true);
      toast.success(`OTP sent to your email`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    }
  };

  // Step 2: Verify OTP
  const verifyOTP = async () => {
    setOtpVerifying(true);
    try {
      const response = await axiosInstance.post('/otp/verify', {
        code: otpCode,
        electionId: id
      });
      
      setVoteAuthToken(response.data.voteAuthToken);
      toast.success('OTP verified! You can now vote.');
      setCurrentStep(3);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
      setOtpCode('');
    } finally {
      setOtpVerifying(false);
    }
  };

  // Step 3: Cast vote
  const castVote = async () => {
    if (!selectedCandidate) {
      toast.error('Please select a candidate');
      return;
    }

    const confirmed = window.confirm(
      `You are about to vote for ${selectedCandidate.name}. This action cannot be undone. Are you sure?`
    );
    
    if (!confirmed) return;

    setVoting(true);
    try {
      // Interact with smart contract
      toast.info('Submitting transaction to blockchain...');
      
      const contract = new ethers.Contract(
        election.contractAddress,
        VOTING_CONTRACT_ABI,
        signer
      );
      
      const tx = await contract.castVote(selectedCandidate.onChainId);
      toast.info('Transaction submitted. Waiting for confirmation...');
      
      const receipt = await tx.wait();
      const transactionHash = receipt.hash;
      
      // Record vote in database
      await axiosInstance.post('/votes/record', {
        electionId: id,
        candidateId: selectedCandidate._id,
        txHash: transactionHash,
        voteAuthToken
      });
      
      setTxHash(transactionHash);
      toast.success('Vote cast successfully!');
      setCurrentStep(4);
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error: any) {
      console.error('Voting error:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        toast.error('Transaction rejected by user');
      } else if (error.message?.includes('already voted')) {
        toast.error('You have already voted in this election');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        toast.error(error.response?.data?.message || error.message || 'Failed to cast vote');
      }
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!election) return <div>Election not found</div>;

  const steps = [
    { icon: Wallet, label: 'Wallet', number: 1 },
    { icon: Camera, label: 'Face', number: 2 },
    { icon: Mail, label: 'OTP', number: 3 },
    { icon: VoteIcon, label: 'Vote', number: 4 },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Election Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
        >
          <h1 className="text-2xl font-bold text-[#1a1a2e] mb-4">
            Cast Your Vote
          </h1>
          <h2 className="text-xl text-gray-700 mb-4">{election.title}</h2>
          
          {currentStep > 0 && currentStep < 4 && (
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <p className="text-sm text-orange-700">
                Voting session in progress. Do not refresh or close this page.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                <strong>{candidates.length}</strong> Candidates
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">
                <strong>{election.stats?.votedCount || 0}</strong> Votes Cast
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600">Voting Open</span>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep > index
                        ? 'bg-green-600 text-white'
                        : currentStep === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {currentStep > index ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <span>{step.number}</span>
                    )}
                  </div>
                  <span className="text-xs mt-2 text-gray-600 hidden md:block">
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-12 md:w-24 mx-2 transition-all ${
                      currentStep > index ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {currentStep === 0 && (
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a2e] mb-4">
                Step 1 — Wallet Verification
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your MetaMask wallet. It must be registered for this election.
              </p>
              <MetaMaskConnect />
              {isConnected && isCorrectNetwork && (
                <button
                  onClick={verifyWallet}
                  className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Verify Wallet →
                </button>
              )}
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a2e] mb-4">
                Step 2 — Face Verification
              </h2>
              <p className="text-gray-600 mb-6">
                Capture your live photo for biometric verification.
              </p>
              <WebcamCapture onCapture={handleFaceCapture} loading={faceVerifying} />
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a2e] mb-4">
                Step 3 — OTP Verification
              </h2>
              
              {!otpSent ? (
                <div>
                  <p className="text-gray-600 mb-6">
                    An OTP will be sent to your registered email: {user?.email?.replace(/(?<=.{2}).(?=.*@)/g, '*')}
                  </p>
                  <button
                    onClick={sendOTP}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Send OTP to Email
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-6">
                    Enter the 6-digit OTP sent to your email.
                  </p>
                  <OTPInput value={otpCode} onChange={setOtpCode} />
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="mt-4 text-sm text-[#e94560] hover:underline"
                  >
                    Didn't receive the code? Resend OTP
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-[#1a1a2e] mb-4">
                Step 4 — Select Candidate
              </h2>
              <p className="text-gray-600 mb-6">
                Choose your candidate. MetaMask will ask you to confirm the transaction.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {candidates.map((candidate) => (
                  <button
                    key={candidate._id}
                    onClick={() => setSelectedCandidate(candidate)}
                    disabled={voting}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      selectedCandidate?._id === candidate._id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } ${voting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      {candidate.partySymbol ? (
                        <img
                          src={candidate.partySymbol}
                          alt={candidate.partyName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-500">
                            {candidate.name[0]}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{candidate.name}</h3>
                        <p className="text-sm text-gray-600">{candidate.partyName}</p>
                      </div>
                      {selectedCandidate?._id === candidate._id && (
                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedCandidate && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900">
                        You are about to vote for: {selectedCandidate.name}
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        This action cannot be undone. Please confirm your selection.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={castVote}
                disabled={!selectedCandidate || voting}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
              >
                {voting ? 'Casting Vote...' : 'Cast Vote'}
              </button>

              <p className="mt-4 text-xs text-center text-gray-500">
                Your vote is anonymous and permanently recorded on the Ethereum blockchain for {election.title}.
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-[#1a1a2e] mb-4">
                Vote Cast Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your vote has been permanently recorded on the blockchain.
              </p>
              
              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-2">Transaction Hash:</p>
                <p className="text-xs font-mono break-all text-gray-900">{txHash}</p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                >
                  View on Etherscan →
                </a>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                Redirecting to dashboard in 3 seconds...
              </p>

              <button
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg font-semibold transition-colors"
              >
                Go to Dashboard Now →
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
