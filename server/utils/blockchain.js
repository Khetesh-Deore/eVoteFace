const { ethers } = require("ethers");
const VotingABI = require("./VotingABI.json");
const ElectionFactoryABI = require("./ElectionFactoryABI.json");

class ElectionBlockchainService {
  constructor() {
    this.provider = null;
    this.adminWallet = null;
    this.factoryContract = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    try {
      console.log("🔧 Initializing blockchain service...");
      console.log("   FACTORY_ADDRESS:", process.env.FACTORY_ADDRESS || "NOT SET");
      
      this.provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
      this.adminWallet = new ethers.Wallet(process.env.ADMIN_WALLET_PRIVATE_KEY, this.provider);
      
      if (process.env.FACTORY_ADDRESS) {
        this.factoryContract = new ethers.Contract(
          process.env.FACTORY_ADDRESS,
          ElectionFactoryABI,
          this.adminWallet
        );
        console.log("   Factory contract initialized at:", process.env.FACTORY_ADDRESS);
      } else {
        console.warn("   ⚠️  FACTORY_ADDRESS not set - election creation will fail");
      }
      
      this.initialized = true;
      console.log("✅ Blockchain service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize blockchain service:", error.message);
      throw error;
    }
  }

  /**
   * Deploy a new election contract via factory
   * @param {string} electionTitle - Title of the election
   * @param {string} description - Description of the election
   * @returns {Promise<{contractAddress: string, txHash: string, electionId: number}>}
   */
  async deployElectionContract(electionTitle, description) {
    if (!this.initialized) await this.init();
    
    if (!this.factoryContract) {
      throw new Error("Factory contract not initialized. Set FACTORY_ADDRESS in .env");
    }

    try {
      console.log(`🚀 Deploying election: ${electionTitle}`);
      
      const tx = await this.factoryContract.createElection(electionTitle, description);
      console.log(`⏳ Transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      // Parse ElectionCreated event
      const event = receipt.logs
        .map(log => {
          try {
            return this.factoryContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(parsed => parsed && parsed.name === 'ElectionCreated');

      if (!event) {
        throw new Error("ElectionCreated event not found in transaction logs");
      }

      return {
        contractAddress: event.args.contractAddress,
        electionId: Number(event.args.electionId),
        txHash: receipt.hash,
      };
    } catch (error) {
      console.error("❌ Failed to deploy election contract:", error.message);
      throw error;
    }
  }

  /**
   * Get contract instance for a specific election
   * @param {string} contractAddress - Address of the election contract
   * @returns {ethers.Contract}
   */
  getElectionContract(contractAddress) {
    if (!this.initialized) throw new Error("Blockchain service not initialized");
    
    return new ethers.Contract(contractAddress, VotingABI, this.adminWallet);
  }

  /**
   * Get read-only contract instance (for public queries)
   * @param {string} contractAddress - Address of the election contract
   * @returns {ethers.Contract}
   */
  getElectionContractReadOnly(contractAddress) {
    if (!this.initialized) throw new Error("Blockchain service not initialized");
    
    return new ethers.Contract(contractAddress, VotingABI, this.provider);
  }

  /**
   * Get all elections from factory
   * @returns {Promise<Array>}
   */
  async getAllElections() {
    if (!this.initialized) await this.init();
    
    if (!this.factoryContract) {
      throw new Error("Factory contract not initialized");
    }

    try {
      const elections = await this.factoryContract.getAllElections();
      return elections;
    } catch (error) {
      console.error("❌ Failed to get elections from factory:", error.message);
      throw error;
    }
  }

  /**
   * Get elections by admin address
   * @param {string} adminAddress - Admin wallet address
   * @returns {Promise<Array>}
   */
  async getElectionsByAdmin(adminAddress) {
    if (!this.initialized) await this.init();
    
    if (!this.factoryContract) {
      throw new Error("Factory contract not initialized");
    }

    try {
      const elections = await this.factoryContract.getElectionsByAdmin(adminAddress);
      return elections;
    } catch (error) {
      console.error("❌ Failed to get elections by admin:", error.message);
      throw error;
    }
  }

  /**
   * Get provider instance
   * @returns {ethers.JsonRpcProvider}
   */
  getProvider() {
    if (!this.initialized) throw new Error("Blockchain service not initialized");
    return this.provider;
  }

  /**
   * Get admin wallet instance
   * @returns {ethers.Wallet}
   */
  getAdminWallet() {
    if (!this.initialized) throw new Error("Blockchain service not initialized");
    return this.adminWallet;
  }

  /**
   * Verify transaction receipt
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>}
   */
  async getTransactionReceipt(txHash) {
    if (!this.initialized) await this.init();
    
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error("❌ Failed to get transaction receipt:", error.message);
      throw error;
    }
  }
}

// Create and export singleton instance
const blockchainService = new ElectionBlockchainService();

// Export singleton instance as default
module.exports = blockchainService;

// Add legacy methods directly to the exported object
module.exports.getContract = function() {
  // Silently support legacy code - deprecation warning removed to reduce console noise
  if (!blockchainService.initialized) {
    throw new Error("Blockchain service not initialized yet");
  }
  if (!process.env.CONTRACT_ADDRESS) {
    throw new Error("CONTRACT_ADDRESS not set in environment");
  }
  return blockchainService.getElectionContract(process.env.CONTRACT_ADDRESS);
};

module.exports.getProvider = function() {
  if (!blockchainService.initialized) {
    throw new Error("Blockchain service not initialized yet");
  }
  return blockchainService.getProvider();
};
