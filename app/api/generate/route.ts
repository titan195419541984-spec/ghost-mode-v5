import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    const prompt = body && typeof body === 'object' && !Array.isArray(body)
      ? (body as Record<string, unknown>).prompt
      : undefined;

    if (typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Please enter a prompt.' }, { status: 400 });
    }
    if (prompt.trim().length > 4000) {
      return NextResponse.json({ error: 'Prompt must be 4000 characters or fewer.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY in Render environment variables.' }, { status: 500 });
    }

    const enhancedPrompt = `Generate a high-quality fashion CGI image for Ghost Mode: stealth fashion, dark techwear, cinematic studio lighting, ultra-detailed fashion catalog style. User request: ${prompt.trim()}. Avoid text, logos, and watermarks.`;
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        model: 'gemini-nano-banana-2.1',
        input: enhancedPrompt,
        response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: '1:1', image_size: '1K' }
      }),
      signal: AbortSignal.timeout(90000),
      cache: 'no-store'
    });

    const raw = await upstream.text();
    let data: Record<string, unknown>;
    try { data = JSON.parse(raw) as Record<string, unknown>; }
    catch { data = { message: raw.slice(0, 1000) }; }

    if (!upstream.ok) {
      console.error('[GEMINI-IMAGE] Upstream request failed:', upstream.status, data);
      const upstreamError = data.error && typeof data.error === 'object'
        ? (data.error as Record<string, unknown>).message
        : undefined;
      return NextResponse.json(
        { error: typeof upstreamError === 'string' ? upstreamError : 'Gemini image generation failed.', provider_status: upstream.status },
        { status: 502 }
      );
    }

    // The Interactions API may expose image data through output_image or as an image block in output/steps.
    const candidates: unknown[] = [];
    const collect = (value: unknown, depth = 0): void => {
      if (depth > 8 || !value || typeof value !== 'object') return;
      const obj = value as Record<string, unknown>;
      if (typeof obj.data === 'string' && (obj.type === 'image' || typeof obj.mime_type === 'string' || typeof obj.mimeType === 'string')) {
        candidates.push(obj);
      }
      for (const [key, child] of Object.entries(obj)) {
        if (key === 'output_image' && child && typeof child === 'object') candidates.unshift(child);
        else if (Array.isArray(child)) child.forEach(item => collect(item, depth + 1));
        else if (child && typeof child === 'object') collect(child, depth + 1);
      }
    };
    collect(data);
    const image = candidates.find(item => item && typeof item === 'object' && typeof (item as Record<string, unknown>).data === 'string') as Record<string, unknown> | undefined;

    if (!image || typeof image.data !== 'string') {
      console.error('[GEMINI-IMAGE] No image data in successful response:', data);
      return NextResponse.json({ error: 'Gemini returned a response but no image data. Check the API key and image-model access.' }, { status: 502 });
    }

    return NextResponse.json({
      imageBase64: image.data,
      mimeType: typeof image.mime_type === 'string' ? image.mime_type : typeof image.mimeType === 'string' ? image.mimeType : 'image/jpeg',
      prompt: enhancedPrompt,
      model: 'gemini-nano-banana-2.1'
    });
  } catch (error) {
    console.error('[GEMINI-IMAGE] Request failed:', error);
    return NextResponse.json(
      { error: error instanceof Error && error.name === 'TimeoutError' ? 'Image generation timed out. Please try again.' : 'The image request could not be completed.' },
      { status: 502 }
    );
  }
}
