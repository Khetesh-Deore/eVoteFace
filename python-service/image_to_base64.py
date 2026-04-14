import base64
from pathlib import Path

def image_to_base64(image_path):
    """Convert image file to base64 string"""
    with open(image_path, 'rb') as image_file:
        encoded = base64.b64encode(image_file.read()).decode('utf-8')
        return f"data:image/jpeg;base64,{encoded}"

if __name__ == "__main__":
    # Usage: python image_to_base64.py
    # Place your test image in python-service folder
    
    image_path = input("Enter image path: ")
    if Path(image_path).exists():
        base64_string = image_to_base64(image_path)
        print("\nBase64 string (first 100 chars):")
        print(base64_string[:100] + "...")
        print(f"\nFull length: {len(base64_string)} characters")
        
        # Save to file for easy copying
        with open("base64_output.txt", "w") as f:
            f.write(base64_string)
        print("\nFull base64 saved to: base64_output.txt")
    else:
        print("Image file not found!")
