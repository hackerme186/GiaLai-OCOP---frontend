"use client"

import { useEffect, useState, useRef } from "react"
import dynamic from "next/dynamic"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import type { EnterpriseMapDto } from "@/lib/api"
import "leaflet/dist/leaflet.css"

const defaultCenter: [number, number] = [13.9712, 108.0076] // Gia Lai center
const defaultZoom = 9

// Fix Leaflet icon issue
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })
}

interface MinimapProps {
  enterprises?: EnterpriseMapDto[]
  height?: string
}

// Component để fit bounds cho enterprises
const FitBounds = ({ points }: { points: Array<[number, number]> }) => {
  const map = useMap()
  const hasFitted = useRef(false)

  useEffect(() => {
    if (!points.length || hasFitted.current) return

    const timer = setTimeout(() => {
      try {
        const bounds = L.latLngBounds(points)
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 11 })
        hasFitted.current = true
      } catch (err) {
        console.error("Error fitting bounds:", err)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [points, map])

  return null
}

export default function Minimap({ enterprises = [], height = "600px" }: MinimapProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lọc các enterprises có tọa độ hợp lệ
  const validEnterprises = enterprises.filter(
    (e) => e.latitude && e.longitude && 
    e.latitude >= -90 && e.latitude <= 90 && 
    e.longitude >= -180 && e.longitude <= 180
  )

  const points = validEnterprises.map((e) => [e.latitude!, e.longitude!] as [number, number])

  if (!mounted) {
    return (
      <div 
        className="relative bg-green-50 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-gray-500">Đang tải bản đồ...</div>
      </div>
    )
  }

  return (
    <div 
      className="relative rounded-lg overflow-hidden border-2 border-gray-200"
      style={{ height }}
    >
      <MapContainer
        center={points.length > 0 ? undefined : defaultCenter}
        zoom={points.length > 0 ? undefined : defaultZoom}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
        boxZoom={true}
        keyboard={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {points.length > 0 && <FitBounds points={points} />}

        {validEnterprises.map((enterprise) => (
          <Marker
            key={enterprise.id}
            position={[enterprise.latitude!, enterprise.longitude!]}
          >
            <Popup>
              <div className="text-sm min-w-[200px]">
                <p className="font-semibold text-gray-900 mb-1">{enterprise.name}</p>
                {enterprise.businessField && (
                  <p className="text-xs text-blue-600 mb-1">🏢 {enterprise.businessField}</p>
                )}
                {enterprise.address && (
                  <p className="text-xs text-gray-600 mb-1">📍 {enterprise.address}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {enterprise.district && (
                    <span className="text-xs text-gray-500">{enterprise.district}</span>
                  )}
                  {enterprise.province && (
                    <span className="text-xs text-gray-500">• {enterprise.province}</span>
                  )}
                </div>
                {enterprise.ocopRating && (
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-xs font-semibold text-yellow-600">⭐ {enterprise.ocopRating}</span>
                    <span className="text-xs text-gray-500">OCOP</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

