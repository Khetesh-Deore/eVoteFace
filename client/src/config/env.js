// Environment Configuration

export const config = {
  // API URLs
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  aiUrl: import.meta.env.VITE_AI_URL || 'http://localhost:5001',
  
  // Blockchain
  blockchainNetwork: import.meta.env.VITE_BLOCKCHAIN_NETWORK || 'mumbai',
  blockchainRpcUrl: import.meta.env.VITE_BLOCKCHAIN_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS || '0x1234567890123456789012345678901234567890',
  
  // App Info
  appName: import.meta.env.VITE_APP_NAME || 'eVoteFace',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  debug: import.meta.env.VITE_DEBUG === 'true',
  
  // Environment
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Feature Flags
  enableDebugPanel: import.meta.env.DEV,
  enableErrorTracking: import.meta.env.PROD,
}

// Log configuration in development
if (config.isDevelopment && config.debug) {
  console.log('eVoteFace Configuration:', config)
}

export default config
