import { ethers } from "ethers";
import VotingABI from "./VotingABI.json";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_KEY;

if (!CONTRACT_ADDRESS) {
  console.warn("VITE_CONTRACT_ADDRESS is not set in .env - using election-specific addresses");
}

/**
 * Get read-only contract instance
 * @param {string} contractAddress - Optional contract address (uses env var if not provided)
 * @returns {ethers.Contract}
 */
export const getReadContract = (contractAddress = CONTRACT_ADDRESS) => {
  if (!contractAddress) throw new Error("Contract address not configured");
  
  const rpcUrl = ALCHEMY_KEY
    ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
    : "https://rpc.sepolia.org";
  
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return new ethers.Contract(contractAddress, VotingABI, provider);
};

/**
 * Get write contract instance (requires MetaMask signer)
 * @param {ethers.Signer} signer - MetaMask signer
 * @param {string} contractAddress - Optional contract address (uses env var if not provided)
 * @returns {ethers.Contract}
 */
export const getWriteContract = (signer, contractAddress = CONTRACT_ADDRESS) => {
  if (!signer) throw new Error("MetaMask signer required to cast vote");
  if (!contractAddress) throw new Error("Contract address not configured");
  
  return new ethers.Contract(contractAddress, VotingABI, signer);
};
