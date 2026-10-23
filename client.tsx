'use client';
import { useEffect, useState } from 'react';
export default function GhostModeGenerator() {
  const [prompt, setPrompt] = useState('chrome liquid metal orb, studio lighting, black background, 8k CGI');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const ads = document.querySelectorAll('.adsbygoogle');
    ads.forEach(() => {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (error) {
        console.error('AdSense ad initialization failed:', error);
      }
    });
  }, []);
  const generate = async () => {
    setLoading(true); setImage(null);
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
    const data = await res.json();
    if (data.imageBase64) setImage(`data:${data.mimeType};base64,${data.imageBase64}`);
    else alert('Error: ' + data.error);
    setLoading(false);
  };
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F2F0E9] p-6 max-w-[480px] mx-auto">
      <ins className="adsbygoogle block w-full"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9616956000265389"
        data-ad-slot="YOUR_SLOT_ID"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-[#D4FF32] text-black flex items-center justify-center font-black">G</div>
        <h1 className="font-black tracking-tighter">GHOST MODE V4 - RENDER</h1>
        <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-[#D4FF32] text-black font-bold">RENDER + GEMINI FREE</span>
      </div>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} className="w-full h-24 bg-[#141414] border border-[#222] rounded-xl p-3 text-sm text-[#F2F0E9] focus:border-[#D4FF32] outline-none" placeholder="chrome liquid metal sculpture, faceless CGI..." />
      <button onClick={generate} disabled={loading} className="w-full mt-4 h-12 rounded-full bg-[#D4FF32] text-black font-black tracking-widest disabled:opacity-50">{loading ? 'GENERATING CGI...' : 'GENERATE FACeless CGI'}</button>
      <p className="text-[11px] text-[#6B6B6B] mt-3 text-center">Render Free + Gemini Free (1500/day) • No face, no voice</p>
      {image && (<div className="mt-6 rounded-[24px] overflow-hidden border border-[#222] bg-[#141414] p-2"><img src={image} className="w-full rounded-[16px]" /><div className="p-3 flex justify-between"><span className="text-xs text-[#A8A5A0]">Faceless CGI • Ready for Gumroad</span><a href={image} download="ghost-cgi.png" className="text-xs bg-[#222] px-3 py-1 rounded-full">Download PNG</a></div></div>)}
      <div className="mt-6 p-4 rounded-xl bg-[#141414] border border-[#222] text-xs"><p>Your AppLovin URLs (Render):</p><p className="text-[#D4FF32] mt-2 break-all">https://ghost-mode-v4.onrender.com/app-ads.txt</p><p className="text-[#D4FF32] break-all">https://ghost-mode-v4.onrender.com/privacy.html</p></div>
      <ins className="adsbygoogle block w-full mt-6"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9616956000265389"
        data-ad-slot="YOUR_SLOT_ID"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
