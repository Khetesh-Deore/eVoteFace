import { useWallet } from "../../context/WalletContext";

/**
 * Reusable MetaMask connect button.
 * Shows wallet address when connected, connect button when not.
 * Handles wrong network automatically.
 */
export default function MetaMaskConnect({ className = "" }) {
  const {
    address,
    isConnected,
    isCorrectNetwork,
    connectWallet,
    disconnectWallet,
    switchToSepolia,
    error,
  } = useWallet();

  if (!window.ethereum) {
    return (
      <a
        href="https://metamask.io"
        target="_blank"
        rel="noreferrer"
        className={`inline-flex items-center gap-3 bg-orange-50 border border-orange-200 text-orange-700 px-6 py-3 rounded-3xl text-sm font-medium hover:bg-orange-100 transition-all ${className}`}
      >
        <span className="text-xl">🦊</span>
        Install MetaMask
      </a>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className={`inline-flex items-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3 rounded-3xl text-sm font-semibold transition-all active:scale-95 ${className}`}
      >
        <span className="text-xl">🦊</span>
        Connect MetaMask
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <button
          onClick={switchToSepolia}
          className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-3xl text-sm font-semibold transition-all active:scale-95"
        >
          ⚠️ Switch to Sepolia Network
        </button>
        <p className="text-xs text-red-600 text-center">Wrong network detected. Please switch to Sepolia.</p>
      </div>
    );
  }

  // Connected & Correct Network
  return (
    <div className={`flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-6 py-3 rounded-3xl ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
        <span className="text-emerald-700 font-medium text-sm">Sepolia</span>
      </div>

      <div className="font-mono text-xs text-slate-600 bg-white px-3 py-1 rounded-2xl border border-slate-200">
        {address.slice(0, 6)}...{address.slice(-4)}
      </div>

      <button
        onClick={disconnectWallet}
        className="ml-2 text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
      >
        Disconnect
      </button>
    </div>
  );
}