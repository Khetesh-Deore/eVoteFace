/**
 * Maps technical blockchain errors to user-friendly messages
 */
function mapBlockchainError(error) {
  const errorMessage = error.message.toLowerCase();
  
  // Network errors
  if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return 'Blockchain network is temporarily unavailable. Please try again.';
  }
  
  // Nonce errors
  if (errorMessage.includes('nonce too low') || errorMessage.includes('nonce')) {
    return 'Transaction conflict detected. Please try again.';
  }
  
  // Gas errors
  if (errorMessage.includes('gas') || errorMessage.includes('out of gas')) {
    return 'Transaction requires more gas. Please contact support.';
  }
  
  // Insufficient funds
  if (errorMessage.includes('insufficient funds') || errorMessage.includes('balance')) {
    return 'Insufficient funds in admin wallet. Please contact support.';
  }
  
  // Contract errors
  if (errorMessage.includes('revert') || errorMessage.includes('execution reverted')) {
    return 'Smart contract rejected the transaction. Please verify the data and try again.';
  }
  
  // ABI errors
  if (errorMessage.includes('abi') || errorMessage.includes('decoding')) {
    return 'Contract communication error. Please contact support.';
  }
  
  // Connection errors
  if (errorMessage.includes('connection') || errorMessage.includes('econnrefused')) {
    return 'Cannot connect to blockchain. Please try again later.';
  }
  
  // Generic fallback
  return 'Blockchain operation failed. Please try again or contact support.';
}

/**
 * Maps technical database errors to user-friendly messages
 */
function mapDatabaseError(error) {
  const errorMessage = error.message.toLowerCase();
  
  // Duplicate key
  if (error.code === 11000 || errorMessage.includes('duplicate')) {
    return 'This record already exists in the database.';
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    return 'Invalid data provided. Please check your input.';
  }
  
  // Connection errors
  if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return 'Database temporarily unavailable. Please try again.';
  }
  
  // Generic fallback
  return 'Database operation failed. Please try again.';
}

module.exports = {
  mapBlockchainError,
  mapDatabaseError,
};
