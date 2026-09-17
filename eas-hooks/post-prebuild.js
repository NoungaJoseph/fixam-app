#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Copy google-services.json from firebase folder to android/app if it exists
const firebaseGoogleServicesPath = path.join(__dirname, '..', 'firebase', 'google-services.json');
const androidGoogleServicesPath = path.join(__dirname, '..', 'android', 'app', 'google-services.json');

if (fs.existsSync(firebaseGoogleServicesPath)) {
  try {
    fs.copyFileSync(firebaseGoogleServicesPath, androidGoogleServicesPath);
    console.log('✓ Copied google-services.json to android/app');
  } catch (error) {
    console.error('✗ Failed to copy google-services.json:', error.message);
    process.exit(1);
  }
} else {
  console.warn('⚠ google-services.json not found in firebase folder');
}
