import cv2
import numpy as np
import base64
import os
from PIL import Image
import io


def load_image_from_file(file_storage):
    try:
        file_bytes = file_storage.read()
        max_size_mb = float(os.environ.get("MAX_FILE_SIZE_MB", 5))
        if len(file_bytes) > max_size_mb * 1024 * 1024:
            return None, f"Image file exceeds maximum size of {max_size_mb}MB"
        np_array = np.frombuffer(file_bytes, np.uint8)
        image_bgr = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
        if image_bgr is None:
            return None, "Could not decode image. Please use JPEG or PNG format."
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        image_rgb = resize_image(image_rgb)
        image_rgb = preprocess_image(image_rgb)
        return image_rgb, None
    except Exception as e:
        return None, f"Failed to load image from file: {str(e)}"


def load_image_from_base64(base64_string):
    try:
        if "," in base64_string:
            base64_string = base64_string.split(",")[1]
        base64_string = base64_string.strip()
        missing_padding = len(base64_string) % 4
        if missing_padding:
            base64_string += "=" * (4 - missing_padding)
        image_bytes = base64.b64decode(base64_string)
        max_size_mb = float(os.environ.get("MAX_FILE_SIZE_MB", 5))
        if len(image_bytes) > max_size_mb * 1024 * 1024:
            return None, f"Image data exceeds maximum size of {max_size_mb}MB"
        np_array = np.frombuffer(image_bytes, np.uint8)
        image_bgr = cv2.imdecode(np_array, cv2.IMREAD_COLOR)
        if image_bgr is None:
            return None, "Could not decode base64 image. Ensure it is a valid JPEG or PNG."
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        image_rgb = resize_image(image_rgb)
        image_rgb = preprocess_image(image_rgb)
        return image_rgb, None
    except base64.binascii.Error as e:
        return None, f"Invalid base64 encoding: {str(e)}"
    except Exception as e:
        return None, f"Failed to load image from base64: {str(e)}"


def resize_image(image_rgb):
    max_w = int(os.environ.get("MAX_IMAGE_WIDTH", 800))
    max_h = int(os.environ.get("MAX_IMAGE_HEIGHT", 800))
    height, width = image_rgb.shape[:2]
    if width <= max_w and height <= max_h:
        return image_rgb
    scale = min(max_w / width, max_h / height)
    new_width = int(width * scale)
    new_height = int(height * scale)
    return cv2.resize(image_rgb, (new_width, new_height), interpolation=cv2.INTER_AREA)


def preprocess_image(image_rgb):
    try:
        image_lab = cv2.cvtColor(image_rgb, cv2.COLOR_RGB2LAB)
        l_channel, a_channel, b_channel = cv2.split(image_lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l_channel_equalized = clahe.apply(l_channel)
        image_lab_equalized = cv2.merge([l_channel_equalized, a_channel, b_channel])
        return cv2.cvtColor(image_lab_equalized, cv2.COLOR_LAB2RGB)
    except Exception:
        return image_rgb


def validate_image_format(filename):
    if not filename:
        return False
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    extension = os.path.splitext(filename.lower())[1]
    return extension in allowed_extensions
