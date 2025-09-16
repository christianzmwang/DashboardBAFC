import './globals.css';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BAFC Dashboard',
  description: 'MoM visualization',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const ls = localStorage.getItem('theme'); const m = window.matchMedia('(prefers-color-scheme: dark)').matches; const dark = ls ? ls === 'dark' : m; const el = document.documentElement; if (dark) el.classList.add('dark'); else el.classList.remove('dark'); } catch(_) {} })();`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <div className="w-full px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
