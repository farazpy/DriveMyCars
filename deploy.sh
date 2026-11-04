#!/bin/bash

# Configuration from Environment Variables
HOST=${DEPLOY_HOST}
USER=${DEPLOY_USER}
TARGET_DIR=${DEPLOY_PATH}

if [ -z "$HOST" ] || [ -z "$USER" ] || [ -z "$TARGET_DIR" ]; then
  echo "Error: DEPLOY_HOST, DEPLOY_USER, and DEPLOY_PATH must be set in Secrets."
  exit 1
fi

echo "🚀 Starting Deployment to $HOST..."

# 1. Build the production frontend
echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Deployment aborted."
  exit 1
fi

# 2. Sync files to VPS
# We sync dist (frontend), server files, and package configs
# node_modules is excluded; you should run 'npm install' on the VPS once
echo "📤 Transferring files to $USER@$HOST..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env' \
  ./dist \
  ./server \
  ./package.json \
  ./package-lock.json \
  ./server.ts \
  $USER@$HOST:$TARGET_DIR

if [ $? -eq 0 ]; then
  echo "✅ Files transferred successfully!"
  echo "🔔 Reminder: On your VPS, go to $TARGET_DIR, run 'npm install', and restart your process (e.g., 'pm2 restart all')."
else
  echo "❌ Transfer failed. Check your SSH connection/permissions."
fi
