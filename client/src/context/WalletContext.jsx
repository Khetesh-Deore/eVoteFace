import { createContext, useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      setIsConnecting(true);

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      const network = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAddress(accounts[0]);
      setChainId(Number(network.chainId));
      setIsConnected(true);

      return accounts[0];
    } catch (error) {
      console.error('Connect wallet error:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
    setIsConnected(false);
  };

  // Switch network
  const switchNetwork = async (targetChainId) => {
    if (!isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }]
      });
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        throw new Error('Please add this network to MetaMask');
      }
      throw error;
    }
  };

  // Get wallet for specific election (from user data)
  const getWalletForElection = (electionId, userData) => {
    if (!userData || !userData.elections) {
      return null;
    }

    const electionData = userData.elections.find(
      e => e.electionId === electionId
    );

    return electionData?.walletAddress || null;
  };

  // Listen for account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== address) {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex) => {
      const newChainId = parseInt(chainIdHex, 16);
      setChainId(newChainId);
      // Reload the page as recommended by MetaMask
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [address]);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0) {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const web3Signer = await web3Provider.getSigner();
          const network = await web3Provider.getNetwork();

          setProvider(web3Provider);
          setSigner(web3Signer);
          setAddress(accounts[0]);
          setChainId(Number(network.chainId));
          setIsConnected(true);
        }
      } catch (error) {
        console.error('Check connection error:', error);
      }
    };

    checkConnection();
  }, []);

  const value = {
    provider,
    signer,
    address,
    chainId,
    isConnected,
    isConnecting,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getWalletForElection
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
