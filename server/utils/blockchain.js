const { ethers } = require("ethers");
const VotingABI = require("./VotingABI.json");

let provider, adminWallet, contract;

const init = () => {
  provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
  adminWallet = new ethers.Wallet(process.env.ADMIN_WALLET_PRIVATE_KEY, provider);
  contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, VotingABI, adminWallet);
};

const getContract = () => {
  if (!contract) init();
  return contract;
};

const getProvider = () => {
  if (!provider) init();
  return provider;
};

module.exports = { getContract, getProvider, init };
