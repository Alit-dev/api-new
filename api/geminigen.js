const express = require('express');
const fs = require('fs');
const { GoogleGenAI, Modality } = require('@google/genai');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// 🔐 API key for Google GenAI
const ai = new GoogleGenAI({
  apiKey: 'AIzaSyAl5enm8yfM2d2dSqrw78Hud1DF5ZvsWO0',
});

// Function to generate image from the prompt
async function generateImageFromPrompt(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: prompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, 'base64');

        // Create a unique filename
        const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}.png`;
        const cacheDir = path.join(__dirname, '..', 'caches');

        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }

        const imgPath = path.join(cacheDir, uniqueFilename);
        fs.writeFileSync(imgPath, buffer);
        console.log('✅ Image saved as', uniqueFilename);

        // Auto-delete after 3 minutes
        setTimeout(() => {
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
            console.log(`🗑️ Deleted: ${uniqueFilename}`);
          }
        }, 180000); // 3 minutes in ms

        return uniqueFilename;
      }
    }

    throw new Error('No image found in response');
  } catch (err) {
    console.error('❌ Generation Error:', err);
    throw new Error('Failed to generate image');
  }
}

// GET /geminigen?prompt=your_text
router.get('/', async (req, res) => {
  const { prompt } = req.query;

  if (!prompt) {
    return res.status(400).json({ success: false, error: 'Prompt is required' });
  }

  try {
    const filename = await generateImageFromPrompt(prompt);
    const imageUrl = `${req.protocol}://${req.get('host')}/upload/${filename}`;

    res.json({
      success: true,
      imageUrl,
      message: 'Image generated successfully!',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
