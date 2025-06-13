// frontend/src/app/monitor/page.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  VideoOff,
  Maximize,
  Minimize,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Settings,
  Eye,
  EyeOff,
  Zap,
  AlertTriangle,
  CheckCircle,
  Grid3X3,
  Grid2X2,
  RotateCcw,
  Download,
  Camera,
  Activity
} from 'lucide-react';

interface Camera {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'warning';
  url: string;
  recording: boolean;
  aiAnalysisEnabled: boolean;
  lastActivity?: string;
  resolution: string;
  fps: number;
}

interface AIDetection {
  id: string;
  cameraId: string;
  type: 'person' | 'vehicle' | 'object' | 'motion';
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
}

// Sample camera data
const sampleCameras: Camera[] = [
  {
    id: 'cam1',
    name: 'Front Entrance',
    location: 'Main Building',
    status: 'online',
    url: '/api/streams/cam1',
    recording: true,
    aiAnalysisEnabled: true,
    lastActivity: '2 minutes ago',
    resolution: '1920x1080',
    fps: 30
  },
  {
    id: 'cam2',
    name: 'Parking Lot',
    location: 'Outdoor',
    status: 'online',
    url: '/api/streams/cam2',
    recording: true,
    aiAnalysisEnabled: true,
    lastActivity: '5 minutes ago',
    resolution: '1920x1080',
    fps: 25
  },
  {
    id: 'cam3',
    name: 'Warehouse',
    location: 'Building B',
    status: 'warning',
    url: '/api/streams/cam3',
    recording: false,
    aiAnalysisEnabled: true,
    lastActivity: '1 hour ago',
    resolution: '1280x720',
    fps: 15
  },
  {
    id: 'cam4',
    name: 'Office Hallway',
    location: 'Floor 2',
    status: 'online',
    url: '/api/streams/cam4',
    recording: true,
    aiAnalysisEnabled: false,
    lastActivity: 'Just now',
    resolution: '1920x1080',
    fps: 30
  },
  {
    id: 'cam5',
    name: 'Reception',
    location: 'Main Building',
    status: 'offline',
    url: '/api/streams/cam5',
    recording: false,
    aiAnalysisEnabled: true,
    lastActivity: '30 minutes ago',
    resolution: '1920x1080',
    fps: 30
  },
  {
    id: 'cam6',
    name: 'Loading Dock',
    location: 'Building C',
    status: 'online',
    url: '/api/streams/cam6',
    recording: true,
    aiAnalysisEnabled: true,
    lastActivity: '8 minutes ago',
    resolution: '1280x720',
    fps: 20
  }
];

export default function LiveMonitorPage() {
  const [cameras, setCameras] = useState<Camera[]>(sampleCameras);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [gridLayout, setGridLayout] = useState<'2x2' | '3x3' | '4x4'>('2x2');
  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(null);
  const [showAIOverlay, setShowAIOverlay] = useState(true);
  const [detections, setDetections] = useState<AIDetection[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Simulate real-time AI detections
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Simulate new detection
      const randomCamera = cameras[Math.floor(Math.random() * cameras.length)];
      if (randomCamera.status === 'online' && randomCamera.aiAnalysisEnabled) {
        const newDetection: AIDetection = {
          id: `det_${Date.now()}`,
          cameraId: randomCamera.id,
          type: ['person', 'vehicle', 'motion'][Math.floor(Math.random() * 3)] as any,
          confidence: Math.round((Math.random() * 30 + 70)),
          boundingBox: {
            x: Math.random() * 300,
            y: Math.random() * 200,
            width: 50 + Math.random() * 100,
            height: 80 + Math.random() * 120
          },
          description: 'Movement detected in frame',
          timestamp: new Date(),
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any
        };

        setDetections(prev => [newDetection, ...prev.slice(0, 19)]); // Keep last 20
      }
    }, 5000 + Math.random() * 10000); // Random interval 5-15 seconds

    return () => clearInterval(interval);
  }, [cameras, autoRefresh]);

  const getGridCols = () => {
    switch (gridLayout) {
      case '2x2': return 'grid-cols-2';
      case '3x3': return 'grid-cols-3';
      case '4x4': return 'grid-cols-4';
      default: return 'grid-cols-2';
    }
  };

  const getCameraDetections = (cameraId: string) => {
    return detections.filter(d => d.cameraId === cameraId);
  };

  const getStatusColor = (status: Camera['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleCameraClick = (cameraId: string) => {
    setSelectedCamera(selectedCamera === cameraId ? null : cameraId);
  };

  const toggleFullscreen = (cameraId: string) => {
    setFullscreenCamera(fullscreenCamera === cameraId ? null : cameraId);
  };

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Monitor</h1>
          <p className="text-gray-400 mt-1">
            Real-time surveillance with AI-powered detection
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-800 rounded-xl p-2">
            <button
              onClick={() => setGridLayout('2x2')}
              className={`p-2 rounded-lg transition-colors ${
                gridLayout === '2x2' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid2X2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setGridLayout('3x3')}
              className={`p-2 rounded-lg transition-colors ${
                gridLayout === '3x3' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => setShowAIOverlay(!showAIOverlay)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
              showAIOverlay 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">AI Overlay</span>
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
              autoRefresh 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">Auto Refresh</span>
          </button>
        </div>
      </div>

      {/* Fullscreen View */}
      <AnimatePresence>
        {fullscreenCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          >
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 bg-black/50">
                <h3 className="text-xl font-semibold text-white">
                  {cameras.find(c => c.id === fullscreenCamera)?.name}
                </h3>
                <button
                  onClick={() => setFullscreenCamera(null)}
                  className="p-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white transition-colors"
                >
                  <Minimize className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 p-4">
                <CameraFeed
                  camera={cameras.find(c => c.id === fullscreenCamera)!}
                  detections={getCameraDetections(fullscreenCamera)}
                  showAIOverlay={showAIOverlay}
                  fullscreen
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Grid */}
      <div className={`grid ${getGridCols()} gap-6`}>
        {cameras.map((camera) => (
          <motion.div
            key={camera.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-3"
          >
            <CameraFeed
              camera={camera}
              detections={getCameraDetections(camera.id)}
              showAIOverlay={showAIOverlay}
              selected={selectedCamera === camera.id}
              onClick={() => handleCameraClick(camera.id)}
              onFullscreen={() => toggleFullscreen(camera.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Recent Detections Panel */}
      {detections.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Recent AI Detections</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {detections.slice(0, 10).map((detection) => (
              <div
                key={detection.id}
                className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    detection.severity === 'high' ? 'bg-red-400' :
                    detection.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {cameras.find(c => c.id === detection.cameraId)?.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {detection.type} detected ({detection.confidence}% confidence)
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {detection.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Camera Feed Component
interface CameraFeedProps {
  camera: Camera;
  detections: AIDetection[];
  showAIOverlay: boolean;
  selected?: boolean;
  fullscreen?: boolean;
  onClick?: () => void;
  onFullscreen?: () => void;
}

function CameraFeed({ 
  camera, 
  detections, 
  showAIOverlay, 
  selected, 
  fullscreen,
  onClick, 
  onFullscreen 
}: CameraFeedProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div 
      className={`relative bg-black rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
        selected ? 'border-blue-500' : 'border-gray-700 hover:border-gray-600'
      } ${fullscreen ? 'h-full' : 'aspect-video'}`}
      onClick={onClick}
    >
      {/* Camera Status Indicator */}
      <div className="absolute top-3 left-3 z-20 flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(camera.status)} ${
          camera.status === 'online' ? 'animate-pulse' : ''
        }`} />
        <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
          {camera.name}
        </span>
      </div>

      {/* Controls */}
      <div className="absolute top-3 right-3 z-20 flex items-center space-x-1">
        {camera.recording && (
          <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
        {camera.aiAnalysisEnabled && (
          <div className="p-1 bg-purple-600 rounded">
            <Zap className="h-3 w-3 text-white" />
          </div>
        )}
        {!fullscreen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen?.();
            }}
            className="p-1 bg-black/50 rounded hover:bg-black/70 transition-colors"
          >
            <Maximize className="h-3 w-3 text-white" />
          </button>
        )}
      </div>

      {/* Video Feed */}
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        {camera.status === 'online' ? (
          <div className="relative w-full h-full">
            {/* Simulated video feed with colored background */}
            <div className={`w-full h-full ${
              camera.id === 'cam1' ? 'bg-gradient-to-br from-blue-900 to-blue-700' :
              camera.id === 'cam2' ? 'bg-gradient-to-br from-green-900 to-green-700' :
              camera.id === 'cam3' ? 'bg-gradient-to-br from-purple-900 to-purple-700' :
              camera.id === 'cam4' ? 'bg-gradient-to-br from-orange-900 to-orange-700' :
              camera.id === 'cam5' ? 'bg-gradient-to-br from-red-900 to-red-700' :
              'bg-gradient-to-br from-indigo-900 to-indigo-700'
            } flex items-center justify-center`}>
              <div className="text-center">
                <Camera className="h-12 w-12 text-white/30 mx-auto mb-2" />
                <p className="text-white/50 text-sm">Live Feed</p>
                <p className="text-white/30 text-xs">{camera.resolution} • {camera.fps}fps</p>
              </div>
            </div>

            {/* AI Detection Overlays */}
            {showAIOverlay && detections.map((detection) => (
              <motion.div
                key={detection.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute border-2 border-red-500 bg-red-500/20 rounded"
                style={{
                  left: `${detection.boundingBox.x}px`,
                  top: `${detection.boundingBox.y}px`,
                  width: `${detection.boundingBox.width}px`,
                  height: `${detection.boundingBox.height}px`,
                }}
              >
                <div className="absolute -top-6 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  {detection.type} {detection.confidence}%
                </div>
              </motion.div>
            ))}
          </div>
        ) : camera.status === 'offline' ? (
          <div className="text-center">
            <VideoOff className="h-12 w-12 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Camera Offline</p>
          </div>
        ) : (
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
            <p className="text-yellow-500 text-sm">Connection Issues</p>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className="p-1 bg-black/50 rounded hover:bg-black/70 transition-colors"
          >
            {isPlaying ? 
              <Pause className="h-3 w-3 text-white" /> : 
              <Play className="h-3 w-3 text-white" />
            }
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="p-1 bg-black/50 rounded hover:bg-black/70 transition-colors"
          >
            {isMuted ? 
              <VolumeX className="h-3 w-3 text-white" /> : 
              <Volume2 className="h-3 w-3 text-white" />
            }
          </button>
        </div>

        <div className="text-xs text-white bg-black/50 px-2 py-1 rounded">
          {camera.lastActivity}
        </div>
      </div>
    </div>
  );
}