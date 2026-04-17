import { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw } from 'lucide-react';

interface WebcamCaptureProps {
  onCapture: (imageBase64: string) => void;
  loading?: boolean;
}

export default function WebcamCapture({ onCapture, loading = false }: WebcamCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  const capture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setImgSrc(imageSrc);
      }
    }
  };

  const retake = () => {
    setImgSrc(null);
  };

  const handleContinue = () => {
    if (imgSrc) {
      onCapture(imgSrc);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        {!imgSrc ? (
          <>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
            />
            {/* Oval face guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-64 border-4 border-white/30 rounded-full" />
            </div>
          </>
        ) : (
          <img src={imgSrc} alt="Captured" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Camera className="w-4 h-4" />
        <span>💡 Face the camera directly · Ensure good lighting · Remove glasses if possible</span>
      </div>

      <div className="flex gap-3">
        {!imgSrc ? (
          <button
            onClick={capture}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
          >
            <Camera className="w-5 h-5" />
            Capture Photo
          </button>
        ) : (
          <>
            <button
              onClick={retake}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Retake Photo
            </button>
            <button
              onClick={handleContinue}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Face & Continue'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
