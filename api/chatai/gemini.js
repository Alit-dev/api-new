const express = require("express");
const { GoogleGenAI, Modality } = require("@google/genai");

const router = express.Router();

// Google AI init
const ai = new GoogleGenAI({
  apiKey: "AIzaSyAl5enm8yfM2d2dSqrw78Hud1DF5ZvsWO0",
});

router.get("/", async (req, res) => {
  const { text } = req.query;

  if (!text) {
    return res.status(400).json({ error: "text is required." });
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: [
        {
          role: "user",
          parts: [
            { text: text || "" },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT],
      },
    });

    const textResponse =
      result?.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text ||
      "No text response";

    return res.json({
      text: textResponse.replace(/\\n/g, "\n"), // Only return text response
    });
  } catch (err) {
    console.error("Text Error:", err);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

module.exports = router;
