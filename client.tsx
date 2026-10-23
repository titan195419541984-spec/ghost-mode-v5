'use client';
import { useEffect, useRef, useState } from 'react';

const styleOptions = ['Follow my prompt', 'Photorealistic', '3D CGI', 'Anime', 'Dark / cinematic', 'Fantasy', 'Sci-fi', 'Horror', 'Product photo', 'Fashion editorial', 'Watercolor', 'Pixel art'];
type VideoResult = { video_url?: string; thumbnail_url?: string };

export default function GhostModeGenerator() {
  const [mode, setMode] = useState<'image' | 'video'>('video');
  const [prompt, setPrompt] = useState('A black supercar tearing through a neon-soaked cyberpunk city in the rain, low tracking camera, reflections exploding across wet pavement, cinematic motion blur, dramatic lighting');
  const [style, setStyle] = useState('Follow my prompt');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [video, setVideo] = useState<VideoResult | null>(null);
  const [videoStatus, setVideoStatus] = useState('');
  const [duration, setDuration] = useState('5');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [resolution, setResolution] = useState('720p');
  const [videoStyle, setVideoStyle] = useState('photorealistic');
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.querySelectorAll('.adsbygoogle').forEach(() => {
      try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); }
      catch (error) { console.error('AdSense initialization failed:', error); }
    });
    return () => { if (pollTimer.current) clearTimeout(pollTimer.current); };
  }, []);

  const generateImage = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setImage(null); setError('');
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompt.trim(), style }) });
      const data = await res.json();
      if (!res.ok || !data.imageBase64) { setError(data.error || 'Image generation failed. Please try again.'); return; }
      setImage(`data:${data.mimeType || 'image/jpeg'};base64,${data.imageBase64}`);
    } catch { setError('Could not reach the image generator. Check your connection and try again.'); }
    finally { setLoading(false); }
  };

  const generateVideo = async () => {
    if (!prompt.trim() || loading) return;
    if (pollTimer.current) clearTimeout(pollTimer.current);
    setLoading(true); setVideo(null); setError(''); setVideoStatus('Submitting your video prompt…');
    try {
      const res = await fetch('/api/cgi/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), duration: Number(duration), aspect_ratio: aspectRatio, resolution, style: videoStyle })
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || 'Video generation could not start.'); setVideoStatus(''); return; }
      const immediateUrl = data.assets?.video_url;
      if (immediateUrl) { setVideo({ video_url: immediateUrl, thumbnail_url: data.assets?.thumbnail_url }); setVideoStatus('Video ready'); return; }
      if (!data.job_id) { setError('The video provider accepted the request but did not return a job ID.'); setVideoStatus(''); return; }

      setVideoStatus('Rendering your video… this can take a few minutes.');
      let attempts = 0;
      const poll = async () => {
        attempts += 1;
        try {
          const statusRes = await fetch(`/api/cgi/status?job_id=${encodeURIComponent(data.job_id)}`, { cache: 'no-store' });
          const statusData = await statusRes.json();
          if (!statusRes.ok || !statusData.success) throw new Error(statusData.error || 'Status check failed.');
          const state = String(statusData.status || 'processing').toLowerCase();
          const url = statusData.assets?.video_url;
          if (url || ['completed', 'complete', 'succeeded', 'success', 'finished', 'done'].includes(state)) {
            if (url) { setVideo({ video_url: url, thumbnail_url: statusData.assets?.thumbnail_url }); setVideoStatus('Video ready'); setLoading(false); return; }
          }
          if (['failed', 'error', 'cancelled', 'canceled'].includes(state)) throw new Error('The video provider reported that generation failed. Try a shorter or simpler prompt.');
          if (attempts >= 48) throw new Error('This video is taking longer than expected. Try again later; the provider job may still be processing.');
          setVideoStatus(`Rendering your video… check ${attempts} of 48`);
          pollTimer.current = setTimeout(poll, 5000);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not check video status.');
          setVideoStatus(''); setLoading(false);
        }
      };
      pollTimer.current = setTimeout(poll, 4000);
    } catch {
      setError('Could not reach the video generator. Check the provider setup and try again.');
      setVideoStatus(''); setLoading(false);
    } finally {
      // Keep the busy state active while an asynchronous video job is being polled.
    }
  };

  const surpriseMe = () => {
    const ideas = [
      'A black supercar tearing through a neon-soaked cyberpunk city in the rain, low tracking camera, cinematic motion blur',
      'A colossal dragon emerging through storm clouds above a medieval castle, lightning flashes, sweeping aerial camera',
      'A tiny astronaut walking across a glowing alien ocean, giant planets overhead, gentle waves and floating particles',
      'A glass greenhouse floating above a stormy ocean at sunset, waves crashing far below, slow cinematic orbit',
      'A futuristic motorcycle drifting around a corner in a neon tunnel, sparks and tire smoke, dynamic chase camera',
      'A wolf sprinting across a frozen lake beneath the northern lights, snow whipping past the lens, dramatic slow motion',
      'A bioluminescent forest awakening at night, glowing flowers opening one by one, camera gliding between ancient trees',
      'A luxury perfume bottle emerging from liquid chrome, rippling reflections, macro product-film lighting',
      'A massive space station orbiting a blue planet, ships streaking past, slow majestic camera movement',
      'A tsunami-sized wave made of glittering liquid gold rolling through a surreal black desert'
    ];
    setPrompt(ideas[Math.floor(Math.random() * ideas.length)]);
  };

  const selectMode = (next: 'image' | 'video') => {
    setMode(next); setError('');
    if (next === 'video') setPrompt('A black supercar tearing through a neon-soaked cyberpunk city in the rain, low tracking camera, reflections exploding across wet pavement, cinematic motion blur, dramatic lighting');
    else setPrompt('A glass greenhouse floating above a stormy ocean at sunset');
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F2F0E9] px-4 py-6 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <ins className="adsbygoogle block w-full" style={{ display: 'block' }} data-ad-client="ca-pub-9616956000265389" data-ad-slot="YOUR_SLOT_ID" data-ad-format="auto" data-full-width-responsive="true" />
        <header className="flex items-center gap-3 my-7">
          <div className="w-10 h-10 shrink-0 rounded-full bg-[#D4FF32] text-black flex items-center justify-center font-black text-lg">G</div>
          <div><h1 className="font-black tracking-tight text-xl">GHOST MODE</h1><p className="text-xs text-[#929292]">AI CREATIVE STUDIO · MAKE IT MOVE</p></div>
          <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-[#202020] text-[#D4FF32]">V5 STUDIO</span>
        </header>

        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#141414] border border-[#303030] mb-6">
          <button type="button" onClick={() => selectMode('video')} className={`rounded-xl py-3 text-sm font-black tracking-wide ${mode === 'video' ? 'bg-[#D4FF32] text-black' : 'text-[#9A9A9A]'}`}>▶ VIDEO LAB</button>
          <button type="button" onClick={() => selectMode('image')} className={`rounded-xl py-3 text-sm font-black tracking-wide ${mode === 'image' ? 'bg-[#D4FF32] text-black' : 'text-[#9A9A9A]'}`}>✦ IMAGE LAB</button>
        </div>

        <div className="mb-4"><div className="text-[11px] uppercase tracking-[.22em] text-[#D4FF32] font-bold">{mode === 'video' ? 'Text-to-video generator' : 'AI image generator'}</div><h2 className="text-2xl sm:text-3xl font-black mt-1">{mode === 'video' ? 'Make your idea move.' : 'Create a new visual.'}</h2><p className="text-sm text-[#929292] mt-2">{mode === 'video' ? 'Describe the scene, the movement, the camera, and the mood. Ghost Mode turns your prompt into a video clip.' : 'Build an original image from a prompt and choose a visual style.'}</p></div>

        <label htmlFor="prompt" className="block text-sm font-bold mb-2">Describe your {mode === 'video' ? 'video scene and motion' : 'image'}</label>
        <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full min-h-36 bg-[#141414] border border-[#303030] rounded-2xl p-4 text-sm leading-6 focus:border-[#D4FF32] outline-none" placeholder={mode === 'video' ? 'A cinematic chase through a neon city, rain spraying from the tires, low tracking camera…' : 'A robot chef cooking ramen in a rainy Tokyo alley…'} maxLength={4000} />
        <button type="button" onClick={surpriseMe} className="mt-2 text-xs text-[#D4FF32] underline underline-offset-4">⚡ Surprise me with a cinematic idea</button>

        {mode === 'video' ? (
          <section className="mt-5 p-4 sm:p-5 rounded-2xl border border-[#303030] bg-[#111111]">
            <div className="flex items-center justify-between gap-2 mb-4"><h3 className="font-black">VIDEO SETTINGS</h3><span className="text-[10px] text-[#D4FF32] border border-[#3D4A15] rounded-full px-2 py-1">AI GENERATED</span></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label htmlFor="duration" className="block text-xs text-[#A7A7A7] mb-2">Duration</label><select id="duration" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-[#1B1B1B] border border-[#333] rounded-xl p-3 text-sm">{[5, 6, 8, 10, 4, 3, 2].map(n => <option key={n} value={n}>{n} seconds</option>)}</select></div>
              <div><label htmlFor="ratio" className="block text-xs text-[#A7A7A7] mb-2">Video format</label><select id="ratio" value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="w-full bg-[#1B1B1B] border border-[#333] rounded-xl p-3 text-sm"><option value="9:16">9:16 · Shorts / Reels</option><option value="16:9">16:9 · YouTube</option><option value="1:1">1:1 · Square</option></select></div>
              <div><label htmlFor="resolution" className="block text-xs text-[#A7A7A7] mb-2">Resolution</label><select id="resolution" value={resolution} onChange={e => setResolution(e.target.value)} className="w-full bg-[#1B1B1B] border border-[#333] rounded-xl p-3 text-sm"><option value="720p">720p HD</option><option value="1080p">1080p Full HD</option></select></div>
              <div><label htmlFor="videoStyle" className="block text-xs text-[#A7A7A7] mb-2">Rendering style</label><select id="videoStyle" value={videoStyle} onChange={e => setVideoStyle(e.target.value)} className="w-full bg-[#1B1B1B] border border-[#333] rounded-xl p-3 text-sm"><option value="photorealistic">Photorealistic</option><option value="animated">Animated</option><option value="artistic">Artistic</option></select></div>
            </div>
            <p className="text-[11px] leading-5 text-[#777] mt-3">Vertical is ideal for Shorts, TikTok and Reels. Longer clips and higher resolutions may take longer or depend on your provider plan.</p>
          </section>
        ) : (
          <><label htmlFor="style" className="block text-sm font-bold mt-5 mb-2">Visual style</label><select id="style" value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-[#141414] border border-[#303030] rounded-xl p-3 text-sm text-white focus:border-[#D4FF32] outline-none">{styleOptions.map(option => <option key={option} value={option}>{option}</option>)}</select><p className="text-xs text-[#929292] mt-2">“Follow my prompt” lets your idea lead instead of forcing every image into one look.</p></>
        )}

        <button onClick={mode === 'video' ? generateVideo : generateImage} disabled={loading || !prompt.trim()} className="w-full mt-5 h-14 rounded-full bg-[#D4FF32] text-black font-black tracking-widest disabled:opacity-50">{loading ? (mode === 'video' ? 'RENDERING YOUR VIDEO…' : 'CREATING YOUR IMAGE…') : (mode === 'video' ? '▶ GENERATE VIDEO' : '✦ GENERATE IMAGE')}</button>
        {loading && mode === 'video' && <div className="mt-3 p-3 rounded-xl bg-[#141414] border border-[#303030] text-sm text-[#D4FF32] animate-pulse">{videoStatus || 'Preparing your video…'}<div className="mt-2 h-1 rounded-full bg-[#292929] overflow-hidden"><div className="h-full w-1/2 bg-[#D4FF32] rounded-full" /></div></div>}
        {error && <div role="alert" className="mt-4 p-3 rounded-xl border border-red-900 bg-red-950/40 text-sm text-red-200"><p>{error}</p>{error.includes('PIXAZO_API_KEY') && <p className="mt-2 text-xs text-red-100">Render → ghost-mode-v5-1 → Environment → add PIXAZO_API_KEY, then redeploy. Use your own key from the provider; do not post it in chat.</p>}</div>}

        {video?.video_url && <section className="mt-6 rounded-3xl overflow-hidden border border-[#333] bg-[#141414] p-3"><div className="flex justify-between items-center gap-2 mb-3"><div><p className="text-xs uppercase tracking-widest text-[#D4FF32] font-bold">Render complete</p><p className="text-sm font-bold mt-1">Your video is ready</p></div><span className="text-xs text-[#999]">{duration}s · {aspectRatio} · {resolution}</span></div><video controls playsInline poster={video.thumbnail_url || undefined} src={video.video_url} className="w-full rounded-2xl bg-black" /><a href={video.video_url} target="_blank" rel="noreferrer" download="ghost-mode-video.mp4" className="mt-3 block w-full text-center rounded-full bg-[#D4FF32] text-black font-black text-sm py-3">DOWNLOAD VIDEO ↗</a><p className="text-[11px] text-[#777] mt-2">Download opens the provider’s video file if direct downloading is supported by the browser.</p></section>}
        {image && <section className="mt-6 rounded-3xl overflow-hidden border border-[#292929] bg-[#141414] p-2"><img src={image} alt={prompt} className="w-full rounded-2xl" /><div className="p-3 flex items-center justify-between gap-3"><span className="text-xs text-[#A8A5A0]">{style} · Generated image</span><a href={image} download="ghost-mode-image.jpg" className="text-xs font-bold bg-[#D4FF32] text-black px-4 py-2 rounded-full">Download image</a></div><button onClick={generateImage} disabled={loading} className="w-full mt-1 mb-2 h-11 rounded-full border border-[#444] text-sm font-bold disabled:opacity-50">{loading ? 'GENERATING…' : 'TRY ANOTHER VERSION'}</button></section>}

        <p className="text-center text-xs text-[#626262] mt-7">Your prompt sets the direction. Choose the format, dial in the look, and generate something new.</p>
        <ins className="adsbygoogle block w-full mt-6" style={{ display: 'block' }} data-ad-client="ca-pub-9616956000265389" data-ad-slot="YOUR_SLOT_ID" data-ad-format="auto" data-full-width-responsive="true" />
      </div>
    </main>
  );
}
