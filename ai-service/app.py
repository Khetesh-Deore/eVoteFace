from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'AI Service running'})

@app.route('/encode', methods=['POST'])
def encode():
    # Face encoding endpoint
    return jsonify({'message': 'Encode endpoint'})

@app.route('/verify', methods=['POST'])
def verify():
    # Face verification endpoint
    return jsonify({'message': 'Verify endpoint'})

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    app.run(debug=True, port=port)
