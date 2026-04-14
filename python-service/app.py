from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import numpy as np
import base64
import requests
from io import BytesIO
from PIL import Image
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

DEEPFACE_MODEL = os.getenv('DEEPFACE_MODEL', 'ArcFace')
DEEPFACE_DETECTOR = os.getenv('DEEPFACE_DETECTOR', 'retinaface')
FACE_MATCH_THRESHOLD = float(os.getenv('FACE_MATCH_THRESHOLD', '0.68'))

def base64_to_numpy(base64_string):
    """Convert base64 string to numpy array"""
    try:
        img_data = base64.b64decode(base64_string.split(',')[-1])
        img = Image.open(BytesIO(img_data))
        img = img.convert('RGB')
        return np.array(img)
    except Exception as e:
        raise ValueError(f"Invalid base64 image: {str(e)}")

def url_to_numpy(image_url):
    """Download image from URL and convert to numpy array"""
    try:
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        img = Image.open(BytesIO(response.content))
        img = img.convert('RGB')
        return np.array(img)
    except Exception as e:
        raise ValueError(f"Failed to download image from URL: {str(e)}")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "face-verification"}), 200

@app.route('/verify', methods=['POST'])
def verify():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "message": "No JSON data provided"
            }), 400
        
        live_image_base64 = data.get('liveImage')
        photo_url = data.get('photoUrl')
        
        if not live_image_base64 or not photo_url:
            return jsonify({
                "success": False,
                "message": "Both liveImage and photoUrl are required"
            }), 400
        
        # Convert images to numpy arrays (in memory only)
        live_img_array = base64_to_numpy(live_image_base64)
        registered_img_array = url_to_numpy(photo_url)
        
        # Perform face verification using DeepFace
        result = DeepFace.verify(
            img1_path=live_img_array,
            img2_path=registered_img_array,
            model_name=DEEPFACE_MODEL,
            detector_backend=DEEPFACE_DETECTOR,
            enforce_detection=True
        )
        
        # Extract results
        is_match = result['verified']
        distance = result['distance']
        threshold = result['threshold']
        
        # Calculate confidence (inverse of normalized distance)
        confidence = max(0, min(1, 1 - (distance / threshold)))
        
        return jsonify({
            "success": True,
            "match": is_match,
            "distance": float(distance),
            "threshold": float(threshold),
            "confidence": float(confidence),
            "message": "Face verified successfully" if is_match else "Face does not match registered voter"
        }), 200
        
    except ValueError as ve:
        return jsonify({
            "success": False,
            "message": str(ve)
        }), 400
        
    except Exception as e:
        error_message = str(e)
        
        # Handle specific DeepFace errors
        if "Face could not be detected" in error_message:
            return jsonify({
                "success": False,
                "match": False,
                "message": "No face detected in one or both images. Please ensure your face is clearly visible."
            }), 200
        
        return jsonify({
            "success": False,
            "message": f"Face verification failed: {error_message}"
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
