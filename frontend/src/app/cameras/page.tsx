// frontend/src/app/cameras/page.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Video,
  VideoOff,
  Wifi,
  WifiOff,
  Eye,
  EyeOff,
  RotateCcw,
  Download,
  Upload,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Camera,
  MapPin,
  Clock,
  Zap,
  Shield,
  Activity,
  Monitor,
  Play,
  Pause
} from 'lucide-react';

interface Camera {
  id: string;
  name: string;
  location: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  status: 'online' | 'offline' | 'error';
  type: 'ip' | 'usb' | 'rtsp';
  resolution: string;
  fps: number;
  recording: boolean;
  aiEnabled: boolean;
  motionDetection: boolean;
  nightVision: boolean;
  audioEnabled: boolean;
  storageLocation: string;
  retentionDays: number;
  createdAt: Date;
  lastSeen: Date;
  zones: DetectionZone[];
}

interface DetectionZone {
  id: string;
  name: string;
  coordinates: { x: number; y: number }[];
  enabled: boolean;
  sensitivity: number;
  alertTypes: string[];
}

const sampleCameras: Camera[] = [
  {
    id: 'cam1',
    name: 'Front Entrance',
    location: 'Main Building',
    ip: '192.168.1.100',
    port: 554,
    username: 'admin',
    password: '****',
    status: 'online',
    type: 'ip',
    resolution: '1920x1080',
    fps: 30,
    recording: true,
    aiEnabled: true,
    motionDetection: true,
    nightVision: true,
    audioEnabled: false,
    storageLocation: '/data/cam1',
    retentionDays: 30,
    createdAt: new Date('2024-01-15'),
    lastSeen: new Date(),
    zones: []
  },
  {
    id: 'cam2',
    name: 'Parking Lot',
    location: 'Outdoor',
    ip: '192.168.1.101',
    port: 554,
    username: 'admin',
    password: '****',
    status: 'online',
    type: 'ip',
    resolution: '1920x1080',
    fps: 25,
    recording: true,
    aiEnabled: true,
    motionDetection: true,
    nightVision: true,
    audioEnabled: true,
    storageLocation: '/data/cam2',
    retentionDays: 30,
    createdAt: new Date('2024-01-20'),
    lastSeen: new Date(Date.now() - 5 * 60000),
    zones: []
  },
  {
    id: 'cam3',
    name: 'Warehouse',
    location: 'Building B',
    ip: '192.168.1.102',
    port: 554,
    username: 'admin',
    password: '****',
    status: 'error',
    type: 'ip',
    resolution: '1280x720',
    fps: 15,
    recording: false,
    aiEnabled: true,
    motionDetection: false,
    nightVision: false,
    audioEnabled: false,
    storageLocation: '/data/cam3',
    retentionDays: 14,
    createdAt: new Date('2024-02-01'),
    lastSeen: new Date(Date.now() - 60 * 60000),
    zones: []
  }
];

export default function CameraManagementPage() {
  const [cameras, setCameras] = useState<Camera[]>(sampleCameras);
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'error'>('all');

  const filteredCameras = cameras.filter(camera => {
    const matchesSearch = camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         camera.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || camera.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddCamera = () => {
    setIsAdding(true);
    setSelectedCamera({
      id: '',
      name: '',
      location: '',
      ip: '',
      port: 554,
      username: '',
      password: '',
      status: 'offline',
      type: 'ip',
      resolution: '1920x1080',
      fps: 30,
      recording: false,
      aiEnabled: true,
      motionDetection: true,
      nightVision: false,
      audioEnabled: false,
      storageLocation: '',
      retentionDays: 30,
      createdAt: new Date(),
      lastSeen: new Date(),
      zones: []
    });
  };

  const handleEditCamera = (camera: Camera) => {
    setSelectedCamera(camera);
    setIsEditing(true);
  };

  const handleDeleteCamera = (cameraId: string) => {
    setCameras(prev => prev.filter(cam => cam.id !== cameraId));
  };

  const handleSaveCamera = (cameraData: Camera) => {
    if (isAdding) {
      const newCamera = {
        ...cameraData,
        id: `cam${Date.now()}`,
        createdAt: new Date(),
        lastSeen: new Date()
      };
      setCameras(prev => [...prev, newCamera]);
    } else {
      setCameras(prev => prev.map(cam => cam.id === cameraData.id ? cameraData : cam));
    }
    setSelectedCamera(null);
    setIsEditing(false);
    setIsAdding(false);
  };

  const handleTestConnection = async (camera: Camera) => {
    // Simulate connection test
    console.log('Testing connection for:', camera.name);
  };

  const getStatusIcon = (status: Camera['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'offline': return <X className="h-4 w-4 text-gray-400" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: Camera['status']) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-gray-400';
      case 'error': return 'text-red-400';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Camera Management</h1>
          <p className="text-gray-400 mt-1">
            Configure and manage your surveillance cameras
          </p>
        </div>
        <button
          onClick={handleAddCamera}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Camera</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard
          title="Total Cameras"
          value={cameras.length.toString()}
          icon={Camera}
          color="blue"
        />
        <StatsCard
          title="Online"
          value={cameras.filter(c => c.status === 'online').length.toString()}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Offline"
          value={cameras.filter(c => c.status === 'offline').length.toString()}
          icon={VideoOff}
          color="gray"
        />
        <StatsCard
          title="Errors"
          value={cameras.filter(c => c.status === 'error').length.toString()}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search cameras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
          />
        </div>
        <div className="flex space-x-2">
          {(['all', 'online', 'offline', 'error'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterStatus(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filterStatus === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredCameras.map((camera) => (
            <motion.div
              key={camera.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
            >
              <CameraCard
                camera={camera}
                onEdit={() => handleEditCamera(camera)}
                onDelete={() => handleDeleteCamera(camera.id)}
                onTest={() => handleTestConnection(camera)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Camera Form Modal */}
      <AnimatePresence>
        {(isEditing || isAdding) && selectedCamera && (
          <CameraFormModal
            camera={selectedCamera}
            isAdding={isAdding}
            onSave={handleSaveCamera}
            onClose={() => {
              setSelectedCamera(null);
              setIsEditing(false);
              setIsAdding(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'red' | 'gray';
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    red: 'text-red-400 bg-red-500/10',
    gray: 'text-gray-400 bg-gray-500/10'
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className={`h-6 w-6 ${colorClasses[color].split(' ')[0]}`} />
        </div>
      </div>
    </div>
  );
}

// Camera Card Component
interface CameraCardProps {
  camera: Camera;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}

function CameraCard({ camera, onEdit, onDelete, onTest }: CameraCardProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  return (
    <div className="space-y-4">
      {/* Camera Preview */}
      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
        {camera.status === 'online' ? (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
            <div className="text-center">
              <Video className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Live Preview</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <div className="text-center">
              <VideoOff className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-600 text-sm">No Signal</p>
            </div>
          </div>
        )}

        {/* Status Overlay */}
        <div className="absolute top-2 left-2 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            camera.status === 'online' ? 'bg-green-400 animate-pulse' :
            camera.status === 'offline' ? 'bg-gray-400' : 'bg-red-400'
          }`} />
          <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">
            {camera.status.toUpperCase()}
          </span>
        </div>

        {/* Controls */}
        <div className="absolute bottom-2 right-2 flex space-x-1">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
          >
            {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Camera Info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{camera.name}</h3>
          <p className="text-sm text-gray-400">{camera.location}</p>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <Monitor className="h-3 w-3 text-gray-400" />
            <span className="text-gray-400">{camera.resolution}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="h-3 w-3 text-gray-400" />
            <span className="text-gray-400">{camera.fps} FPS</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-3 w-3 text-gray-400" />
            <span className="text-gray-400">{camera.ip}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className="text-gray-400">
              {camera.lastSeen.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {camera.recording && (
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
              Recording
            </span>
          )}
          {camera.aiEnabled && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
              AI Enabled
            </span>
          )}
          {camera.motionDetection && (
            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
              Motion
            </span>
          )}
          {camera.nightVision && (
            <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded">
              Night Vision
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <Edit className="h-3 w-3" />
            <span>Edit</span>
          </button>
          <button
            onClick={onTest}
            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
          >
            <Wifi className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Camera Form Modal Component
interface CameraFormModalProps {
  camera: Camera;
  isAdding: boolean;
  onSave: (camera: Camera) => void;
  onClose: () => void;
}

function CameraFormModal({ camera, isAdding, onSave, onClose }: CameraFormModalProps) {
  const [formData, setFormData] = useState<Camera>(camera);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'zones'>('basic');
  const [isTesting, setIsTesting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    // Simulate connection test
    setTimeout(() => {
      setIsTesting(false);
      // Show success/error message
    }, 2000);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-800 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">
            {isAdding ? 'Add New Camera' : 'Edit Camera'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Tabs */}
          <div className="flex border-b border-gray-700">
            {[
              { id: 'basic', label: 'Basic Settings' },
              { id: 'advanced', label: 'Advanced' },
              { id: 'zones', label: 'Detection Zones' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Camera Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateFormData('name', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Enter camera name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateFormData('location', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Enter location"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      IP Address
                    </label>
                    <input
                      type="text"
                      value={formData.ip}
                      onChange={(e) => updateFormData('ip', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="192.168.1.100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Port
                    </label>
                    <input
                      type="number"
                      value={formData.port}
                      onChange={(e) => updateFormData('port', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="554"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => updateFormData('username', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="admin"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Enter password"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Camera Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => updateFormData('type', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="ip">IP Camera</option>
                      <option value="usb">USB Camera</option>
                      <option value="rtsp">RTSP Stream</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Resolution
                    </label>
                    <select
                      value={formData.resolution}
                      onChange={(e) => updateFormData('resolution', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="1920x1080">1920x1080 (Full HD)</option>
                      <option value="1280x720">1280x720 (HD)</option>
                      <option value="640x480">640x480 (VGA)</option>
                    </select>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div>
                    <h4 className="text-sm font-medium text-white">Test Connection</h4>
                    <p className="text-xs text-gray-400">Verify camera connectivity</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                  >
                    {isTesting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Testing...</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="h-4 w-4" />
                        <span>Test</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Frame Rate (FPS)
                    </label>
                    <input
                      type="number"
                      value={formData.fps}
                      onChange={(e) => updateFormData('fps', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      min="1"
                      max="60"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Retention Days
                    </label>
                    <input
                      type="number"
                      value={formData.retentionDays}
                      onChange={(e) => updateFormData('retentionDays', parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      min="1"
                      max="365"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Storage Location
                    </label>
                    <input
                      type="text"
                      value={formData.storageLocation}
                      onChange={(e) => updateFormData('storageLocation', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="/data/cameras/cam1"
                    />
                  </div>
                </div>

                {/* Feature Toggles */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-white">Features</h4>
                  
                  {[
                    { key: 'recording', label: 'Recording', icon: Video },
                    { key: 'aiEnabled', label: 'AI Analysis', icon: Zap },
                    { key: 'motionDetection', label: 'Motion Detection', icon: Activity },
                    { key: 'nightVision', label: 'Night Vision', icon: Eye },
                    { key: 'audioEnabled', label: 'Audio Recording', icon: Settings }
                  ].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-gray-400" />
                        <span className="text-white">{label}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateFormData(key, !formData[key as keyof Camera])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          formData[key as keyof Camera]
                            ? 'bg-blue-600'
                            : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData[key as keyof Camera]
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'zones' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <Settings className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">Detection Zones</h4>
                  <p className="text-gray-400">
                    Configure detection zones for this camera. This feature will be available in a future update.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isAdding ? 'Add Camera' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}