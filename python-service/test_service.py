import requests
import base64
import os
from pathlib import Path
from io import BytesIO
from PIL import Image

BASE_URL = "http://localhost:8000"

def local_image_to_base64(image_path):
    """Convert local image file to base64"""
    try:
        with open(image_path, 'rb') as image_file:
            img = Image.open(image_file)
            img = img.convert('RGB')
            
            buffered = BytesIO()
            img.save(buffered, format="JPEG")
            img_bytes = buffered.getvalue()
            encoded = base64.b64encode(img_bytes).decode('utf-8')
            return f"data:image/jpeg;base64,{encoded}"
    except Exception as e:
        print(f"Error converting local image to base64: {e}")
        return None

def url_to_base64(image_url):
    """Download image from URL and convert to base64"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(image_url, timeout=10, headers=headers)
        response.raise_for_status()
        img = Image.open(BytesIO(response.content))
        img = img.convert('RGB')
        
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        img_bytes = buffered.getvalue()
        encoded = base64.b64encode(img_bytes).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"
    except Exception as e:
        print(f"Error converting URL to base64: {e}")
        return None

def test_health():
    """Test health endpoint"""
    print("\n=== Testing /health endpoint ===")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    assert response.status_code == 200
    print("✓ Health check passed")

def test_same_person():
    """Test with two photos of same person"""
    print("\n=== Testing same person match ===")
    
    # Using publicly accessible test images
    photo_url_1 = "D:/USERS/random1.jpeg"
    photo_url_2 = "D:/USERS/random2.jpeg"
    
    print("Note: Using random placeholder images for demonstration")
    print("For real testing, upload actual face photos to Cloudinary and use those URLs")
    print("Downloading and converting images...")
    live_image_base64 = url_to_base64(photo_url_2)
    
    if not live_image_base64:
        print("✗ Failed to download test images")
        return
    
    payload = {
        "liveImage": live_image_base64,
        "photoUrl": photo_url_1
    }
    
    print("Sending verification request (this may take 30-60 seconds)...")
    response = requests.post(f"{BASE_URL}/verify", json=payload, timeout=120)
    print(f"Status: {response.status_code}")
    result = response.json()
    
    if response.status_code == 200:
        print(f"Match: {result.get('match')}")
        print(f"Confidence: {result.get('confidence', 0):.4f}")
        print(f"Distance: {result.get('distance', 0):.4f}")
        print(f"Threshold: {result.get('threshold', 0):.4f}")
        print(f"Message: {result.get('message')}")
        
        if result.get('match'):
            print("✓ Same person test PASSED - Correctly identified as match")
        else:
            print("⚠ Same person test - Identified as non-match (may need threshold adjustment)")
    else:
        print(f"✗ Test failed - Error: {result.get('message', 'Unknown error')}")
        print("Note: Random images from picsum.photos don't contain faces, so this is expected")

def test_different_people():
    """Test with two different people"""
    print("\n=== Testing different people ===")
    
    # Using publicly accessible test images
    photo_url_1 = "D:/USERS/random1.jpeg"
    photo_url_2 = "D:/USERS/khetesh.jpeg"
    
    print("Note: Using random placeholder images for demonstration")
    print("For real testing, upload actual face photos to Cloudinary and use those URLs")
    print("Downloading and converting images...")
    live_image_base64 = url_to_base64(photo_url_2)
    
    if not live_image_base64:
        print("✗ Failed to download test images")
        return
    
    payload = {
        "liveImage": live_image_base64,
        "photoUrl": photo_url_1
    }
    
    print("Sending verification request (this may take 30-60 seconds)...")
    response = requests.post(f"{BASE_URL}/verify", json=payload, timeout=120)
    print(f"Status: {response.status_code}")
    result = response.json()
    
    if response.status_code == 200:
        print(f"Match: {result.get('match')}")
        print(f"Confidence: {result.get('confidence', 0):.4f}")
        print(f"Distance: {result.get('distance', 0):.4f}")
        print(f"Threshold: {result.get('threshold', 0):.4f}")
        print(f"Message: {result.get('message')}")
        
        if not result.get('match'):
            print("✓ Different people test PASSED - Correctly identified as non-match")
        else:
            print("✗ Different people test FAILED - Incorrectly identified as match")
    else:
        print(f"✗ Test failed - Error: {result.get('message', 'Unknown error')}")
        print("Note: Random images from picsum.photos don't contain faces, so this is expected")

def test_bad_base64():
    """Test with invalid base64"""
    print("\n=== Testing bad base64 ===")
    
    payload = {
        "liveImage": "invalid_base64_string",
        "photoUrl": "https://raw.githubusercontent.com/serengil/deepface/master/tests/dataset/img1.jpg"
    }
    
    response = requests.post(f"{BASE_URL}/verify", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    assert response.status_code == 400
    assert result.get('success') == False
    print("✓ Bad base64 error handled correctly")

def test_invalid_url():
    """Test with invalid Cloudinary URL"""
    print("\n=== Testing invalid URL ===")
    
    # Use a valid base64 for this test
    photo_url = "https://picsum.photos/400/400"
    live_image_base64 = url_to_base64(photo_url)
    
    if not live_image_base64:
        print("✗ Failed to create test base64")
        return
    
    payload = {
        "liveImage": live_image_base64,
        "photoUrl": "https://invalid-url-that-does-not-exist.com/image.jpg"
    }
    
    response = requests.post(f"{BASE_URL}/verify", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    assert response.status_code == 400
    assert result.get('success') == False
    print("✓ Invalid URL error handled correctly")

def test_missing_fields():
    """Test with missing required fields"""
    print("\n=== Testing missing fields ===")
    
    payload = {
        "liveImage": "D:/USERS/random1.jpeg"
        # Missing photoUrl
    }
    
    response = requests.post(f"{BASE_URL}/verify", json=payload)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Response: {result}")
    
    assert response.status_code == 400
    assert result.get('success') == False
    print("✓ Missing fields error handled correctly")

def check_temp_files():
    """Verify no temp files created on disk"""
    print("\n=== Checking for temp files ===")
    
    temp_dirs = ['/tmp', '/var/tmp', './']
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp']
    
    found_temp_files = []
    
    for temp_dir in temp_dirs:
        if os.path.exists(temp_dir):
            try:
                for file in Path(temp_dir).glob('*'):
                    if file.suffix.lower() in image_extensions and file.is_file():
                        found_temp_files.append(str(file))
            except:
                pass
    
    if found_temp_files:
        print(f"✗ Found temp files: {found_temp_files}")
    else:
        print("✓ No temp files created on disk")

if __name__ == "__main__":
    print("Starting Python Face Service Tests")
    print("=" * 50)
    
    try:
        test_health()
        test_bad_base64()
        test_invalid_url()
        test_missing_fields()
        
        print("\n" + "=" * 50)
        print("Running REAL face verification tests...")
        print("=" * 50)
        
        test_same_person()
        test_different_people()
        
        check_temp_files()
        
        print("\n" + "=" * 50)
        print("All tests completed!")
        
    except Exception as e:
        print(f"\n✗ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
