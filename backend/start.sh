#!/usr/bin/env bash

echo "Running database migrations..."
# This command relies on the DATABASE_URL environment variable being set by Render
flask db upgrade

echo "Starting Gunicorn server..."
# Using the command from your original Dockerfile
exec gunicorn -w 4 -b 0.0.0.0:5000 run:app