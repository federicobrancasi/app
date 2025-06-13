import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-8">
      <h1 className="text-5xl font-extrabold">VisionGuard AI</h1>
      <p className="max-w-xl text-lg text-gray-600">
        Real-time camera monitoring powered by cutting-edge AI. Subscribe to camera feeds, receive
        instant alerts, and keep your environment secure.
      </p>
      <Link href="/monitor">
        <Button size="lg">Go to Monitor</Button>
      </Link>
    </section>
  );
}
