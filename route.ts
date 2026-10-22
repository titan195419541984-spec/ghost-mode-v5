
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Missing GEMINI_API_KEY in Render env vars' }, { status: 500 });
  const enhancedPrompt = `${prompt}, ultra realistic CGI, studio lighting, black background, 8k, faceless product shot, no text, no watermark, trending on artstation, chrome liquid metal`;
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error?.message || 'Gemini API error', raw: data }, { status: 500 });
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData);
    if (!imagePart) return NextResponse.json({ error: 'No image generated', raw: data }, { status: 500 });
    return NextResponse.json({ imageBase64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType || 'image/png', prompt: enhancedPrompt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
