// frontend/src/app/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Video,
  Shield,
  AlertTriangle,
  Activity,
  Users,
  Eye,
  Zap,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info
} from 'lucide-react';

// Types
interface DashboardStats {
  activeCameras: number;
  totalCameras: number;
  alertsToday: number;
  eventsToday: number;
  systemUptime: string;
  aiAnalyses: number;
}

interface RecentEvent {
  id: number;
  type: 'motion' | 'alert' | 'system' | 'ai_detection';
  camera: string;
  description: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  thumbnail?: string;
}

interface SystemStatus {
  database: 'online' | 'offline';
  aiService: 'online' | 'offline';
  cameras: 'online' | 'offline';
  websocket: 'online' | 'offline';
}

// Sample data - will be replaced with real API calls
const sampleStats: DashboardStats = {
  activeCameras: 8,
  totalCameras: 10,
  alertsToday: 3,
  eventsToday: 24,
  systemUptime: '99.8%',
  aiAnalyses: 156
};

const sampleEvents: RecentEvent[] = [
  {
    id: 1,
    type: 'motion',
    camera: 'Front Entrance',
    description: 'Person detected at main entrance',
    timestamp: '2 minutes ago',
    severity: 'info'
  },
  {
    id: 2,
    type: 'alert',
    camera: 'Parking Lot',
    description: 'Vehicle parked in restricted area',
    timestamp: '15 minutes ago',
    severity: 'warning'
  },
  {
    id: 3,
    type: 'ai_detection',
    camera: 'Warehouse',
    description: 'Unusual activity detected by AI',
    timestamp: '32 minutes ago',
    severity: 'error'
  },
  {
    id: 4,
    type: 'system',
    camera: 'Camera 3',
    description: 'Camera connection restored',
    timestamp: '1 hour ago',
    severity: 'success'
  }
];

const sampleSystemStatus: SystemStatus = {
  database: 'online',
  aiService: 'online',
  cameras: 'online',
  websocket: 'online'
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(sampleStats);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>(sampleEvents);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(sampleSystemStatus);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Monitor your surveillance system in real-time
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">
            {currentTime.toLocaleDateString()}
          </div>
          <div className="text-lg font-mono text-white">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Active Cameras"
          value={`${stats.activeCameras}/${stats.totalCameras}`}
          icon={Video}
          iconColor="text-blue-400"
          bgColor="bg-blue-500/10"
          trend="+2 from yesterday"
        />
        <StatsCard
          title="Alerts Today"
          value={stats.alertsToday.toString()}
          icon={AlertTriangle}
          iconColor="text-orange-400"
          bgColor="bg-orange-500/10"
          trend="-1 from yesterday"
        />
        <StatsCard
          title="Events Detected"
          value={stats.eventsToday.toString()}
          icon={Activity}
          iconColor="text-green-400"
          bgColor="bg-green-500/10"
          trend="+5 from yesterday"
        />
        <StatsCard
          title="AI Analyses"
          value={stats.aiAnalyses.toString()}
          icon={Zap}
          iconColor="text-purple-400"
          bgColor="bg-purple-500/10"
          trend="+12 from yesterday"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Events */}
        <div className="lg:col-span-2">
          <RecentEventsCard events={recentEvents} />
        </div>

        {/* System Status */}
        <div className="space-y-6">
          <SystemStatusCard status={systemStatus} uptime={stats.systemUptime} />
          <QuickActionsCard />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CameraStatusGrid />
        <ActivityFeedCard />
      </div>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  trend?: string;
}

function StatsCard({ title, value, icon: Icon, iconColor, bgColor, trend }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </motion.div>
  );
}

// Recent Events Card
function RecentEventsCard({ events }: { events: RecentEvent[] }) {
  const getSeverityIcon = (severity: RecentEvent['severity']) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-orange-400" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  const getSeverityBg = (severity: RecentEvent['severity']) => {
    switch (severity) {
      case 'error': return 'bg-red-500/10 border-red-500/20';
      case 'warning': return 'bg-orange-500/10 border-orange-500/20';
      case 'success': return 'bg-green-500/10 border-green-500/20';
      default: return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Recent Events</h3>
        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
          View All
        </button>
      </div>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className={`p-4 border rounded-lg ${getSeverityBg(event.severity)}`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {getSeverityIcon(event.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">{event.camera}</p>
                  <span className="text-xs text-gray-400">{event.timestamp}</span>
                </div>
                <p className="text-sm text-gray-300 mt-1">{event.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// System Status Card
function SystemStatusCard({ status, uptime }: { status: SystemStatus; uptime: string }) {
  const getStatusIcon = (state: 'online' | 'offline') => {
    return state === 'online' 
      ? <CheckCircle className="h-4 w-4 text-green-400" />
      : <XCircle className="h-4 w-4 text-red-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Database</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.database)}
            <span className="text-xs text-gray-400 capitalize">{status.database}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">AI Service</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.aiService)}
            <span className="text-xs text-gray-400 capitalize">{status.aiService}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Cameras</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.cameras)}
            <span className="text-xs text-gray-400 capitalize">{status.cameras}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">WebSocket</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon(status.websocket)}
            <span className="text-xs text-gray-400 capitalize">{status.websocket}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Uptime</span>
          <span className="text-sm font-medium text-green-400">{uptime}</span>
        </div>
      </div>
    </motion.div>
  );
}

// Quick Actions Card
function QuickActionsCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className="space-y-2">
        <button className="w-full text-left p-3 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">
          <div className="flex items-center space-x-3">
            <Eye className="h-4 w-4 text-white" />
            <span className="text-sm font-medium text-white">View Live Feeds</span>
          </div>
        </button>
        <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
          <div className="flex items-center space-x-3">
            <Calendar className="h-4 w-4 text-gray-300" />
            <span className="text-sm font-medium text-gray-300">Schedule Report</span>
          </div>
        </button>
        <button className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
          <div className="flex items-center space-x-3">
            <Shield className="h-4 w-4 text-gray-300" />
            <span className="text-sm font-medium text-gray-300">Run System Check</span>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

// Camera Status Grid (placeholder)
function CameraStatusGrid() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">Camera Status</h3>
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((cam) => (
          <div key={cam} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-300">Camera {cam}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Activity Feed (placeholder)
function ActivityFeedCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4">AI Activity Feed</h3>
      <div className="space-y-3">
        {[
          "AI analyzed 15 frames from Front Entrance",
          "Motion detection active on all cameras",
          "Generated daily security report",
          "Updated detection algorithms"
        ].map((activity, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span className="text-sm text-gray-300">{activity}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}