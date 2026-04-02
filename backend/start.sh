#!/usr/bin/env bash

echo "Running database migrations..."
# This command relies on the DATABASE_URL environment variable being set by Render
flask db upgrade

echo "Starting Gunicorn server..."
# Use threaded workers so async chat requests can stay in flight concurrently
exec gunicorn --bind 0.0.0.0:5000 --worker-class gthread -w 2 --threads 4 run:app