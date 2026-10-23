'use client';
import { useEffect, useState } from 'react';

const styleOptions = ['Follow my prompt', 'Photorealistic', '3D CGI', 'Anime', 'Dark / cinematic', 'Fantasy', 'Sci-fi', 'Horror', 'Product photo', 'Fashion editorial', 'Watercolor', 'Pixel art'];

export default function GhostModeGenerator() {
  const [prompt, setPrompt] = useState('A glass greenhouse floating above a stormy ocean at sunset');
  const [style, setStyle] = useState('Follow my prompt');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.querySelectorAll('.adsbygoogle').forEach(() => {
      try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); }
      catch (error) { console.error('AdSense initialization failed:', error); }
    });
  }, []);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true); setImage(null); setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), style })
      });
      const data = await res.json();
      if (!res.ok || !data.imageBase64) { setError(data.error || 'Image generation failed. Please try again.'); return; }
      setImage(`data:${data.mimeType || 'image/jpeg'};base64,${data.imageBase64}`);
    } catch {
      setError('Could not reach the generator. Check your connection and try again.');
    } finally { setLoading(false); }
  };

  const surpriseMe = () => {
    const ideas = [
      'A tiny astronaut tending a garden inside a giant glass skull',
      'An abandoned neon diner in the middle of a red desert, midnight rain',
      'A crystal whale swimming through clouds above an ancient city',
      'A luxury sneaker made from translucent ice and wildflowers, macro detail',
      'A bioluminescent forest growing inside a forgotten underground train station',
      'A miniature moon cracked open to reveal a glowing ocean',
      'A chrome motorcycle parked outside a retro-futurist motel at dawn',
      'A surreal portrait made of folded paper, flowers and liquid gold',
      'A cozy cabin perched on the back of a gigantic turtle crossing a lake',
      'A glass greenhouse floating above a stormy ocean at sunset'
    ];
    setPrompt(ideas[Math.floor(Math.random() * ideas.length)]);
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#F2F0E9] px-4 py-6 sm:p-6">
      <div className="max-w-xl mx-auto">
        <ins className="adsbygoogle block w-full" style={{ display: 'block' }} data-ad-client="ca-pub-9616956000265389" data-ad-slot="YOUR_SLOT_ID" data-ad-format="auto" data-full-width-responsive="true" />
        <header className="flex items-center gap-3 my-7">
          <div className="w-10 h-10 shrink-0 rounded-full bg-[#D4FF32] text-black flex items-center justify-center font-black text-lg">G</div>
          <div><h1 className="font-black tracking-tight text-xl">GHOST MODE</h1><p className="text-xs text-[#929292]">AI IMAGE STUDIO · MAKE EVERY IDEA DIFFERENT</p></div>
          <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-[#202020] text-[#D4FF32]">IMAGE LAB</span>
        </header>

        <label htmlFor="prompt" className="block text-sm font-bold mb-2">Describe what you want to create</label>
        <textarea id="prompt" value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full min-h-32 bg-[#141414] border border-[#303030] rounded-2xl p-4 text-sm leading-6 focus:border-[#D4FF32] outline-none" placeholder="A robot chef cooking ramen in a rainy Tokyo alley..." maxLength={4000} />
        <button type="button" onClick={surpriseMe} className="mt-2 text-xs text-[#D4FF32] underline underline-offset-4">Surprise me with a new idea</button>

        <label htmlFor="style" className="block text-sm font-bold mt-5 mb-2">Visual style</label>
        <select id="style" value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-[#141414] border border-[#303030] rounded-xl p-3 text-sm text-white focus:border-[#D4FF32] outline-none">
          {styleOptions.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
        <p className="text-xs text-[#929292] mt-2">“Follow my prompt” lets your idea lead instead of forcing every image into one look.</p>

        <button onClick={generate} disabled={loading || !prompt.trim()} className="w-full mt-5 h-14 rounded-full bg-[#D4FF32] text-black font-black tracking-widest disabled:opacity-50">{loading ? 'CREATING YOUR IMAGE…' : 'GENERATE IMAGE'}</button>
        {error && <p role="alert" className="mt-4 p-3 rounded-xl border border-red-900 bg-red-950/40 text-sm text-red-200">{error}</p>}

        {image && <section className="mt-6 rounded-3xl overflow-hidden border border-[#292929] bg-[#141414] p-2">
          <img src={image} alt={prompt} className="w-full rounded-2xl" />
          <div className="p-3 flex items-center justify-between gap-3"><span className="text-xs text-[#A8A5A0]">{style} · Generated image</span><a href={image} download="ghost-mode-image.jpg" className="text-xs font-bold bg-[#D4FF32] text-black px-4 py-2 rounded-full">Download image</a></div>
          <button onClick={generate} disabled={loading} className="w-full mt-1 mb-2 h-11 rounded-full border border-[#444] text-sm font-bold disabled:opacity-50">{loading ? 'GENERATING…' : 'TRY ANOTHER VERSION'}</button>
        </section>}

        <p className="text-center text-xs text-[#626262] mt-7">Your prompt sets the direction. Style controls shape the look. Each generation gets a fresh variation.</p>
        <ins className="adsbygoogle block w-full mt-6" style={{ display: 'block' }} data-ad-client="ca-pub-9616956000265389" data-ad-slot="YOUR_SLOT_ID" data-ad-format="auto" data-full-width-responsive="true" />
      </div>
    </main>
  );
}
