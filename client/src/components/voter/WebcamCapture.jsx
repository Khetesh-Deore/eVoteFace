import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

/**
 * Reusable webcam capture component.
 * Shows live feed, capture button, preview of captured image.
 * onCapture(base64string) called when photo is taken.
 */
export default function WebcamCapture({ onCapture, loading = false, disabled = false }) {
  const webcamRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [cameraError, setCameraError] = useState(false);

  const capture = useCallback(() => {
    const screenshot = webcamRef.current?.getScreenshot();
    if (screenshot) {
      // Compress image before sending to reduce payload size
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 480;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.6);
        setPreview(compressed);
        onCapture(compressed);
      };
      img.src = screenshot;
    }
  }, [webcamRef, onCapture]);

  const retake = () => {
    setPreview(null);
    onCapture(null);
  };

  if (cameraError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4 text-center text-sm text-red-700">
        <p className="font-medium mb-1">📷 Camera access denied</p>
        <p>Please allow camera access in your browser settings and refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700 flex gap-2">
        <span>💡</span>
        <span>Face the camera directly · Ensure good lighting · Remove glasses if possible</span>
      </div>

      {/* Camera or preview */}
      {!preview ? (
        <div className="relative">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.7}
            className="w-full rounded-lg border-2 border-gray-300"
            videoConstraints={{ facingMode: "user", width: 480, height: 360 }}
            onUserMediaError={() => setCameraError(true)}
          />
          {/* Face guide overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-40 h-48 border-2 border-dashed border-white opacity-60 rounded-full" />
          </div>
        </div>
      ) : (
        <div className="relative">
          <img src={preview} alt="Captured face" className="w-full rounded-lg border-2 border-primary" />
          <div className="absolute top-2 right-2">
            <span className="bg-primary text-white text-xs px-2 py-1 rounded">Captured</span>
          </div>
        </div>
      )}

      {/* Buttons */}
      {!preview ? (
        <button
          onClick={capture}
          disabled={loading || disabled}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? (
            <>
              <span className="animate-spin">⏳</span> Verifying face...
            </>
          ) : (
            <>📸 Capture & Verify</>
          )}
        </button>
      ) : (
        <button onClick={retake} disabled={loading}
          className="btn-outline w-full">
          🔄 Retake Photo
        </button>
      )}
    </div>
  );
}
