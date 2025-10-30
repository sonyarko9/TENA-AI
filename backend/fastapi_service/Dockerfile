FROM python:3.11-slim

WORKDIR /app

# Install minimal build deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install fastapi + uvicorn + openai
RUN pip install --no-cache-dir fastapi uvicorn[standard] openai python-dotenv

# Copy service
COPY . /app

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
