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
  Pause
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

// Mock video sources for different cameras
const videoSources = [
  '/videos/camera1.mp4',
  '/videos/camera2.mp4', 
  '/videos/camera3.mp4',
  '/videos/camera4.mp4'
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

const CameraCard = ({ camera, videoSrc }: { camera: Camera; videoSrc: string }) => {
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
                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4" />
                  View Analytics
                </button>
                <hr className="my-2" />
                <button className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-2 text-sm text-red-600">
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
          <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold border border-purple-200">
            <Shield className="w-3 h-3" />
            24/7 Recording
          </span>
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

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCameras()
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
      // Fallback to demo data if backend is not available
      setCameras([
        {
          id: 'cam1',
          name: 'Front Entrance',
          location: 'Main Building',
          status: 'connected',
          enabled: true,
          ai_enabled: true,
          motion_detection: true,
          url: ''
        },
        {
          id: 'cam2', 
          name: 'Parking Lot',
          location: 'East Side',
          status: 'connected',
          enabled: true,
          ai_enabled: true,
          motion_detection: true,
          url: ''
        },
        {
          id: 'cam3',
          name: 'Warehouse Floor',
          location: 'Building B',
          status: 'connected',
          enabled: true,
          ai_enabled: false,
          motion_detection: true,
          url: ''
        },
        {
          id: 'cam4',
          name: 'Emergency Exit',
          location: 'Rear Access',
          status: 'disconnected',
          enabled: true,
          ai_enabled: true,
          motion_detection: false,
          url: ''
        }
      ])
      setError('Using demo data - backend server not available')
    } finally {
      setLoading(false)
    }
  }

  const onlineCameras = cameras.filter(c => c.status === 'connected').length;
  const totalEvents = Math.floor(Math.random() * 50) + 20; // Simulated
  const aiDetections = Math.floor(Math.random() * 15) + 5; // Simulated

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
          {error && (
            <div className="mt-3 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 inline-block">
              {error}
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 flex items-center gap-2 px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="w-4 h-4" />
            Add New Camera
          </Button>
          <Button className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 flex items-center gap-2 px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
            <Settings className="w-4 h-4" />
            System Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 text-center border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="bg-blue-500 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <div className="text-2xl font-black text-gray-900 mb-1">{cameras.length}</div>
          <div className="text-sm font-medium text-blue-700 uppercase tracking-wide">Total Cameras</div>
        </Card>
        
        <Card className="p-6 text-center border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100">
          <div className="bg-green-500 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <div className="text-2xl font-black text-gray-900 mb-1">{onlineCameras}</div>
          <div className="text-sm font-medium text-green-700 uppercase tracking-wide">Online Now</div>
        </Card>
        
        <Card className="p-6 text-center border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="bg-purple-500 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div className="text-2xl font-black text-gray-900 mb-1">{totalEvents}</div>
          <div className="text-sm font-medium text-purple-700 uppercase tracking-wide">Events Today</div>
        </Card>
        
        <Card className="p-6 text-center border-0 shadow-xl bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="bg-amber-500 rounded-2xl w-14 h-14 flex items-center justify-center mx-auto mb-4">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div className="text-2xl font-black text-gray-900 mb-1">{aiDetections}</div>
          <div className="text-sm font-medium text-amber-700 uppercase tracking-wide">AI Detections</div>
        </Card>
      </div>

      {/* Cameras Grid */}
      {cameras.length === 0 ? (
        <Card className="text-center py-16 border-0 shadow-xl bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="max-w-md mx-auto">
            <div className="bg-gray-200 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Video className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Cameras Found</h3>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Get started by adding your first camera to the system. Our setup wizard will guide you through the process.
            </p>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 mx-auto px-8 py-3 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-200">
              <Plus className="w-5 h-5" />
              Add Your First Camera
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {cameras.map((camera, index) => (
              <CameraCard 
                key={camera.id} 
                camera={camera} 
                videoSrc={videoSources[index % videoSources.length]} 
              />
            ))}
          </div>
          
          {/* Footer Stats */}
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-8 bg-white rounded-2xl shadow-xl px-8 py-4 border-0">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{cameras.length}</div>
                <div className="text-sm text-gray-600">Total Cameras</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{onlineCameras}</div>
                <div className="text-sm text-gray-600">Online</div>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{cameras.filter(c => c.ai_enabled).length}</div>
                <div className="text-sm text-gray-600">AI Enabled</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}