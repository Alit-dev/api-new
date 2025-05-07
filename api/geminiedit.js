const express = require("express");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI, Modality } = require("@google/genai");
const crypto = require("crypto");

const router = express.Router();

// Google AI init
const ai = new GoogleGenAI({
  apiKey: "AIzaSyAl5enm8yfM2d2dSqrw78Hud1DF5ZvsWO0",
});

router.get("/", async (req, res) => {
  const fetch = (await import("node-fetch")).default;

  const { prompt, url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Image URL is required." });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Image could not be fetched.");

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt || "Enhance this image." },
            {
              inlineData: {
                mimeType: contentType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const textResponse =
      result?.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text ||
      "No text response";

    const imagePart = result?.candidates?.[0]?.content?.parts?.find(
      (p) => p.inlineData
    );

    if (!imagePart) {
      return res.status(500).json({ error: "No image in response." });
    }

    // Generate a unique filename using timestamp or a random string
    const uniqueFilename = `${crypto.randomBytes(16).toString('hex')}.jpg`;
    const rootDir = path.join(__dirname, ".."); // goes to /all
    const cachesDir = path.join(rootDir, "caches");

    if (!fs.existsSync(cachesDir)) fs.mkdirSync(cachesDir, { recursive: true });

    const imgPath = path.join(cachesDir, uniqueFilename);

    // Save the image
    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    fs.writeFileSync(imgPath, buffer);

    // Dynamically construct the full URL
    const fullImageUrl = `${req.protocol}://${req.get('host')}/upload/${uniqueFilename}`;

    // Delete the image after 3 minutes
    setTimeout(() => {
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath); // Delete the file
        console.log(`Deleted image: ${imgPath}`);
      }
    }, 30000); // 3 minutes (180,000 ms)

    return res.json({
      text: textResponse.replace(/\\n/g, "\n"),
      imageUrl: fullImageUrl,  // Full URL is dynamically generated
    });
  } catch (err) {
    console.error("Image Error:", err);
    return res.status(500).json({ error: "Something went wrong (Image)." });
  }
});

module.exports = router;
