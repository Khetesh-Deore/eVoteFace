import { ethers } from "ethers";
import ElectionABI from "./ElectionABI.json";
import ElectionFactoryABI from "./ElectionFactoryABI.json";

const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_CONTRACT_ADDRESS;
const ALCHEMY_KEY = import.meta.env.VITE_ALCHEMY_KEY;

if (!FACTORY_ADDRESS) {
  console.error("VITE_FACTORY_CONTRACT_ADDRESS is not set in .env");
}

// Get provider
const getProvider = () => {
  const rpcUrl = ALCHEMY_KEY
    ? `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_KEY}`
    : "https://rpc.sepolia.org";
  return new ethers.JsonRpcProvider(rpcUrl);
};

// Get signer from MetaMask
const getSigner = async () => {
  if (!window.ethereum) throw new Error("MetaMask not installed");
  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
};

// Factory contract (read-only)
export const getFactoryContract = () => {
  if (!FACTORY_ADDRESS) throw new Error("Factory address not configured");
  const provider = getProvider();
  return new ethers.Contract(FACTORY_ADDRESS, ElectionFactoryABI, provider);
};

// Election contract (read-only)
export const getElectionContractReadOnly = (electionAddress) => {
  if (!electionAddress) throw new Error("Election address required");
  const provider = getProvider();
  return new ethers.Contract(electionAddress, ElectionABI, provider);
};

// Election contract (write - requires signer)
export const getElectionContract = async (electionAddress) => {
  if (!electionAddress) throw new Error("Election address required");
  const signer = await getSigner();
  return new ethers.Contract(electionAddress, ElectionABI, signer);
};
