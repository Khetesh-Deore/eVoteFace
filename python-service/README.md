# eVoteFace Python Face Verification Service

Flask microservice that compares two face images using DeepFace AI (ArcFace model).

---

## Requirements

- **Python 3.11 exactly** (3.12, 3.13, 3.14 will NOT work — TensorFlow has no support yet)
- Windows 64-bit

---

## First Time Setup

### Step 1 — Install Python 3.11

Download and install from:
```
https://www.python.org/ftp/python/3.11.9/python-3.11.9-amd64.exe
```

During install:
- Check **"Add python.exe to PATH"**
- Click **Install Now**

Verify it installed:
```powershell
py -0
# Should show: -V:3.11  Python 3.11 (64-bit)
```

---

### Step 2 — Create Virtual Environment

```powershell
cd python-service

# Delete old venv if it exists
Remove-Item -Recurse -Force venv

# Create new venv with Python 3.11
py -3.11 -m venv venv

# Activate it
.\venv\Scripts\Activate

# Verify Python version (must show 3.11.x)
python --version
```

---

### Step 3 — Install Dependencies

```powershell
pip install flask flask-cors deepface tensorflow-cpu tf-keras requests Pillow numpy python-dotenv
```

This will download ~500MB (TensorFlow + DeepFace models). Wait for it to complete.

---

### Step 4 — Configure .env

Create `python-service/.env` file:
```env
DEEPFACE_MODEL=ArcFace
DEEPFACE_DETECTOR=retinaface
FACE_MATCH_THRESHOLD=0.68
PORT=8000
```

---

### Step 5 — Run the Service

```powershell
.\venv\Scripts\Activate
python app.py
```

Should print:
```
* Running on http://0.0.0.0:8000
```

---

## Every Time You Start

```powershell
cd python-service
.\venv\Scripts\Activate
python app.py
```

---

## Verify It's Working

Open browser or run:
```
http://localhost:8000/health
```

Should return:
```json
{"status": "healthy", "service": "face-verification"}
```

---

## API Endpoint

### POST /verify

Compares a live webcam image with a registered face photo.

**Request:**
```json
{
  "liveImage": "data:image/jpeg;base64,/9j/4AAQ...",
  "photoUrl": "https://res.cloudinary.com/..."
}
```

**Response (match):**
```json
{
  "success": true,
  "match": true,
  "distance": 0.32,
  "confidence": 0.85,
  "message": "Face verified successfully"
}
```

**Response (no match):**
```json
{
  "success": true,
  "match": false,
  "distance": 0.74,
  "confidence": 0.12,
  "message": "Face does not match registered voter"
}
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `No module named flask` | venv not activated — run `.\venv\Scripts\Activate` first |
| `No matching distribution for tensorflow` | Wrong Python version — must use Python 3.11 |
| `blis==1.3.0` conflict error | Using wrong requirements.txt — run the pip install command directly |
| Service starts but face verify fails | First request downloads AI models (~500MB) — wait 2-3 minutes |
| `Face could not be detected` | Poor lighting or face not visible — ensure clear frontal photo |
| Port 8000 already in use | Another process using port — restart machine or change PORT in .env |

---

## How It Works

1. Receives `liveImage` (base64 from webcam) and `photoUrl` (Cloudinary URL)
2. Decodes both images into numpy arrays **in memory** (nothing saved to disk)
3. Calls `DeepFace.verify(img1, img2, model_name="ArcFace")`
4. DeepFace creates 128-dimensional face encodings for both images
5. Calculates cosine distance between encodings
6. If distance < 0.68 → match = true
7. Returns result with confidence score

**Note:** The first request after starting takes 30-60 seconds to download AI model weights from the internet. Subsequent requests are fast (2-5 seconds).

---

## Dependencies

| Package | Purpose |
|---------|---------|
| flask | Web server framework |
| flask-cors | Allow cross-origin requests from React |
| deepface | Face recognition AI library |
| tensorflow-cpu | AI backend for DeepFace |
| tf-keras | Keras compatibility layer |
| requests | Download images from Cloudinary URLs |
| Pillow | Image processing |
| numpy | Array operations for face encodings |
| python-dotenv | Load .env configuration |
