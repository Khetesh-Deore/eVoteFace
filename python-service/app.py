import os
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from image_utils import load_image_from_file, load_image_from_base64, validate_image_format
from face_utils import encode_face_from_image, verify_face_against_encoding, validate_encoding

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "eVoteFace Face Recognition API",
        "version": "1.0.0",
        "endpoints": ["/health", "/encode", "/verify"],
        "tolerance": float(os.environ.get("FACE_MATCH_TOLERANCE", 0.6))
    }), 200


@app.route("/encode", methods=["POST"])
def encode_face():
    try:
        if "image" not in request.files:
            return jsonify({
                "success": False,
                "message": "No image file provided. Send the image as 'image' field in multipart/form-data."
            }), 400

        image_file = request.files["image"]

        if image_file.filename == "":
            return jsonify({"success": False, "message": "No file selected."}), 400

        if not validate_image_format(image_file.filename):
            return jsonify({
                "success": False,
                "message": "Invalid file format. Please upload a JPEG, PNG, or WebP image."
            }), 400

        image_rgb, load_error = load_image_from_file(image_file)
        if image_rgb is None:
            return jsonify({"success": False, "message": load_error or "Failed to load image."}), 400

        encoding, encode_error = encode_face_from_image(image_rgb)
        if encoding is None:
            return jsonify({"success": False, "message": encode_error}), 400

        return jsonify({
            "success": True,
            "encoding": encoding,
            "encoding_length": len(encoding),
            "message": "Face encoded successfully. Store this encoding in the voter's database record."
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Internal server error during face encoding.",
            "error": str(e) if os.environ.get("DEBUG") == "True" else "See server logs."
        }), 500


@app.route("/verify", methods=["POST"])
def verify_face():
    try:
        data = request.get_json(force=True, silent=True)

        if data is None:
            return jsonify({
                "success": False,
                "message": "Request body must be JSON with Content-Type: application/json"
            }), 400

        if "liveImage" not in data:
            return jsonify({"success": False, "message": "Missing required field: 'liveImage'"}), 400

        if "storedEncoding" not in data:
            return jsonify({"success": False, "message": "Missing required field: 'storedEncoding'"}), 400

        stored_encoding = data["storedEncoding"]
        if not validate_encoding(stored_encoding):
            return jsonify({
                "success": False,
                "message": "Invalid storedEncoding. Expected an array of exactly 128 numbers."
            }), 400

        live_image_base64 = data["liveImage"]
        if not isinstance(live_image_base64, str) or len(live_image_base64) < 100:
            return jsonify({
                "success": False,
                "message": "Invalid liveImage. Expected a non-empty base64-encoded image string."
            }), 400

        live_image_rgb, load_error = load_image_from_base64(live_image_base64)
        if live_image_rgb is None:
            return jsonify({"success": False, "message": load_error or "Failed to decode live image."}), 400

        result, verify_error = verify_face_against_encoding(live_image_rgb, stored_encoding)
        if result is None:
            return jsonify({"success": False, "message": verify_error or "Face verification failed."}), 500

        return jsonify({
            "success": True,
            "match": result["match"],
            "distance": result["distance"],
            "confidence": result["confidence"],
            "message": result["message"]
        }), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": "Internal server error during face verification.",
            "error": str(e) if os.environ.get("DEBUG") == "True" else "See server logs."
        }), 500


@app.errorhandler(404)
def not_found(e):
    return jsonify({
        "success": False,
        "message": "Endpoint not found. Available: GET /health, POST /encode, POST /verify"
    }), 404


@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"success": False, "message": "Method not allowed."}), 405


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    debug = os.environ.get("DEBUG", "False").lower() == "true"
    print("─────────────────────────────────────")
    print("eVoteFace Face Recognition API")
    print(f"Running on http://localhost:{port}")
    print(f"Face match tolerance: {os.environ.get('FACE_MATCH_TOLERANCE', 0.6)}")
    print("─────────────────────────────────────")
    app.run(host="0.0.0.0", port=port, debug=debug)
