import base64
import sys

if len(sys.argv) < 2:
    print("Usage: python to_base64.py <image_path>")
    sys.exit(1)

path = sys.argv[1]

with open(path, "rb") as f:
    data = base64.b64encode(f.read()).decode("utf-8")
    print(f"data:image/jpeg;base64,{data}")
