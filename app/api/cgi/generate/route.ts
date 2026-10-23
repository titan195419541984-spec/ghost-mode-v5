import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { startVideoJob } from '@/lib/freeVideo';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'Request body must be a JSON object.' }, { status: 400 });
    const input = body as Record<string, unknown>;
    const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
    const duration = input.duration === undefined ? 5 : Number(input.duration);
    const aspectRatio = input.aspect_ratio === undefined ? '9:16' : String(input.aspect_ratio);
    if (!prompt || prompt.length > 4000) return NextResponse.json({ success: false, error: 'Prompt must contain 1–4000 characters.' }, { status: 400 });
    if (!Number.isFinite(duration) || duration < 3 || duration > 8) return NextResponse.json({ success: false, error: 'Duration must be between 3 and 8 seconds for the free model.' }, { status: 400 });
    if (!['9:16', '16:9'].includes(aspectRatio)) return NextResponse.json({ success: false, error: 'Video format must be 9:16 or 16:9.' }, { status: 400 });
    const jobId = randomUUID().replace(/-/g, '');
    startVideoJob(jobId, prompt, duration, aspectRatio);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), meta: { aspect_ratio: aspectRatio, duration, engine: 'LTX-Video on free Hugging Face ZeroGPU' }, status: 'QUEUED', job_id: jobId, poll_url: '/api/cgi/status?job_id=' + encodeURIComponent(jobId), assets: { thumbnail_url: '' } }, { status: 202 });
  } catch (error) {
    console.error('[FREE-VIDEO] Could not start job:', error);
    return NextResponse.json({ success: false, error: 'Could not start free video generation. Please try again.' }, { status: 500 });
  }
}
