import './globals.css';
import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BAFC Dashboard',
  description: 'MoM visualization',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <div className="w-full px-4 py-6">
          {children}
        </div>
      </body>
    </html>
  );
}
