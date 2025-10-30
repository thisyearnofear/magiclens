# Backend API container with ffmpeg and additional dependencies
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install runtime packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    ca-certificates \
    libpq5 \
    nginx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/services

# Copy source
COPY . /app/services

# Install Python dependencies declared in pyproject.toml
RUN pip install --no-cache-dir .

# Ensure media directory exists
RUN mkdir -p /data/media
ENV LOCAL_MEDIA_DIR=/data/media

EXPOSE 8000

CMD ["uvicorn", "api.bootstrap:app", "--host", "0.0.0.0", "--port", "8000"]