import { ethers } from "ethers";
import VotingABI from "./VotingABI.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

// Read-only contract (no signer needed — for results, phase, etc.)
export const getReadContract = () => {
  const provider = new ethers.JsonRpcProvider(
    `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY || ""}`
  );
  return new ethers.Contract(CONTRACT_ADDRESS, VotingABI, provider);
};

// Write contract — requires MetaMask signer (for castVote)
export const getWriteContract = (signer) => {
  if (!signer) throw new Error("Signer required for write operations");
  return new ethers.Contract(CONTRACT_ADDRESS, VotingABI, signer);
};
