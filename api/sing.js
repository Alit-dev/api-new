const express = require('express');
const ytSearch = require('yt-search');
const { default: YTDlpWrap } = require('yt-dlp-wrap');
const router = express.Router();

// Cache yt-dlp instance globally
const ytDlpWrap = new YTDlpWrap('yt-dlp');

async function fetchFastVideoInfo(url, res) {
  try {
    console.time('VideoInfoFetch');
    
    // Use minimal command to fetch only the essential data (audio URL)
    const output = await ytDlpWrap.execPromise([
      url,
      '--skip-download',
      '--dump-single-json',
      '--no-playlist',
      '--no-check-certificates',
      '--force-ipv4',
      '--format', 'bestaudio[ext=m4a]/best[ext=mp4]', // Only fetch audio or best format
      '--no-warnings',
      '--ignore-errors',
      '--quiet'
    ]);

    console.timeEnd('VideoInfoFetch');
    const videoInfo = JSON.parse(output);

    // Extract only the essential data we need
    const result = {
      title: videoInfo.title,
      duration: videoInfo.duration,
      thumbnail: videoInfo.thumbnail,
      url: videoInfo.url || (videoInfo.formats && videoInfo.formats[0]?.url)
    };

    if (!result.url) {
      throw new Error('No download URL found');
    }

    res.json(result);

  } catch (error) {
    console.error('Fast fetch error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch video',
      message: error.message
    });
  }
}

router.get('/', async (req, res) => {
  const { prompt } = req.query;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt parameter is required' });
  }

  try {
    console.log('Search started for prompt:', prompt);
    console.time('SearchTime');
    
    // Search YouTube for the given prompt and limit to the first result
    const results = await ytSearch(prompt);

    console.timeEnd('SearchTime');
    console.log('Search completed successfully.');

    if (!results || results.videos.length === 0) {
      return res.status(404).json({ error: 'No videos found' });
    }

    const video = results.videos[0];  // Get the first video result
    console.log('Video found:', video.title);

    // Fetch the download link for the first video result
    await fetchFastVideoInfo(video.url, res);

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({
      error: 'Failed to search video',
      message: error.message
    });
  }
});

module.exports = router;
