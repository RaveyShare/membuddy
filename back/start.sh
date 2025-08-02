#!/bin/bash

# Install dependencies
pip install -r requirements.txt

# Start the application in background with log output
nohup uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000} > back.log 2>&1 &

echo "Backend started in background, PID: $!"
echo "Logs are being written to back.log"
echo "To view logs: tail -f back.log"
echo "To stop the service: kill $!"