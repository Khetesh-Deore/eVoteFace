import { ethers } from "ethers";
import VotingABI from "./VotingABI.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_KEY;

if (!CONTRACT_ADDRESS) {
  console.error("VITE_CONTRACT_ADDRESS is not set in .env");
}

// Read-only contract — for results, phase, candidate list
export const getReadContract = () => {
  if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured");
  const rpcUrl = ALCHEMY_KEY
    ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
    : "https://rpc.sepolia.org"; // public fallback
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(CONTRACT_ADDRESS, VotingABI, provider);
};

// Write contract — requires MetaMask signer (for castVote)
export const getWriteContract = (signer) => {
  if (!signer) throw new Error("MetaMask signer required to cast vote");
  if (!CONTRACT_ADDRESS) throw new Error("Contract address not configured");
  return new ethers.Contract(CONTRACT_ADDRESS, VotingABI, signer);
};
