// src/app/cameras/page.tsx
'use client'
import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'

interface Camera { id:string; name:string; }

export default function CamerasPage() {
  const [cams, setCams] = useState<Camera[]>([])
  useEffect(()=>{
    fetch('/api/cameras').then(r=>r.json()).then(setCams)
  },[])

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Your Cameras</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cams.map(cam => (
          <Card key={cam.id} className="overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              {/* If you know some cams are square, you can swap to aspect-square */}
              <video
                src={`/videos/${cam.id}.mp4`}
                loop
                muted
                autoPlay
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="font-medium">{cam.name}</span>
              <button 
                onClick={()=>window.location.assign(`/monitor?camera=${cam.id}`)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                View
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
