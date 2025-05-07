const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://api.groq.com/openai/v1',
});

router.get('/', async (req, res) => {
  const text = req.query.text;

  if (!text) {
    return res.status(400).json({ error: 'Missing text query' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: text },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ text : reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong', detail: error.message });
  }
});

module.exports = router;
