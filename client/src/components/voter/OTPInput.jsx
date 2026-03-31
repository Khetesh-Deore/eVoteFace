import { useState, useRef } from "react";

export default function OTPInput({ onComplete, loading }) {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const inputs = useRef([]);

  const handleChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
    if (next.every(d => d !== "") && next.join("").length === 6) {
      onComplete(next.join(""));
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      onComplete(pasted);
    }
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {otp.map((d, i) => (
        <input
          key={i}
          ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={d}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
          disabled={loading}
          className="w-11 h-12 text-center text-xl font-bold border-2 rounded focus:outline-none focus:border-primary disabled:opacity-50
            border-gray-300 focus:ring-0"
        />
      ))}
    </div>
  );
}
