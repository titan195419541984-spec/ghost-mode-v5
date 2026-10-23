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

    const input = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json({ error: 'Please enter a prompt.' }, { status: 400 });
    }
    if (prompt.length > 20000) {
      return NextResponse.json({ error: 'Prompt must be 20000 characters or fewer.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GEMINI_API_KEY in Render environment variables.' }, { status: 500 });
    }

    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        model: 'gemini-3.8-flash',
        input: prompt,
        ...(typeof input.system_instruction === 'string' && input.system_instruction.trim()
          ? { system_instruction: input.system_instruction.trim().slice(0, 10000) }
          : {}),
        generation_config: { thinking_level: 'low', max_output_tokens: 4096 }
      }),
      signal: AbortSignal.timeout(60000),
      cache: 'no-store'
    });

    const raw = await upstream.text();
    let data: Record<string, unknown>;
    try { data = JSON.parse(raw) as Record<string, unknown>; }
    catch { data = { message: raw.slice(0, 1000) }; }

    if (!upstream.ok) {
      console.error('[GEMINI-TEXT] Upstream request failed:', upstream.status, data);
      const upstreamError = data.error && typeof data.error === 'object'
        ? (data.error as Record<string, unknown>).message
        : undefined;
      return NextResponse.json(
        { error: typeof upstreamError === 'string' ? upstreamError : 'Gemini text generation failed.', provider_status: upstream.status },
        { status: 502 }
      );
    }

    let text = typeof data.output_text === 'string' ? data.output_text : '';
    if (!text && Array.isArray(data.output)) {
      text = data.output.flatMap((item: unknown) => {
        if (!item || typeof item !== 'object') return [];
        const obj = item as Record<string, unknown>;
        if (obj.type === 'text' && typeof obj.text === 'string') return [obj.text];
        if (Array.isArray(obj.content)) return obj.content.flatMap((part: unknown) => {
          if (part && typeof part === 'object' && (part as Record<string, unknown>).type === 'text' && typeof (part as Record<string, unknown>).text === 'string') {
            return [(part as Record<string, unknown>).text as string];
          }
          return [];
        });
        return [];
      }).join('\n');
    }

    if (!text.trim()) {
      console.error('[GEMINI-TEXT] No text in successful response:', data);
      return NextResponse.json({ error: 'Gemini returned no text. Try a different prompt.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, text, model: 'gemini-3.8-flash' });
  } catch (error) {
    console.error('[GEMINI-TEXT] Request failed:', error);
    return NextResponse.json(
      { error: error instanceof Error && error.name === 'TimeoutError' ? 'Text generation timed out. Please try again.' : 'The text request could not be completed.' },
      { status: 502 }
    );
  }
}
