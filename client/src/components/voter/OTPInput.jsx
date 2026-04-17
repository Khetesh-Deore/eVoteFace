import { useState, useRef } from "react";

export default function OTPInput({ onComplete, loading = false }) {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputs = useRef([]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);

    // Auto-focus next input
    if (val && i < 5) {
      inputs.current[i + 1]?.focus();
    }

    // Auto-submit when complete
    if (next.every(d => d !== "") && next.join("").length === 6) {
      onComplete(next.join(""));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowRight" && i < 5) {
      inputs.current[i + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtp(newOtp);
      onComplete(pasted);
    }
  };

  return (
    <div className="flex gap-4 justify-center" onPaste={handlePaste}>
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={loading}
          className={`w-14 h-16 text-center text-3xl font-semibold border-2 rounded-2xl transition-all focus:outline-none
            ${loading 
              ? "bg-slate-100 border-slate-200 text-slate-400" 
              : "border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white"
            }`}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}