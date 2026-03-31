import { createContext, useContext, useState, useEffect } from "react";
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

  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  const connectWallet = async () => {
    setError(null);
    if (!window.ethereum) {
      setError("MetaMask is not installed. Please install it from metamask.io");
      return;
    }
    try {
      const _provider = new ethers.BrowserProvider(window.ethereum);
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

      // Auto-switch to Sepolia if wrong network
      if (_chainId !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia();
      }
    } catch (err) {
      setError(err.message || "Failed to connect wallet");
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
  };

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    const onAccountsChanged = (accounts) => {
      if (accounts.length === 0) disconnectWallet();
      else setAddress(accounts[0]);
    };
    const onChainChanged = (id) => setChainId(id);
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
