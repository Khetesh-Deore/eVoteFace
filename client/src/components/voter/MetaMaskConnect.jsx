import { useWallet } from "../../context/WalletContext";

/**
 * Reusable MetaMask connect button.
 * Shows wallet address when connected, connect button when not.
 * Handles wrong network automatically.
 */
export default function MetaMaskConnect({ className = "" }) {
  const {
    address, isConnected, isCorrectNetwork,
    connectWallet, disconnectWallet, switchToSepolia, error,
  } = useWallet();

  if (!window.ethereum) {
    return (
      <a href="https://metamask.io" target="_blank" rel="noreferrer"
        className={`inline-flex items-center gap-2 bg-orange-100 text-orange-800 border border-orange-300 px-4 py-2 rounded text-sm font-medium hover:bg-orange-200 transition-colors ${className}`}>
        🦊 Install MetaMask
      </a>
    );
  }

  if (!isConnected) {
    return (
      <div className={className}>
        <button onClick={connectWallet}
          className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-700 transition-colors">
          🦊 Connect MetaMask
        </button>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className={className}>
        <button onClick={switchToSepolia}
          className="inline-flex items-center gap-2 bg-red-100 text-red-700 border border-red-300 px-4 py-2 rounded text-sm font-medium hover:bg-red-200 transition-colors">
          ⚠️ Switch to Sepolia
        </button>
        <p className="text-xs text-red-500 mt-1">Wrong network detected</p>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded text-sm">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        <span className="text-green-700 font-medium">Sepolia</span>
        <span className="text-gray-500 font-mono text-xs">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </div>
      <button onClick={disconnectWallet}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">
        Disconnect
      </button>
    </div>
  );
}
