// src/app/page.tsx
'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { 
  Eye, 
  Camera, 
  Brain, 
  Shield, 
  Users, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Video,
  AlertTriangle
} from 'lucide-react';

interface SystemStats {
  total_cameras: number;
  online_cameras: number;
  total_events: number;
  active_alerts: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<SystemStats | null>(null);

  useEffect(() => {
    // Fetch system stats
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/cameras');
        if (response.ok) {
          const data = await response.json();
          setStats({
            total_cameras: data.total || 0,
            online_cameras: data.online || 0,
            total_events: 0, // This would come from events API
            active_alerts: 0  // This would come from alerts API
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Set default stats if backend is not available
        setStats({
          total_cameras: 2,
          online_cameras: 2,
          total_events: 0,
          active_alerts: 0
        });
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "AI-Powered Analysis",
      description: "Advanced computer vision and machine learning algorithms analyze your video feeds in real-time."
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: "Smart Security",
      description: "Proactive threat detection with customizable alerts for unusual activities and security breaches."
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-600" />,
      title: "Real-time Monitoring",
      description: "Instant notifications and live streaming with ultra-low latency for immediate response."
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "Multi-User Access",
      description: "Secure role-based access control for teams with granular permissions and audit trails."
    }
  ];

  const useCases = [
    "Home Security & Surveillance",
    "Business & Office Monitoring", 
    "Industrial Equipment Oversight",
    "Public Safety & Traffic Management"
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            VisionGuard AI
          </h1>
          <p className="text-xl text-gray-600 mt-6 max-w-2xl mx-auto leading-relaxed">
            Next-generation video surveillance powered by artificial intelligence. 
            Monitor, analyze, and secure your environment with cutting-edge computer vision technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/monitor">
              <Button size="lg" className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Eye className="w-5 h-5" />
                Start Monitoring
              </Button>
            </Link>
            <Link href="/cameras">
              <Button size="lg" className="bg-gray-600 hover:bg-gray-700 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Manage Cameras
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* System Status Dashboard */}
      {stats && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">System Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <Camera className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">{stats.total_cameras}</div>
              <div className="text-sm text-gray-600">Total Cameras</div>
            </Card>
            <Card className="text-center p-6">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">{stats.online_cameras}</div>
              <div className="text-sm text-gray-600">Online</div>
            </Card>
            <Card className="text-center p-6">
              <Video className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">{stats.total_events}</div>
              <div className="text-sm text-gray-600">Events Today</div>
            </Card>
            <Card className="text-center p-6">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <div className="text-2xl font-bold text-gray-900">{stats.active_alerts}</div>
              <div className="text-sm text-gray-600">Active Alerts</div>
            </Card>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Intelligent Video Analytics</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Harness the power of AI to transform your security infrastructure into a smart, 
            proactive monitoring system.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="text-center p-6 hover:shadow-xl transition-shadow">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 lg:p-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Perfect For Any Environment</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {useCases.map((useCase, index) => (
              <div key={index} className="flex items-center gap-3 text-left">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="text-gray-700 font-medium">{useCase}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-8">
        <h2 className="text-2xl font-bold text-center text-gray-900">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/cameras" className="group">
            <Card className="p-6 text-center hover:shadow-xl transition-all group-hover:scale-105">
              <Camera className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Camera Management</h3>
              <p className="text-gray-600 text-sm mb-4">
                Configure cameras, adjust settings, and monitor system health.
              </p>
              <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-700">
                <span className="text-sm font-medium">Manage Cameras</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/monitor" className="group">
            <Card className="p-6 text-center hover:shadow-xl transition-all group-hover:scale-105">
              <Eye className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Monitoring</h3>
              <p className="text-gray-600 text-sm mb-4">
                View real-time feeds and monitor all your cameras in one place.
              </p>
              <div className="flex items-center justify-center text-green-600 group-hover:text-green-700">
                <span className="text-sm font-medium">Start Monitoring</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>

          <Link href="/chat" className="group">
            <Card className="p-6 text-center hover:shadow-xl transition-all group-hover:scale-105">
              <Brain className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h3>
              <p className="text-gray-600 text-sm mb-4">
                Chat with Claude AI about your security system and get insights.
              </p>
              <div className="flex items-center justify-center text-purple-600 group-hover:text-purple-700">
                <span className="text-sm font-medium">Open Chat</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}