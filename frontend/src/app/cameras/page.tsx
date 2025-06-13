// src/app/cameras/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Eye, Plus, Settings, Video, AlertCircle, CheckCircle } from 'lucide-react'

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
      setError('Failed to load cameras. Make sure the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Online'
      case 'disconnected':
        return 'Offline'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cameras...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md mx-auto text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchCameras}>Try Again</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Camera Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your security cameras</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Camera
        </Button>
      </div>

      {cameras.length === 0 ? (
        <Card className="text-center py-12">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Cameras Found</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first camera to the system.</p>
          <Button className="flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Add Your First Camera
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cameras.map(camera => (
              <Card key={camera.id} className="overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 bg-gray-900 relative">
                  {/* Simulated video feed with animated placeholder */}
                  <div className="w-full h-32 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-pulse"></div>
                    <Video className="w-8 h-8 text-gray-400 z-10" />
                    <div className="absolute bottom-2 left-2 z-10">
                      <div className="flex items-center gap-1 bg-black/50 rounded px-2 py-1">
                        {getStatusIcon(camera.status)}
                        <span className="text-white text-xs font-medium">
                          {getStatusText(camera.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{camera.name}</h3>
                    {camera.location && (
                      <p className="text-sm text-gray-600">{camera.location}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    {camera.ai_enabled && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">AI</span>
                    )}
                    {camera.motion_detection && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">Motion</span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={`/monitor?camera=${camera.id}`}
                      className="flex-1"
                    >
                      <Button className="w-full flex items-center justify-center gap-2 text-sm">
                        <Eye className="w-4 h-4" />
                        Monitor
                      </Button>
                    </Link>
                    <Button 
                      className="px-3 bg-gray-600 hover:bg-gray-700"
                      onClick={() => console.log('Settings for', camera.id)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          
          <div className="text-center text-sm text-gray-600">
            Showing {cameras.length} cameras • {cameras.filter(c => c.status === 'connected').length} online
          </div>
        </>
      )}
    </div>
  )
}