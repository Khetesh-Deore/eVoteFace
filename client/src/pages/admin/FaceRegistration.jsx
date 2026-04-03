import { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { toast } from "react-toastify";
import api from "../../utils/api";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function FaceRegistration() {
  const [voters, setVoters] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [mode, setMode] = useState("file"); // "file" | "webcam"
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    api.get("/admin/voters?limit=100").then(r => setVoters(r.data.voters)).catch(() => {});
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setCapturedImage(null);
  };

  const capture = useCallback(() => {
    const img = webcamRef.current?.getScreenshot();
    if (img) { setCapturedImage(img); setPreview(img); }
  }, [webcamRef]);

  const upload = async () => {
    if (!selectedId) { toast.error("Please select a voter"); return; }

    setUploading(true);
    try {
      const formData = new FormData();

      if (mode === "webcam" && capturedImage) {
        // Convert base64 to blob
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        formData.append("image", blob, "face.jpg");
      } else {
        const fileInput = document.getElementById("faceFile");
        if (!fileInput?.files[0]) { toast.error("Please select an image"); setUploading(false); return; }
        formData.append("image", fileInput.files[0]);
      }

      await api.post(`/admin/voters/${selectedId}/face`, formData, {
        // Don't set Content-Type manually — axios sets it with correct boundary for multipart
      });
      toast.success("Face registered successfully!");
      setPreview(null); setCapturedImage(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Face registration failed");
    } finally { setUploading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-6">Face Registration</h1>

      <div className="card space-y-5">
        {/* Voter select */}
        <div>
          <label className="label">Select Voter *</label>
          <select className="input" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            <option value="">-- Choose a voter --</option>
            {voters.map(v => (
              <option key={v._id} value={v._id}>
                {v.fullName} ({v.voterID}) {v.faceImagePath ? "✓ Face registered" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button onClick={() => setMode("file")}
            className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${mode === "file" ? "bg-primary text-white border-primary" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
            📁 Upload File
          </button>
          <button onClick={() => setMode("webcam")}
            className={`px-4 py-2 rounded text-sm font-medium border transition-colors ${mode === "webcam" ? "bg-primary text-white border-primary" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
            📷 Use Webcam
          </button>
        </div>

        {/* File upload */}
        {mode === "file" && (
          <div>
            <label className="label">Face Photo (JPEG/PNG)</label>
            <input id="faceFile" type="file" accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange} className="input" />
            <p className="text-xs text-gray-500 mt-1">Use a clear, well-lit frontal photo. One face only.</p>
          </div>
        )}

        {/* Webcam */}
        {mode === "webcam" && (
          <div className="space-y-3">
            <Webcam ref={webcamRef} screenshotFormat="image/jpeg"
              className="w-full rounded border border-gray-300" videoConstraints={{ facingMode: "user" }} />
            <button onClick={capture} className="btn-outline w-full">📸 Capture Photo</button>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div>
            <p className="label">Preview</p>
            <img src={preview} alt="Face preview" className="w-40 h-40 object-cover rounded border border-gray-300" />
          </div>
        )}

        <button onClick={upload} disabled={uploading || !selectedId}
          className="btn-primary w-full">
          {uploading ? "Encoding face... (may take 10s)" : "Register Face"}
        </button>
      </div>
    </div>
  );
}
