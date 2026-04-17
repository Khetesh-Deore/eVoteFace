import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import { SEPOLIA_CHAIN_ID, SEPOLIA_NETWORK } from '../lib/contract-abi';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connectWallet: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);

  useEffect(() => {
    checkConnection();
    
    if (typeof window !== 'undefined' && window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await browserProvider.listAccounts();
        
        if (accounts.length > 0) {
          const network = await browserProvider.getNetwork();
          const chainId = Number(network.chainId);
          
          setProvider(browserProvider);
          setAddress(accounts[0].address);
          setIsConnected(true);
          setIsCorrectNetwork(chainId === SEPOLIA_CHAIN_ID);
          
          if (chainId === SEPOLIA_CHAIN_ID) {
            const signerInstance = await browserProvider.getSigner();
            setSigner(signerInstance);
          }
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else {
      setAddress(accounts[0]);
      checkConnection();
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask is not installed. Please install MetaMask extension.');
      return;
    }

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      await browserProvider.send('eth_requestAccounts', []);
      
      const accounts = await browserProvider.listAccounts();
      const network = await browserProvider.getNetwork();
      const chainId = Number(network.chainId);
      
      setProvider(browserProvider);
      setAddress(accounts[0].address);
      setIsConnected(true);
      setIsCorrectNetwork(chainId === SEPOLIA_CHAIN_ID);
      
      if (chainId === SEPOLIA_CHAIN_ID) {
        const signerInstance = await browserProvider.getSigner();
        setSigner(signerInstance);
        toast.success('Wallet connected successfully!');
      } else {
        toast.warning('Please switch to Sepolia network');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const switchToSepolia = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_NETWORK.chainId }],
      });
      
      toast.success('Switched to Sepolia network');
      checkConnection();
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [SEPOLIA_NETWORK],
          });
          checkConnection();
        } catch (addError: any) {
          toast.error('Failed to add Sepolia network');
        }
      } else {
        toast.error('Failed to switch network');
      }
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setIsCorrectNetwork(false);
    setProvider(null);
    setSigner(null);
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        isCorrectNetwork,
        provider,
        signer,
        connectWallet,
        switchToSepolia,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}
