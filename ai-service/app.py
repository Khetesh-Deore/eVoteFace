from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import base64
import numpy as np
import cv2
from deepface import DeepFace
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', 0.60))

def base64_to_image(base64_string):
    """Convert base64 string to OpenCV image"""
    try:
        img_data = base64.b64decode(base64_string.split(',')[1])
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        return None

def get_face_embedding(image):
    """Extract face embedding using DeepFace"""
    try:
        embedding = DeepFace.represent(image, model_name='Facenet', enforce_detection=True)
        return embedding[0]['embedding']
    except Exception as e:
        return None

def cosine_distance(a, b):
    """Calculate cosine distance between two vectors"""
    a = np.array(a)
    b = np.array(b)
    return 1 - (np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'AI Service running'})

@app.route('/encode', methods=['POST'])
def encode():
    """Extract face encoding from image"""
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided'}), 400

        img = base64_to_image(data['image'])
        if img is None:
            return jsonify({'error': 'Invalid image format'}), 400

        embedding = get_face_embedding(img)
        if embedding is None:
            return jsonify({'error': 'No face detected'}), 400

        return jsonify({
            'success': True,
            'encoding': embedding,
            'message': 'Face encoded successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/verify', methods=['POST'])
def verify():
    """Verify face against stored encoding"""
    try:
        data = request.json
        if not data or 'image' not in data or 'stored_encoding' not in data:
            return jsonify({'error': 'Image and stored encoding required'}), 400

        img = base64_to_image(data['image'])
        if img is None:
            return jsonify({'error': 'Invalid image format'}), 400

        live_embedding = get_face_embedding(img)
        if live_embedding is None:
            return jsonify({'error': 'No face detected'}), 400

        stored_encoding = data['stored_encoding']
        distance = cosine_distance(live_embedding, stored_encoding)
        confidence = 1 - distance
        verified = distance < CONFIDENCE_THRESHOLD

        return jsonify({
            'verified': verified,
            'confidence': float(confidence),
            'distance': float(distance),
            'threshold': CONFIDENCE_THRESHOLD,
            'message': 'Face verification complete'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    app.run(debug=True, port=port)
