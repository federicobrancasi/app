import '@/app/globals.css';
import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'VisionGuard AI',
  description: 'Real-time video monitoring and AI-powered events',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><MainLayout>{children}</MainLayout></body>
    </html>
  );
}
