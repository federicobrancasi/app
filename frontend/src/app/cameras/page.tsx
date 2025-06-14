// src/app/cameras/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Eye, 
  Plus, 
  Settings, 
  Video, 
  AlertCircle, 
  CheckCircle, 
  Wifi,
  WifiOff,
  Brain,
  Camera,
  MoreVertical,
  Edit3,
  Trash2,
  Activity,
  Shield,
  Play,
  Pause,
  Bell,
  Clock,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react'

interface Camera {
  id: string;
  name: string;
  location?: string;
  status: 'connected' | 'disconnected' | 'error';
  enabled: boolean;
  ai_enabled: boolean;
  motion_detection: boolean;
  url: string;
}

interface CameraResponse {
  cameras: Record<string, Camera>;
  total: number;
  online: number;
}

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  cameraId?: string;
  read: boolean;
}

// Video sources for cameras
const videoSources = [
  '/videos/camera1.mp4',
  '/videos/camera2.mp4', 
  '/videos/camera3.mp4',
  '/videos/camera4.mp4'
];

// Demo cameras data
const demoCameras: Camera[] = [
  {
    id: 'cam1',
    name: 'Back Entrance',
    location: 'Your House',
    status: 'connected',
    enabled: true,
    ai_enabled: true,
    motion_detection: true,
    url: videoSources[0]
  },
  {
    id: 'cam2', 
    name: 'Front Entrance',
    location: 'Your House',
    status: 'connected',
    enabled: true,
    ai_enabled: true,
    motion_detection: true,
    url: videoSources[1]
  },
  {
    id: 'cam3',
    name: 'Back Entrance',
    location: 'Your House',
    status: 'connected',
    enabled: true,
    ai_enabled: true,
    motion_detection: true,
    url: videoSources[2]
  },
  {
    id: 'cam4',
    name: 'Front Entrance',
    location: 'Your House',
    status: 'connected',
    enabled: true,
    ai_enabled: true,
    motion_detection: true,
    url: videoSources[3]
  },
  {
    id: 'cam5',
    name: 'Emergency Exit',
    location: 'West Wing',
    status: 'disconnected',
    enabled: true,
    ai_enabled: false,
    motion_detection: false,
    url: ''
  },
  {
    id: 'cam6',
    name: 'Server Room',
    location: 'IT Department',
    status: 'error',
    enabled: true,
    ai_enabled: true,
    motion_detection: true,
    url: ''
  }
];

// Mock notifications for demo
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Motion Detected',
    message: 'Unusual activity detected in Front Entrance camera',
    timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    cameraId: 'cam1',
    read: false
  },
  {
    id: '2',
    type: 'warning',
    title: 'Camera Offline',
    message: 'Emergency Exit camera has lost connection',
    timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
    cameraId: 'cam5',
    read: false
  },
  {
    id: '3',
    type: 'info',
    title: 'AI Analysis Complete',
    message: 'Daily pattern analysis completed for Parking Lot',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    cameraId: 'cam2',
    read: true
  },
  {
    id: '4',
    type: 'alert',
    title: 'Perimeter Breach',
    message: 'Unauthorized person detected in Loading Dock area',
    timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    cameraId: 'cam4',
    read: false
  }
];

const CameraFeed = ({ src, cameraId, status }: { src: string; cameraId: string; status: string }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [error, setError] = useState(false);

  const handleVideoError = () => {
    setError(true);
  };

  const togglePlayback = () => {
    const video = document.getElementById(`video-${cameraId}`) as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (error || status !== 'connected') {
    return (
      <div className="w-full h-48 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-orange-500/10 animate-pulse"></div>
        <div className="text-center z-10">
          <WifiOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Camera Offline</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden group">
      <video
        id={`video-${cameraId}`}
        src={src}
        autoPlay
        loop
        muted
        className="w-full h-full object-cover"
        onError={handleVideoError}
      />
      
      {/* Overlay controls */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <button
          onClick={togglePlayback}
          className="bg-white/90 backdrop-blur-sm rounded-full p-3 hover:bg-white transition-colors"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6 text-gray-900" />
          ) : (
            <Play className="w-6 h-6 text-gray-900" />
          )}
        </button>
      </div>
      
      {/* Live indicator */}
      <div className="absolute top-3 left-3">
        <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          LIVE
        </div>
      </div>
      
      {/* Status indicator */}
      <div className="absolute top-3 right-3">
        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1">
          <Wifi className="w-3 h-3 text-green-400" />
          <span className="text-white text-xs font-medium">HD</span>
        </div>
      </div>
    </div>
  );
};

const CameraCard = ({ camera, videoSrc, onRemove }: { camera: Camera; videoSrc: string; onRemove: (cameraId: string) => void }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'disconnected': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'disconnected': return <AlertCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Online';
      case 'disconnected': return 'Offline'; 
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const handleRemoveCamera = () => {
    onRemove(camera.id);
    setShowMenu(false);
  };

  return (
    <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group bg-white">
      {/* Video Feed */}
      <CameraFeed src={videoSrc} cameraId={camera.id} status={camera.status} />
      
      {/* Camera Info */}
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">{camera.name}</h3>
            {camera.location && (
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Camera className="w-3 h-3" />
                {camera.location}
              </p>
            )}
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-10">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                  <Edit3 className="w-4 h-4" />
                  Edit Settings
                </button>
                <hr className="my-2" />
                <button 
                  onClick={handleRemoveCamera}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Camera
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Status Badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(camera.status)}`}>
          {getStatusIcon(camera.status)}
          {getStatusText(camera.status)}
        </div>
        
        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {camera.ai_enabled && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-200">
              <Brain className="w-3 h-3" />
              AI Detection
            </span>
          )}
          {camera.motion_detection && (
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-semibold border border-green-200">
              <Activity className="w-3 h-3" />
              Motion Alert
            </span>
          )}
          {(camera.id !== 'cam5' && camera.id !== 'cam6') && (
            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold border border-purple-200">
              <Shield className="w-3 h-3" />
              24/7 Recording
            </span>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link href={`/monitor?camera=${camera.id}`} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-2 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              <Eye className="w-4 h-4" />
              Monitor Live
            </Button>
          </Link>
          <Button 
            className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => setShowMenu(!showMenu)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

const NotificationCard = ({ notification }: { notification: Notification }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'alert': return 'border-l-red-500 bg-red-50/50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50/50';
      case 'info': return 'border-l-blue-500 bg-blue-50/50';
      default: return 'border-l-gray-500 bg-gray-50/50';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className={`p-4 border-l-4 rounded-lg ${getNotificationStyle(notification.type)} ${!notification.read ? 'bg-opacity-100' : 'bg-opacity-50'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatTime(notification.timestamp)}</span>
            {notification.cameraId && (
              <>
                <span>•</span>
                <span className="font-medium">{notification.cameraId.toUpperCase()}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCameras()
    
    // Simulate real-time notifications
    const interval = setInterval(() => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: Math.random() > 0.7 ? 'alert' : Math.random() > 0.5 ? 'warning' : 'info',
        title: 'AI Detection Update',
        message: 'New activity pattern detected in camera feed',
        timestamp: new Date(),
        cameraId: `cam${Math.floor(Math.random() * 4) + 1}`,
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 most recent
    }, 30000); // New notification every 30 seconds
    
    return () => clearInterval(interval);
  }, [])

  const fetchCameras = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:8000/api/cameras')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: CameraResponse = await response.json()
      setCameras(Object.values(data.cameras))
    } catch (err) {
      console.error('Failed to fetch cameras:', err)
      // Use demo data
      setCameras(demoCameras)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCamera = (cameraId: string) => {
    setCameras(prev => prev.filter(camera => camera.id !== cameraId));
  };

  const onlineCameras = cameras.filter(c => c.status === 'connected').length;
  const aiEnabledCameras = cameras.filter(c => c.ai_enabled).length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <Camera className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Cameras</h3>
          <p className="text-gray-600">Connecting to your security system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Camera Management</h1>
          <p className="text-xl text-gray-600">Monitor and manage your security cameras with AI-powered insights</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex items-center gap-2 px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="w-4 h-4" />
            Add New Camera
          </Button>
          <Link href="/settings">
            <Button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 flex items-center gap-2 px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              <Settings className="w-4 h-4" />
              System Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Left Section - Stats and Cameras */}
        <div className="xl:col-span-3 space-y-8">
          {/* Stats Overview - Smaller */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <div className="bg-blue-500 rounded-xl w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div className="text-xl font-black text-gray-900 mb-1">{cameras.length}</div>
              <div className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Cameras</div>
            </Card>
            
            <Card className="p-4 text-center border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
              <div className="bg-green-500 rounded-xl w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-xl font-black text-gray-900 mb-1">{onlineCameras}</div>
              <div className="text-xs font-medium text-green-700 uppercase tracking-wide">Online Now</div>
            </Card>
            
            <Card className="p-4 text-center border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <div className="bg-purple-500 rounded-xl w-10 h-10 flex items-center justify-center mx-auto mb-3">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="text-xl font-black text-gray-900 mb-1">{aiEnabledCameras}</div>
              <div className="text-xs font-medium text-purple-700 uppercase tracking-wide">AI Enabled</div>
            </Card>
          </div>

          {/* Cameras Grid - Narrower */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {cameras.map((camera, index) => (
              <CameraCard 
                key={camera.id} 
                camera={camera} 
                videoSrc={camera.status === 'connected' ? (camera.url || videoSources[index % videoSources.length]) : ''} 
                onRemove={handleRemoveCamera}
              />
            ))}
          </div>
        </div>

        {/* Right Section - Notifications - More Space */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-2xl bg-white h-fit">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  Live Alerts
                </h3>
                {unreadNotifications > 0 && (
                  <div className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {unreadNotifications}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">Real-time AI notifications</p>
            </div>
            
            <div className="max-h-[800px] overflow-y-auto">
              <div className="p-4 space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <NotificationCard key={notification.id} notification={notification} />
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-100">
              <Button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200">
                <Zap className="w-4 h-4 mr-2" />
                View All Events
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}