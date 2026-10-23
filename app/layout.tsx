import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GHOST MODE",
  description: "AI Streetwear Generator",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9616956000265389"
          crossOrigin="anonymous"
        ></script>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  );
}
