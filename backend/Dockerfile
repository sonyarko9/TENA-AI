FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY . /app

ENV PYTHONUNBUFFERED=1

# Expose Flask default port
EXPOSE 5000

# Run with gunicorn for multiple workers in production/dev
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "run:app"]
