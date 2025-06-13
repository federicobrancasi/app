'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <nav className="container mx-auto flex items-center justify-between">
          <Link href="/">VisionGuard AI</Link>
          <button onClick={()=>setOpen(o=>!o)}><Menu /></button>
          {open && (
            <div className="flex space-x-4">
              <Link href="/cameras">Cameras</Link>
              <Link href="/monitor?camera=cam1">Monitor</Link>
              <Link href="/events">Events</Link>
              <Link href="/chat">Chat</Link>
            </div>
          )}
        </nav>
      </header>
      <main className="flex-1 container mx-auto p-4">{children}</main>
      <footer className="bg-gray-100 text-center p-4">© VisionGuard AI 2025</footer>
    </div>
  );
}
