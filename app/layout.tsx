import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://ghost-mode-v5-1.onrender.com"),
  title: { default: "Ghost Mode Studio — AI Image & Video Creation", template: "%s | Ghost Mode Studio" },
  description: "Turn written ideas into AI-assisted images and short videos. Explore prompt-writing techniques, creative workflows, and practical guidance in Ghost Mode Studio.",
  applicationName: "Ghost Mode Studio",
  keywords: ["AI image generator", "AI video generator", "creative studio", "prompt writing", "visual storytelling"],
  openGraph: { title: "Ghost Mode Studio — Make Ideas Visible", description: "An independent creative workspace for experimenting with image and short-video prompts.", type: "website", siteName: "Ghost Mode Studio" },
  robots: { index: true, follow: true },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head><link rel="manifest" href="/manifest.json" /><meta name="theme-color" content="#d4ff32" /><meta name="color-scheme" content="dark" /></head><body>{children}</body></html>;
}