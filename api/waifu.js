// waifu.js
const express = require('express');
const router = express.Router();

// অনুমোদিত ট্যাগগুলোর তালিকা
const allowedTags = ['hentai', 'milf', 'oral', 'paizuri', 'ecchi', 'ero'];

router.get('/', async (req, res) => {
  // node-fetch কে dynamic import করতে হবে কারণ এটি ES module
  const fetch = (await import('node-fetch')).default;

  try {
    // ইউজার চাইলে ?tag= এর মাধ্যমে ট্যাগ দিতে পারবে, নাহলে র‍্যান্ডম
    let tag = req.query.tag;

    if (!tag) {
      tag = allowedTags[Math.floor(Math.random() * allowedTags.length)];
    }

    // ভ্যালিড ট্যাগ কিনা চেক
    if (!allowedTags.includes(tag)) {
      return res.status(400).json({
        success: false,
        message: `Invalid tag. Allowed tags: ${allowedTags.join(', ')}`
      });
    }

    // API রিকুয়েস্ট তৈরি
    const queryParams = new URLSearchParams();
    queryParams.append('included_tags', tag);
    queryParams.append('height', '>=2000');

    const apiUrl = `https://api.waifu.im/search/?${queryParams.toString()}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.images || data.images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No image found.'
      });
    }

    // ইমেজ ডাটা রিটার্ন
    const imageUrl = data.images[0].url;

    // ইমেজ শো করার জন্য HTML রিটার্ন
    res.send(`
      <html>
        <head>
          <title>Waifu Image</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
            }
            img {
              max-width: 90%;
              height: auto;
              border-radius: 10px;
              box-shadow: 0 0 10px rgba(0,0,0,0.2);
              transition: transform 0.3s ease;
            }
            img:hover {
              transform: scale(1.03);
            }
          </style>
        </head>
        <body>
          <h1>Tag: ${tag}</h1>
          <img src="${imageUrl}" alt="Waifu Image" loading="eager" />
        </body>
      </html>
    `);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
});

module.exports = router;
