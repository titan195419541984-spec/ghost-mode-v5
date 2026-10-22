import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY in Render environment variables' }, { status: 500 });
    }
    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Please enter a prompt.' }, { status: 400 });
    }
    const enhancedPrompt = `${prompt}, ultra realistic CGI, studio lighting, black background, 8k, faceless product shot, no text, no watermark, trending on artstation, chrome liquid metal`;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
        })
      }
    );
    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Gemini API error' }, { status: 502 });
    }
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((part: { inlineData?: { data: string; mimeType?: string } }) => part.inlineData);
    if (!imagePart?.inlineData) {
      return NextResponse.json({ error: 'The image service did not return an image. Please try a different prompt.' }, { status: 502 });
    }
    return NextResponse.json({
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/png',
      prompt: enhancedPrompt
    });
  } catch {
    return NextResponse.json({ error: 'The image request could not be completed. Please try again.' }, { status: 500 });
  }
}
