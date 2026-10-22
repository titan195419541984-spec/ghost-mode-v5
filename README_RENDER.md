
# GHOST MODE V4 - RENDER DEPLOY - $0

## Why Render?
- Free tier, no credit card
- Full Node server for Gemini API (GitHub Pages can't do this)
- Auto-deploy from GitHub
- Better than Vercel for this: doesn't sleep as aggressively on new free plan

## Deploy from phone (GitHub app)

1. Create GitHub repo: ghost-mode-v4
2. Upload all files from this folder to GitHub repo
3. Go to dashboard.render.com
4. Click New + > Web Service > Connect your GitHub repo ghost-mode-v4
5. Settings:
   Build Command: npm install && npm run build
   Start Command: npm start
   Environment: Node
6. Add Environment Variable:
   GEMINI_API_KEY = AIzaSy... (your free key from aistudio.google.com/app/apikey)
7. Click Create Web Service - deploys in 2-3 min

## After deploy
Your live URL: https://ghost-mode-v4.onrender.com (or whatever Render names it)

AppLovin website slot:
https://ghost-mode-v4.onrender.com

AppLovin will check:
https://ghost-mode-v4.onrender.com/app-ads.txt -> should show your applovin line
https://ghost-mode-v4.onrender.com/privacy.html -> privacy page

## Update app-ads.txt
Edit public/app-ads.txt and replace YOUR_SDK_KEY with your actual AppLovin SDK key, push to GitHub, Render auto-redeploys.

Cost: $0 - Render free + Gemini free (1500 images/day)
