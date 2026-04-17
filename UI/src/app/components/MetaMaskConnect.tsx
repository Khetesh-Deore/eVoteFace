import { useWallet } from '../context/WalletContext';
import { Wallet, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MetaMaskConnect() {
  const { address, isConnected, isCorrectNetwork, connectWallet, switchToSepolia } = useWallet();

  if (!window.ethereum) {
    return (
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-orange-900">MetaMask Not Installed</h4>
            <p className="text-sm text-orange-700 mt-1">
              Please install MetaMask extension to connect your wallet.
            </p>
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm transition-colors"
            >
              Install MetaMask
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#e94560] hover:bg-[#d63651] text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
      >
        <Wallet className="w-5 h-5" />
        Connect MetaMask
      </button>
    );
  }

  if (!isCorrectNetwork) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900">Wrong Network Detected</h4>
              <p className="text-sm text-red-700 mt-1">
                Please switch to Sepolia Testnet to continue.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={switchToSepolia}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Switch to Sepolia
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-green-900">Wallet Connected</h4>
          <p className="text-sm text-green-700 mt-1 font-mono break-all">
            {address}
          </p>
        </div>
      </div>
    </div>
  );
}
