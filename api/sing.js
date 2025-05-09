const express = require('express');
const ytSearch = require('yt-search');
const { default: YTDlpWrap } = require('yt-dlp-wrap');
const router = express.Router();

// yt-dlp instance
const ytDlpWrap = new YTDlpWrap('yt-dlp');

async function fetchFastVideoInfo(videoUrl, res) {
  try {
    console.time('VideoInfoFetch');

    const output = await ytDlpWrap.execPromise([
      videoUrl,
      '--skip-download',
      '--dump-single-json',
      '--no-playlist',
      '--no-check-certificates',
      '--force-ipv4',
      '--format', 'bestaudio[ext=m4a]',
      '--geo-bypass',
      '--geo-bypass-country=BD',
      '--no-warnings',
      '--ignore-errors',
      '--quiet',
      '--cookies', 'cookies.txt'
    ]);

    console.timeEnd('VideoInfoFetch');
    const videoInfo = JSON.parse(output);

    const audioUrl = videoInfo.url || (videoInfo.formats?.find(f => f.ext === 'm4a')?.url);

    if (!audioUrl) throw new Error('No audio URL found');

    res.json({
      title: videoInfo.title,
      duration: videoInfo.duration,
      thumbnail: videoInfo.thumbnail,
      audio: audioUrl
    });

  } catch (err) {
    console.error('Fast fetch error:', err.message);
    res.status(500).json({ error: 'Failed to fetch video', message: err.message });
  }
}

router.get('/', async (req, res) => {
  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt parameter is required' });
  }

  try {
    const results = await ytSearch(prompt);

    if (!results?.videos?.length) {
      return res.status(404).json({ error: 'No videos found' });
    }

    const video = results.videos[0];
    const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

    await fetchFastVideoInfo(videoUrl, res);

  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed', message: err.message });
  }
});

module.exports = router;
