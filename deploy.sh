#!/bin/bash

# Load variables from local .env (requires bash or zsh)
set -a
source .env
set +a

ZIP_FILE="adysun_hrms_build.zip"

# ========== BUILD LOCALLY ==========
echo "Installing dependencies locally..."
npm install || { echo "npm install failed"; exit 1; }

echo "Building Next.js app locally..."
npm run build || { echo "npm run build failed"; exit 1; }

# Only include what's needed for production run!
echo "Packaging build output..."
zip -r $ZIP_FILE .next public package.json package-lock.json next.config.js tsconfig.json .env.production || { echo "zip failed"; exit 1; }

# ========== TRANSFER TO SERVER ==========
echo "Transferring built files to server..."
scp $ZIP_FILE $SERVER_USER@$SERVER_IP:$REMOTE_DIR/ || { echo "scp failed"; exit 1; }

# ========== DEPLOY ON SERVER ==========
echo "Unpacking and updating on server..."
ssh $SERVER_USER@$SERVER_IP bash <<EOF
  set -e
  cd $REMOTE_DIR
  unzip -o $ZIP_FILE
  rm -f $ZIP_FILE

  echo "Installing production dependencies..."
  npm install --production

  echo "Restarting $APP_NAME with pm2 (or starting if not present)..."
  pm2 restart $APP_NAME || pm2 start npm --name $APP_NAME -- run start

  pm2 save
  echo "Deployment successful!"
EOF

echo "Cleaning up local package..."
rm -f $ZIP_FILE

echo "*** Deployment Completed! ***"