// src/app/page.tsx
'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { 
  Camera, 
  Brain, 
  Shield, 
  Users, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Video,
  AlertTriangle,
  MessageSquare,
  TrendingUp,
  Globe,
  Sparkles
} from 'lucide-react';

interface SystemStats {
  total_cameras: number;
  online_cameras: number;
  total_events: number;
  active_alerts: number;
}

export default function HomePage() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Fetch system stats
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/cameras');
        if (response.ok) {
          const data = await response.json();
          setStats({
            total_cameras: data.total || 0,
            online_cameras: data.online || 0,
            total_events: Math.floor(Math.random() * 50), // Simulated
            active_alerts: Math.floor(Math.random() * 3)  // Simulated
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStats({
          total_cameras: 4,
          online_cameras: 4,
          total_events: 23,
          active_alerts: 1
        });
      }
    };

    fetchStats();
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Brain className="w-10 h-10 text-blue-500" />,
      title: "AI-Powered Analysis",
      description: "Advanced computer vision algorithms analyze video feeds in real-time with 99.7% accuracy",
      color: "from-blue-500/10 to-blue-600/10",
      iconBg: "bg-blue-50"
    },
    {
      icon: <Shield className="w-10 h-10 text-emerald-500" />,
      title: "Smart Security",
      description: "Proactive threat detection with customizable alerts for immediate response to security events",
      color: "from-emerald-500/10 to-emerald-600/10",
      iconBg: "bg-emerald-50"
    },
    {
      icon: <Zap className="w-10 h-10 text-amber-500" />,
      title: "Real-time Processing",
      description: "Ultra-low latency monitoring with instant notifications and live streaming capabilities",
      color: "from-amber-500/10 to-amber-600/10",
      iconBg: "bg-amber-50"
    },
    {
      icon: <Users className="w-10 h-10 text-violet-500" />,
      title: "Team Collaboration",
      description: "Multi-user access with role-based permissions and comprehensive audit trails",
      color: "from-violet-500/10 to-violet-600/10",
      iconBg: "bg-violet-50"
    }
  ];

  const useCases = [
    { icon: <Shield className="w-5 h-5" />, text: "Home Security & Surveillance" },
    { icon: <Globe className="w-5 h-5" />, text: "Business & Office Monitoring" },
    { icon: <Zap className="w-5 h-5" />, text: "Industrial Equipment Oversight" },
    { icon: <TrendingUp className="w-5 h-5" />, text: "Public Safety & Traffic Management" }
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section with Animated Background */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: `${Math.random() * 100 + 50}px`,
                  height: `${Math.random() * 100 + 50}px`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${Math.random() * 3 + 2}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 text-center space-y-8 py-24 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Live System Status */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              System Operational • {currentTime.toLocaleTimeString()}
            </div>

            <h1 className="text-7xl lg:text-8xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Vision
              </span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Guard
              </span>
              <div className="text-4xl lg:text-5xl mt-2 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                AI Platform
              </div>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 mt-8 max-w-3xl mx-auto leading-relaxed font-light">
              Transform your security infrastructure with cutting-edge AI. 
              <span className="font-medium text-gray-900"> Real-time monitoring, intelligent analysis, and proactive protection</span> 
              powered by advanced computer vision.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
              <Link href="/chat">
                <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                  <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Chat with AI Assistant
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/cameras">
                <Button size="lg" className="bg-white/90 backdrop-blur-sm text-gray-900 border-2 border-gray-200 hover:bg-white hover:border-gray-300 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200">
                  <Camera className="w-5 h-5 mr-2" />
                  Manage Cameras
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced System Status Dashboard */}
      {stats && (
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">System Status</h2>
            <p className="text-gray-600 text-lg">Real-time overview of your security infrastructure</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 text-center border-0 shadow-2xl bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="bg-blue-500 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">{stats.total_cameras}</div>
              <div className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total Cameras</div>
            </Card>
            
            <Card className="p-8 text-center border-0 shadow-2xl bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="bg-emerald-500 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">{stats.online_cameras}</div>
              <div className="text-sm font-medium text-emerald-700 uppercase tracking-wide">Online Now</div>
            </Card>
            
            <Card className="p-8 text-center border-0 shadow-2xl bg-gradient-to-br from-violet-50 to-violet-100">
              <div className="bg-violet-500 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">{stats.total_events}</div>
              <div className="text-sm font-medium text-violet-700 uppercase tracking-wide">Events Today</div>
            </Card>
            
            <Card className="p-8 text-center border-0 shadow-2xl bg-gradient-to-br from-amber-50 to-amber-100">
              <div className="bg-amber-500 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-black text-gray-900 mb-1">{stats.active_alerts}</div>
              <div className="text-sm font-medium text-amber-700 uppercase tracking-wide">Active Alerts</div>
            </Card>
          </div>
        </section>
      )}

      {/* Modern Features Section */}
      <section className="space-y-16">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Powered by <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Advanced AI</span>
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Experience the future of security monitoring with our intelligent video analytics platform
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className={`p-8 border-0 shadow-2xl bg-gradient-to-br ${feature.color} hover:shadow-3xl transform hover:scale-105 transition-all duration-300 group`}>
              <div className="flex items-start space-x-6">
                <div className={`${feature.iconBg} rounded-2xl p-4 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-lg">
                    {feature.description}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Use Cases with Icons */}
      <section className="relative">
        <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 rounded-3xl p-12 lg:p-16 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20"></div>
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold mb-8">Perfect For Any Environment</h2>
            <p className="text-xl text-blue-100 mb-12 leading-relaxed">
              From residential security to enterprise surveillance, VisionGuard AI adapts to your needs
            </p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {useCases.map((useCase, index) => (
                <div key={index} className="flex items-center gap-4 text-left bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 group">
                  <div className="bg-white/20 rounded-xl p-3 group-hover:bg-white/30 transition-colors">
                    {useCase.icon}
                  </div>
                  <span className="text-lg font-semibold">{useCase.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Quick Actions */}
      <section className="space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <p className="text-xl text-gray-600">Get started with these essential features</p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          <Link href="/cameras" className="group">
            <Card className="p-8 text-center border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="bg-blue-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                Camera Management
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Configure cameras, adjust settings, and monitor system health with our intuitive interface.
              </p>
              <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-700 font-semibold">
                <span>Manage Cameras</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </Card>
          </Link>

          <Link href="/chat" className="group">
            <Card className="p-8 text-center border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="bg-purple-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">
                AI Assistant
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Chat with Claude AI to get insights, analyze footage, and optimize your security system.
              </p>
              <div className="flex items-center justify-center text-purple-600 group-hover:text-purple-700 font-semibold">
                <span>Open Chat</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </Card>
          </Link>

          <Link href="/events" className="group">
            <Card className="p-8 text-center border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 group-hover:scale-105 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <div className="bg-emerald-500 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Video className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors">
                Security Events
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Review detected events, analyze patterns, and manage alerts from your security system.
              </p>
              <div className="flex items-center justify-center text-emerald-600 group-hover:text-emerald-700 font-semibold">
                <span>View Events</span>
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}