const { ethers } = require('ethers');
require('dotenv').config();

// Load ABIs
const ElectionFactoryABI = require('./ElectionFactoryABI.json');
const ElectionABI = require('./ElectionABI.json');

// Setup provider
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);

// Setup admin wallet
const adminWallet = new ethers.Wallet(process.env.ADMIN_WALLET_PRIVATE_KEY, provider);

// Factory contract address
const FACTORY_CONTRACT_ADDRESS = process.env.FACTORY_CONTRACT_ADDRESS;

/**
 * Get factory contract instance
 * @returns {ethers.Contract} Factory contract instance
 */
function getFactoryContract() {
  return new ethers.Contract(
    FACTORY_CONTRACT_ADDRESS,
    ElectionFactoryABI,
    adminWallet
  );
}

/**
 * Get election contract instance for a specific election
 * @param {string} contractAddress - The election contract address
 * @returns {ethers.Contract} Election contract instance
 */
function getElectionContract(contractAddress) {
  if (!contractAddress) {
    throw new Error('Contract address is required');
  }
  
  return new ethers.Contract(
    contractAddress,
    ElectionABI,
    adminWallet
  );
}

/**
 * Get election contract instance with voter signer
 * @param {string} contractAddress - The election contract address
 * @param {string} privateKey - Voter's private key
 * @returns {ethers.Contract} Election contract instance with voter signer
 */
function getElectionContractWithSigner(contractAddress, privateKey) {
  if (!contractAddress) {
    throw new Error('Contract address is required');
  }
  
  if (!privateKey) {
    throw new Error('Private key is required');
  }
  
  const voterWallet = new ethers.Wallet(privateKey, provider);
  
  return new ethers.Contract(
    contractAddress,
    ElectionABI,
    voterWallet
  );
}

/**
 * Get read-only election contract instance (no signer)
 * @param {string} contractAddress - The election contract address
 * @returns {ethers.Contract} Read-only election contract instance
 */
function getElectionContractReadOnly(contractAddress) {
  if (!contractAddress) {
    throw new Error('Contract address is required');
  }
  
  return new ethers.Contract(
    contractAddress,
    ElectionABI,
    provider
  );
}

module.exports = {
  provider,
  adminWallet,
  getFactoryContract,
  getElectionContract,
  getElectionContractWithSigner,
  getElectionContractReadOnly
};
