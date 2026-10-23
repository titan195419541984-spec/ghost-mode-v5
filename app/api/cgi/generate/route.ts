import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const PIXAZO_VIDEO_URL = 'https://api.pixazo.ai/v1/text-to-video';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.PIXAZO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Pixazo is not configured. Add PIXAZO_API_KEY to the Render environment variables.' },
        { status: 500 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body must be valid JSON.' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'Request body must be a JSON object.' }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const prompt = typeof input.prompt === 'string'
      ? input.prompt.trim()
      : 'Chrome liquid metal orb, studio lighting, black background, cinematic CGI';

    const duration = input.duration === undefined ? 5 : Number(input.duration);
    const aspectRatio = input.aspect_ratio === undefined ? '9:16' : input.aspect_ratio;
    const resolution = input.resolution === undefined ? '720p' : input.resolution;
    const style = input.style === undefined ? 'photorealistic' : input.style;

    if (!prompt || prompt.length > 4000) {
      return NextResponse.json({ success: false, error: 'Prompt must contain 1–4000 characters.' }, { status: 400 });
    }
    if (!Number.isInteger(duration) || duration < 2 || duration > 10) {
      return NextResponse.json({ success: false, error: 'Duration must be a whole number from 2 to 10 seconds.' }, { status: 400 });
    }
    if (!['9:16', '16:9', '1:1'].includes(String(aspectRatio))) {
      return NextResponse.json({ success: false, error: 'aspect_ratio must be 9:16, 16:9, or 1:1.' }, { status: 400 });
    }
    if (!['720p', '1080p'].includes(String(resolution))) {
      return NextResponse.json({ success: false, error: 'resolution must be 720p or 1080p.' }, { status: 400 });
    }
    if (!['photorealistic', 'animated', 'artistic'].includes(String(style))) {
      return NextResponse.json({ success: false, error: 'style must be photorealistic, animated, or artistic.' }, { status: 400 });
    }

    const upstream = await fetch(PIXAZO_VIDEO_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, duration, aspect_ratio: aspectRatio, resolution, style }),
      signal: AbortSignal.timeout(30000)
    });

    const raw = await upstream.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      data = { message: raw.slice(0, 1000) };
    }

    if (!upstream.ok) {
      console.error('[PIXAZO-CGI] Upstream request failed:', upstream.status, data);
      return NextResponse.json(
        { success: false, error: 'Pixazo rejected the video-generation request.', provider_status: upstream.status, details: data },
        { status: upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502 }
      );
    }

    const jobId = typeof data.job_id === 'string' ? data.job_id : undefined;
    const videoUrl = typeof data.output_url === 'string' ? data.output_url : undefined;
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      meta: { aspect_ratio: aspectRatio, duration, resolution, style, engine: 'Pixazo Text-to-Video API' },
      status: data.status ?? (videoUrl ? 'completed' : 'processing'),
      job_id: jobId,
      estimated_time: data.estimated_time,
      poll_url: jobId ? `/api/cgi/status/${encodeURIComponent(jobId)}` : undefined,
      assets: {
        video_url: videoUrl,
        thumbnail_url: typeof data.cover_url === 'string' ? data.cover_url : ''
      },
      provider: data
    }, { status: videoUrl ? 200 : 202 });
  } catch (error) {
    console.error('[PIXAZO-CGI] Request failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error && error.name === 'TimeoutError'
          ? 'Pixazo did not respond within 30 seconds. Check the job status or try again.'
          : 'The video-generation request could not be completed.' },
      { status: 502 }
    );
  }
}
