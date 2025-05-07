const express = require('express');
const YTDlpWrap = require('yt-dlp-wrap').default;
const router = express.Router();

// Cache yt-dlp instance globally
const ytDlpWrap = new YTDlpWrap('yt-dlp');

async function fetchFastVideoInfo(url, res) {
  try {
    console.time('VideoInfoFetch');
    
    // Ultra-fast command with only essential data
    const output = await ytDlpWrap.execPromise([
      url,
      '--skip-download',
      '--dump-single-json',
      '--no-playlist',
      '--no-check-certificates',
      '--force-ipv4',
      '--format', 'best[ext=mp4]',
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
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  await fetchFastVideoInfo(url, res);
});

module.exports = router;