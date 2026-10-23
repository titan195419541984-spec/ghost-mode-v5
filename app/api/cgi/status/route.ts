import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const apiKey = process.env.PIXAZO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'Pixazo is not configured. Add PIXAZO_API_KEY to the Render environment variables.' },
      { status: 500 }
    );
  }

  const jobId = request.nextUrl.searchParams.get('job_id') || '';
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(jobId)) {
    return NextResponse.json({ success: false, error: 'A valid job_id query parameter is required.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`https://api.pixazo.ai/v1/jobs/${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000)
    });
    const raw = await upstream.text();
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      data = { message: raw.slice(0, 1000) };
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { success: false, error: 'Could not retrieve the Pixazo job status.', provider_status: upstream.status, details: data },
        { status: upstream.status >= 400 && upstream.status < 500 ? upstream.status : 502 }
      );
    }

    return NextResponse.json({
      success: true,
      status: data.status ?? 'processing',
      job_id: jobId,
      assets: {
        video_url: typeof data.output_url === 'string' ? data.output_url : undefined,
        thumbnail_url: typeof data.cover_url === 'string' ? data.cover_url : ''
      },
      provider: data
    });
  } catch (error) {
    console.error('[PIXAZO-CGI] Status check failed:', error);
    return NextResponse.json({ success: false, error: 'Could not check the video job status.' }, { status: 502 });
  }
}
