// Simplified Voting Contract ABI for interaction
export const VOTING_CONTRACT_ABI = [
  "function castVote(uint256 candidateId) external",
  "function getVoteCount(uint256 candidateId) external view returns (uint256)",
  "function getCurrentPhase() external view returns (uint8)",
  "function isVoterRegistered(address voter) external view returns (bool)",
  "function hasVoted(address voter) external view returns (bool)",
  "event VoteCast(address indexed voter, uint256 indexed candidateId)"
];

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_NETWORK = {
  chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'SepoliaETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://sepolia.infura.io/v3/'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};
