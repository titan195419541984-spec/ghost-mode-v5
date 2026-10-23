import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Please enter a prompt.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY in Render environment variables.' },
        { status: 500 }
      );
    }

    const enhancedPrompt = `Generate a high-quality image for Ghost Mode: stealth fashion, dark techwear, cinematic lighting, ultra-detailed fashion-catalog style. User request: ${prompt.trim()}. Avoid text, logos, and watermarks.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${encodeURIComponent(apiKey)}`,
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
      console.error('Gemini image generation error:', data);
      return NextResponse.json(
        { error: data?.error?.message || 'Gemini image generation failed.' },
        { status: 502 }
      );
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(
      (part: { inlineData?: { data?: string; mimeType?: string } }) =>
        typeof part.inlineData?.data === 'string'
    );

    if (!imagePart?.inlineData?.data) {
      return NextResponse.json(
        { error: 'The image service returned no image. Try a different prompt.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      imageBase64: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/png',
      prompt: enhancedPrompt
    });
  } catch (error) {
    console.error('Image generation request failed:', error);
    return NextResponse.json(
      { error: 'The image request could not be completed. Please try again.' },
      { status: 500 }
    );
  }
}
