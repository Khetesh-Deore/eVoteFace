import face_recognition
import numpy as np
import os


def encode_face_from_image(image_rgb):
    face_locations = face_recognition.face_locations(image_rgb, model="hog")

    if len(face_locations) == 0:
        return None, (
            "No face detected in the image. "
            "Please use a clear, well-lit frontal photo of the voter's face. "
            "Ensure the face is not obscured by glasses, mask, or shadow."
        )

    if len(face_locations) > 1:
        return None, (
            f"Multiple faces detected ({len(face_locations)} faces found). "
            "Please use a photo with only one person visible."
        )

    face_encodings = face_recognition.face_encodings(
        image_rgb,
        known_face_locations=face_locations,
        num_jitters=1
    )

    if len(face_encodings) == 0:
        return None, (
            "Face detected but encoding failed. "
            "Please use a higher-resolution photo with clear facial features."
        )

    return face_encodings[0].tolist(), None


def verify_face_against_encoding(live_image_rgb, stored_encoding_list):
    try:
        stored_encoding = np.array(stored_encoding_list, dtype=np.float64)
    except (ValueError, TypeError) as e:
        return None, f"Invalid stored encoding format: {str(e)}"

    if stored_encoding.shape != (128,):
        return None, (
            f"Stored encoding has invalid shape {stored_encoding.shape}. "
            "Expected (128,). Please re-register the voter's face."
        )

    face_locations = face_recognition.face_locations(live_image_rgb, model="hog")

    if len(face_locations) == 0:
        return {
            "match": False,
            "distance": None,
            "confidence": 0.0,
            "message": (
                "No face detected in the camera image. "
                "Please position your face clearly in front of the camera, "
                "ensure good lighting, and try again."
            )
        }, None

    if len(face_locations) > 1:
        def face_area(loc):
            top, right, bottom, left = loc
            return (bottom - top) * (right - left)
        face_locations = [max(face_locations, key=face_area)]

    live_encodings = face_recognition.face_encodings(
        live_image_rgb,
        known_face_locations=face_locations,
        num_jitters=1
    )

    if len(live_encodings) == 0:
        return {
            "match": False,
            "distance": None,
            "confidence": 0.0,
            "message": "Face detected but could not compute encoding. Please try again with better lighting."
        }, None

    live_encoding = live_encodings[0]
    distance_array = face_recognition.face_distance([stored_encoding], live_encoding)
    distance = float(distance_array[0])

    tolerance = float(os.environ.get("FACE_MATCH_TOLERANCE", "0.6"))
    is_match = bool(distance <= tolerance)

    if distance <= tolerance:
        confidence = round(1.0 - (distance / tolerance), 4)
    else:
        confidence = 0.0

    message = (
        f"Face verified successfully. Confidence: {round(confidence * 100, 1)}%"
        if is_match else
        "Face does not match the registered voter. "
        "Please ensure you are using the correct voter account "
        "and that your face is clearly visible."
    )

    return {
        "match": is_match,
        "distance": round(distance, 6),
        "confidence": confidence,
        "message": message
    }, None


def validate_encoding(encoding_list):
    if not isinstance(encoding_list, list):
        return False
    if len(encoding_list) != 128:
        return False
    if not all(isinstance(x, (int, float)) for x in encoding_list):
        return False
    return True
