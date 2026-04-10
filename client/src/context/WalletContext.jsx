import { createContext, useContext, useState, useEffect, useRef } from "react";
import { ethers } from "ethers";

const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner]     = useState(null);
  const [address, setAddress]   = useState(null);
  const [chainId, setChainId]   = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const connectingRef = useRef(false);

  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  const connectWallet = async () => {
    if (connectingRef.current) {
      setError("Connection in progress. Please wait.");
      return;
    }

    setError(null);
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install it from metamask.io");
      return;
    }

    connectingRef.current = true;

    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check if already connected
      const accounts = await _provider.listAccounts();
      if (accounts.length > 0) {
        const _signer  = await _provider.getSigner();
        const _address = await _signer.getAddress();
        const network  = await _provider.getNetwork();
        const _chainId = "0x" + network.chainId.toString(16);

        setProvider(_provider);
        setSigner(_signer);
        setAddress(_address);
        setChainId(_chainId);
        setIsConnected(true);

        if (_chainId !== SEPOLIA_CHAIN_ID) {
          await switchToSepolia();
        }
        connectingRef.current = false;
        return;
      }

      // Request accounts only if not connected
      await _provider.send("eth_requestAccounts", []);
      const _signer  = await _provider.getSigner();
      const _address = await _signer.getAddress();
      const network  = await _provider.getNetwork();
      const _chainId = "0x" + network.chainId.toString(16);

      setProvider(_provider);
      setSigner(_signer);
      setAddress(_address);
      setChainId(_chainId);
      setIsConnected(true);

      if (_chainId !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia();
      }
    } catch (err) {
      if (err.code === -32002) {
        setError("Connection request pending. Close MetaMask popup and try again.");
      } else if (err.code === 4001) {
        setError("Connection rejected. Please approve in MetaMask.");
      } else {
        setError(err.message || "Failed to connect wallet");
      }
    } finally {
      connectingRef.current = false;
    }
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
    } catch (err) {
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: "Sepolia Testnet",
            rpcUrls: ["https://rpc.sepolia.org"],
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
      }
    }
  };

  const disconnectWallet = () => {
    setProvider(null); setSigner(null);
    setAddress(null);  setChainId(null);
    setIsConnected(false);
    setError(null);
    connectingRef.current = false;
  };

  // Auto-connect if already authorized
  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum || connectingRef.current) return;
      try {
        const _provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await _provider.listAccounts();
        if (accounts.length > 0) {
          const _signer  = await _provider.getSigner();
          const _address = await _signer.getAddress();
          const network  = await _provider.getNetwork();
          const _chainId = "0x" + network.chainId.toString(16);

          setProvider(_provider);
          setSigner(_signer);
          setAddress(_address);
          setChainId(_chainId);
          setIsConnected(true);
        }
      } catch (err) {
        console.error("Auto-connect failed:", err);
      }
    };
    checkConnection();
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        setAddress(accounts[0]);
        connectingRef.current = false;
      }
    };
    const onChainChanged = (id) => {
      setChainId(id);
      connectingRef.current = false;
    };
    window.ethereum.on("accountsChanged", onAccountsChanged);
    window.ethereum.on("chainChanged", onChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", onAccountsChanged);
      window.ethereum.removeListener("chainChanged", onChainChanged);
    };
  }, []);

  return (
    <WalletContext.Provider value={{
      provider, signer, address, chainId,
      isConnected, isCorrectNetwork, error,
      connectWallet, disconnectWallet, switchToSepolia,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
};
