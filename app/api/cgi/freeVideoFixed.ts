type VideoJob = {
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  videoUrl?: string;
  seedUsed?: number;
  error?: string;
  createdAt: number;
};

const jobs = new Map<string, VideoJob>();
const SPACE_BASE_URL = 'https://lightricks-ltx-video-distilled.hf.space';
const API_NAME = 'text_to_video';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseSseResult(raw: string): { videoUrl: string; seedUsed?: number } {
  const blocks = raw.split('\n\n').filter(Boolean).reverse();
  for (const block of blocks) {
    const eventMatch = block.match(/^event:\s*(\S+)/m);
    const dataMatch = block.match(/^data:\s*(.+)$/m);
    if (!eventMatch || !dataMatch) continue;
    if (eventMatch[1] === 'error') {
      throw new Error('The free video model failed: ' + dataMatch[1]);
    }
    if (eventMatch[1] === 'complete') {
      const payload = JSON.parse(dataMatch[1]);
      const videoField = payload?.[0];
      const seedUsed = typeof payload?.[1] === 'number' ? payload[1] : undefined;
      const videoUrl = videoField?.video?.url || videoField?.url;
      if (typeof videoUrl !== 'string' || !videoUrl) {
        throw new Error('The free model finished but returned no video URL.');
      }
      return { videoUrl, seedUsed };
    }
  }
  throw new Error('The free video model timed out or closed the connection before returning a video.');
}

async function generateOnFreeSpace(prompt: string, durationSeconds: number, aspectRatio: string) {
  const width = aspectRatio === '16:9' ? 1024 : 576;
  const height = aspectRatio === '16:9' ? 576 : 1024;
  const data = [
    prompt,
    'worst quality, blurry, distorted, watermark',
    '',
    '',
    height,
    width,
    'text-to-video',
    clamp(durationSeconds, 0.3, 8.5),
    9,
    Math.floor(Math.random() * 4294967295),
    true,
    1,
    true
  ];
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (process.env.HF_TOKEN) headers.Authorization = 'Bearer ' + process.env.HF_TOKEN;

  const submitRes = await fetch(SPACE_BASE_URL + '/gradio_api/call/' + API_NAME, {
    method: 'POST',
    headers,
    body: JSON.stringify({ data }),
    signal: AbortSignal.timeout(30000)
  });
  if (!submitRes.ok) {
    const detail = (await submitRes.text()).slice(0, 500);
    throw new Error('Free video service rejected the request (HTTP ' + submitRes.status + '). ' +
      (submitRes.status === 429 ? 'The shared free GPU is rate-limited; try later.' : detail));
  }
  const submitted = await submitRes.json() as { event_id?: string };
  if (!submitted.event_id) throw new Error('The free video service did not return a job ID.');

  const resultRes = await fetch(
    SPACE_BASE_URL + '/gradio_api/call/' + API_NAME + '/' + encodeURIComponent(submitted.event_id),
    { headers, signal: AbortSignal.timeout(5 * 60 * 1000) }
  );
  if (!resultRes.ok || !resultRes.body) {
    throw new Error('Lost connection to the free video service (HTTP ' + resultRes.status + ').');
  }
  return parseSseResult(await resultRes.text());
}

export function getVideoJob(jobId: string) {
  return jobs.get(jobId);
}

export function startVideoJob(jobId: string, prompt: string, durationSeconds: number, aspectRatio: string) {
  // Keep the in-memory queue bounded and discard old results.
  const now = Date.now();
  jobs.forEach((job, id) => {
    if (now - job.createdAt > 2 * 60 * 60 * 1000) jobs.delete(id);
  });
  jobs.set(jobId, { status: 'QUEUED', createdAt: now });

  void (async () => {
    const job = jobs.get(jobId);
    if (!job) return;
    job.status = 'PROCESSING';
    try {
      const result = await generateOnFreeSpace(prompt, durationSeconds, aspectRatio);
      job.status = 'COMPLETED';
      job.videoUrl = result.videoUrl;
      job.seedUsed = result.seedUsed;
    } catch (error) {
      job.status = 'FAILED';
      job.error = error instanceof Error ? error.message : 'Free video generation failed.';
      console.error('[FREE-VIDEO] Generation failed:', job.error);
    }
  })();
}
