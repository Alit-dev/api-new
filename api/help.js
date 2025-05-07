// api/help.js
const express = require('express');
const router = express.Router();

const routesInfo = [
  { method: 'GET', route: '/', usage: 'Check if server is running.' },
  { method: 'GET', route: '/sara/admin', usage: 'Loads admin panel (index.html).' },
  { method: 'GET', route: '/upload/:filename', usage: 'Access uploaded cached files.' },

  { method: 'GET', route: '/wifu or /waifu', usage: 'Get waifu image or related content.' },

  { method: 'POST', route: '/edit', usage: '?prompt=-----&url=-----' },

  { method: 'POST', route: '/download', usage: '?url=' },

  { method: 'POST', route: '/sara', usage: '/text= , /sikho/qustion:ans/teacher ' },

  { method: 'GET', route: '/say?text=hello', usage: 'Returns Google TTS audio for the given text.' },

  { method: 'POST', route: '/flux', usage: '?prompt=-----' },

  { method: 'POST', route: '/geminigen', usage: '?prompt=-------' },

  { method: 'POST', route: '/gemini', usage: '/text=' },

  { method: 'GET', route: '/sing?query=see+you+again', usage: 'Search YouTube and return direct audio URL.' },

  { method: 'POST', route: '/lalma3', usage: 'Send { message } to chat with LLaMA-3 model.' },

  { method: 'POST', route: '/chatgpt', usage: '?text=' },
];

router.get('/', (req, res) => {
  res.json({
    message: '📘 SARA Server API Endpoints with Usage',
    total: routesInfo.length,
    routes: routesInfo
  });
});

module.exports = router;
