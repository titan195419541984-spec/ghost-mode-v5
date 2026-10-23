import { NextRequest, NextResponse } from 'next/server';
import { getVideoJob } from '../freeVideo';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('job_id') || '';
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(jobId)) return NextResponse.json({ success: false, error: 'A valid job_id query parameter is required.' }, { status: 400 });
  const job = getVideoJob(jobId);
  if (!job) return NextResponse.json({ success: false, error: 'This video job is no longer available in this server session. Please submit it again.' }, { status: 404 });
  return NextResponse.json({ success: true, status: job.status, job_id: jobId, assets: { video_url: job.videoUrl, thumbnail_url: '' }, error: job.error, seed: job.seedUsed }, { headers: { 'Cache-Control': 'no-store' } });
}
