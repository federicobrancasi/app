// frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import MainLayout from '@/components/layout/MainLayout';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'VisionGuard AI - Intelligent CCTV Monitoring',
  description: 'Advanced AI-powered surveillance system with real-time monitoring and intelligent event detection powered by Claude AI',
  keywords: ['CCTV', 'AI', 'surveillance', 'security', 'monitoring', 'Claude AI'],
  authors: [{ name: 'VisionGuard Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#1f2937',
  openGraph: {
    title: 'VisionGuard AI - Intelligent CCTV Monitoring',
    description: 'Advanced AI-powered surveillance system with real-time monitoring',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1f2937" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  );
}

// frontend/src/app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 17 24 39; /* gray-900 */
    --foreground: 243 244 246; /* gray-100 */
    --card: 31 41 55; /* gray-800 */
    --card-foreground: 243 244 246;
    --popover: 31 41 55;
    --popover-foreground: 243 244 246;
    --primary: 59 130 246; /* blue-500 */
    --primary-foreground: 255 255 255;
    --secondary: 55 65 81; /* gray-700 */
    --secondary-foreground: 243 244 246;
    --muted: 55 65 81;
    --muted-foreground: 156 163 175; /* gray-400 */
    --accent: 79 70 229; /* indigo-600 */
    --accent-foreground: 255 255 255;
    --destructive: 239 68 68; /* red-500 */
    --destructive-foreground: 255 255 255;
    --border: 55 65 81; /* gray-700 */
    --input: 55 65 81;
    --ring: 59 130 246;
    --radius: 0.75rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
  
  html {
    scroll-behavior: smooth;
  }
}

/* Custom scrollbar styles */
@layer utilities {
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: rgb(75 85 99) rgb(31 41 55);
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: rgb(31 41 55);
    border-radius: 3px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgb(75 85 99);
    border-radius: 3px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: rgb(107 114 128);
  }
}

/* Animation utilities */
@layer utilities {
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .animate-slide-up {
    animation: slideUp 0.3s ease-out;
  }
  
  .animate-pulse-glow {
    animation: pulseGlow 2s infinite;
  }
  
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 3s ease infinite;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.8);
  }
}

@keyframes gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Video and camera specific styles */
@layer components {
  .video-container {
    @apply relative bg-black rounded-xl overflow-hidden;
  }
  
  .video-overlay {
    @apply absolute inset-0 pointer-events-none;
    background: linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.1) 0%,
      transparent 50%,
      rgba(255, 255, 255, 0.05) 100%
    );
  }
  
  .glass {
    @apply bg-white/5 backdrop-blur-xl border border-white/10;
  }
  
  .glass-dark {
    @apply bg-black/20 backdrop-blur-xl border border-white/5;
  }
  
  .gradient-text {
    @apply bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent;
  }
  
  .gradient-border {
    @apply relative;
  }
  
  .gradient-border::before {
    @apply absolute inset-0 rounded-xl p-[1px] bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500;
    content: '';
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
  }
}

/* Focus styles */
@layer utilities {
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900;
  }
  
  .focus-ring-inset {
    @apply focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-inset;
  }
}

/* Loading and skeleton styles */
@layer components {
  .skeleton {
    @apply animate-pulse bg-gray-700/50 rounded;
  }
  
  .loading-dots {
    @apply inline-flex space-x-1;
  }
  
  .loading-dots > div {
    @apply w-2 h-2 bg-current rounded-full animate-pulse;
  }
  
  .loading-dots > div:nth-child(1) {
    animation-delay: 0ms;
  }
  
  .loading-dots > div:nth-child(2) {
    animation-delay: 150ms;
  }
  
  .loading-dots > div:nth-child(3) {
    animation-delay: 300ms;
  }
}

/* Status indicators */
@layer components {
  .status-online {
    @apply w-2 h-2 bg-green-400 rounded-full animate-pulse;
  }
  
  .status-offline {
    @apply w-2 h-2 bg-red-400 rounded-full;
  }
  
  .status-warning {
    @apply w-2 h-2 bg-yellow-400 rounded-full animate-pulse;
  }
  
  .status-badge {
    @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
  }
  
  .status-badge.online {
    @apply bg-green-100 text-green-800;
  }
  
  .status-badge.offline {
    @apply bg-red-100 text-red-800;
  }
  
  .status-badge.warning {
    @apply bg-yellow-100 text-yellow-800;
  }
}