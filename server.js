import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(express.json());

// Main CGI Endpoint for Faceless Video Layer Generation
app.post('/api/cgi/generate', async (req, res) => {
  try {
    // Default abstract cinematic prompts matching your V4 layout rules
    const {
      prompt = "chrome liquid metal orb, studio lighting, black background, 8k CGI",
      aspect_ratio = "9:16", // Optimized for mobile shorts/vertical video
      duration = 5
    } = req.body;

    console.log(`[CGI-GEN] Initializing process for: "${prompt}"`);

    // Interfacing with the Pixazo Free API Tier
    const cgiResponse = await fetch('https://pixazo.ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PIXAZO_FREE_TOKEN || 'FREE_DEV_KEY'}`
      },
      body: JSON.stringify({
        prompt: prompt,
        width: 720,
        height: 1280,
        steps: 25,
        guidance_scale: 7.5,
        length: duration
      })
    });

    if (!cgiResponse.ok) {
      throw new Error(`CGI Provider responded with code ${cgiResponse.status}`);
    }

    const data = await cgiResponse.json();

    // Respond with the assets structured for your dynamic UI container
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      meta: { aspect_ratio, duration, engine: "Pixazo-CGI-v5" },
      assets: {
        video_url: data.video_url || data.output_url,
        thumbnail_url: data.cover_url || ""
      }
    });

  } catch (error) {
    console.error('[CGI-ERROR]', error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to compile automated CGI layer assets.",
      details: error.message
    });
  }
});

// AppLovin Validation Mocks (Ensures consistency with your layout verification links)
app.get('/app-ads.txt', (req, res) => {
  res.type('text/plain');
  res.send('google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\napplovin.com, XXXXX, DIRECT');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CGI System Live on Port ${PORT}`));
