#!/bin/bash

# Install npm packages
echo "Installing npm packages..."
npm install @google/genai@^0.12.0 axios@^1.9.0 cobalt-api@^1.0.0 cors@^2.8.5 dotenv@^16.5.0 express@^5.1.0 fluent-ffmpeg@^2.1.3 fs@^0.0.1-security fuzzy@^0.1.3 google-tts-api@^2.0.2 instagram-user@^2.0.1 node-fetch@^3.3.2 openai@^4.97.0 path@^0.12.7 readline-sync@^1.4.10 replicate@^1.0.1 truecallerjs@^2.2.0 upscaler@^1.0.0-beta.19 youtubei.js@^13.4.0 yt-dlp-wrap@^2.3.12 yt-search@^2.13.1 ytdl-core@^4.11.5

# Install yt-dlp using pip
echo "Installing yt-dlp using pip..."
pip install yt-dlp

# Run rendering or other processes (example: starting a server or process)
echo "Starting rendering process..."
node server.js  # অথবা আপনার প্রযোজ্য স্ক্রিপ্টটি এখানে দিন
