import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Webcam from 'react-webcam'
import { Button, Alert, Loading } from '../../components/common'
import { voteService } from '../../services/voteService'

export const FaceVerificationPage = () => {
  const navigate = useNavigate()
  const webcamRef = useRef(null)
  
  const [capturedImage, setCapturedImage] = useState(null)
  const [verificationResult, setVerificationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cameraActive, setCameraActive] = useState(true)
  const [step, setStep] = useState('capture') // capture, preview, verifying, result

  // Capture image from webcam
  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      setCapturedImage(imageSrc)
      setCameraActive(false)
      setStep('preview')
      setError('')
    }
  }

  // Retake photo
  const handleRetake = () => {
    setCapturedImage(null)
    setCameraActive(true)
    setStep('capture')
    setError('')
  }

  // Verify face
  const handleVerify = async () => {
    if (!capturedImage) {
      setError('Please capture an image first')
      return
    }

    try {
      setLoading(true)
      setError('')
      setStep('verifying')

      const response = await voteService.verifyFace(capturedImage)
      
      setVerificationResult({
        verified: response.data.verified,
        confidence: response.data.confidence,
        liveness: response.data.liveness,
        message: response.data.verified 
          ? 'Face verification successful! You can now proceed to vote.'
          : 'Face verification failed. Please try again.',
      })
      setStep('result')
    } catch (err) {
      setError(err.response?.data?.message || 'Face verification failed. Please try again.')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  // Proceed to voting
  const handleProceedToVote = () => {
    navigate('/vote')
  }

  // Retry verification
  const handleRetryVerification = () => {
    setVerificationResult(null)
    setCapturedImage(null)
    setCameraActive(true)
    setStep('capture')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Face Verification</h1>
          <p className="text-gray-600">
            {step === 'capture' && 'Position your face in the frame and capture a clear photo'}
            {step === 'preview' && 'Review your photo before verification'}
            {step === 'verifying' && 'Verifying your face...'}
            {step === 'result' && verificationResult?.verified ? 'Verification successful!' : 'Verification failed'}
          </p>
        </div>

        {/* Error Alert */}
        {error && <Alert type="error" message={error} className="mb-6" />}

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Capture Step */}
          {step === 'capture' && (
            <div className="p-8">
              <div className="mb-6">
                <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  {cameraActive ? (
                    <Webcam
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      className="w-full h-full object-cover"
                      videoConstraints={{
                        width: 1280,
                        height: 720,
                        facingMode: 'user',
                      }}
                    />
                  ) : (
                    <div className="text-white text-center">
                      <span className="text-4xl mb-2 block">📷</span>
                      <p>Camera loading...</p>
                    </div>
                  )}
                  
                  {/* Face Guide Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-64 border-2 border-green-400 rounded-2xl opacity-50" />
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Capture Tips</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>✓ Ensure good lighting on your face</li>
                      <li>✓ Face the camera directly</li>
                      <li>✓ Remove sunglasses or hats</li>
                      <li>✓ Keep a neutral expression</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Capture Button */}
              <Button
                onClick={handleCapture}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-lg transition-all"
              >
                📸 Capture Photo
              </Button>
            </div>
          )}

          {/* Preview Step */}
          {step === 'preview' && capturedImage && (
            <div className="p-8">
              <div className="mb-6">
                <img
                  src={capturedImage}
                  alt="Captured face"
                  className="w-full rounded-xl shadow-md"
                />
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>✅ Verify Face</>
                  )}
                </Button>

                <Button
                  onClick={handleRetake}
                  disabled={loading}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 rounded-lg transition-all disabled:opacity-50"
                >
                  🔄 Retake Photo
                </Button>
              </div>
            </div>
          )}

          {/* Verifying Step */}
          {step === 'verifying' && (
            <div className="p-8 text-center">
              <div className="mb-6">
                <div className="inline-block">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Face</h2>
              <p className="text-gray-600">Please wait while we verify your identity...</p>
            </div>
          )}

          {/* Result Step */}
          {step === 'result' && verificationResult && (
            <div className="p-8">
              {verificationResult.verified ? (
                <>
                  {/* Success */}
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4 animate-bounce">✅</div>
                    <h2 className="text-3xl font-bold text-green-600 mb-2">Verification Successful!</h2>
                    <p className="text-gray-600 mb-4">{verificationResult.message}</p>
                  </div>

                  {/* Confidence Score */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Confidence Score</p>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold text-green-600">
                            {(verificationResult.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${verificationResult.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Liveness Detection</p>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">
                            {verificationResult.liveness ? '✓' : '✗'}
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {verificationResult.liveness ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proceed Button */}
                  <Button
                    onClick={handleProceedToVote}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-lg transition-all"
                  >
                    🗳️ Proceed to Voting
                  </Button>
                </>
              ) : (
                <>
                  {/* Failed */}
                  <div className="text-center mb-8">
                    <div className="text-6xl mb-4">❌</div>
                    <h2 className="text-3xl font-bold text-danger mb-2">Verification Failed</h2>
                    <p className="text-gray-600 mb-4">{verificationResult.message}</p>
                  </div>

                  {/* Failure Details */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Confidence Score</p>
                        <div className="flex items-end gap-2">
                          <span className="text-3xl font-bold text-danger">
                            {(verificationResult.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div
                            className="bg-danger h-2 rounded-full transition-all"
                            style={{ width: `${verificationResult.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Liveness Detection</p>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">
                            {verificationResult.liveness ? '✓' : '✗'}
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {verificationResult.liveness ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-yellow-900 mb-2">Troubleshooting Tips</h3>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Ensure adequate lighting on your face</li>
                      <li>• Remove glasses or sunglasses</li>
                      <li>• Face the camera directly</li>
                      <li>• Avoid shadows on your face</li>
                      <li>• Keep a neutral expression</li>
                    </ul>
                  </div>

                  {/* Retry Button */}
                  <Button
                    onClick={handleRetryVerification}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 rounded-lg transition-all"
                  >
                    🔄 Try Again
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <span className="text-xl">🔐</span>
            <div>
              <p className="text-sm text-blue-900">
                <strong>Your privacy is protected:</strong> Your face image is processed securely and only used for verification. It is not stored or shared.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
