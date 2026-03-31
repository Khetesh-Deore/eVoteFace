FROM animcogn/face_recognition:cpu

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY face_utils.py .
COPY image_utils.py .

ENV FACE_MATCH_TOLERANCE=0.6
ENV MAX_IMAGE_WIDTH=800
ENV MAX_IMAGE_HEIGHT=800
ENV MAX_FILE_SIZE_MB=5
ENV PORT=8000
ENV DEBUG=False

EXPOSE 8000

CMD gunicorn --workers 1 --timeout 120 --bind 0.0.0.0:$PORT app:app
