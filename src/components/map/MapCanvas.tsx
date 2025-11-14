"use client"

import { useEffect } from "react"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import type { EnterpriseMapDto } from "@/lib/api"
import "leaflet/dist/leaflet.css"

const defaultCenter: [number, number] = [13.9712, 108.0076]

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

interface FitBoundsProps {
  points: Array<[number, number]>
}

const FitBounds = ({ points }: FitBoundsProps) => {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    const bounds = L.latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [points, map])
  return null
}

export interface MapCanvasProps {
  enterprises: EnterpriseMapDto[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export default function MapCanvas({ enterprises, selectedId, onSelect }: MapCanvasProps) {
  const points = enterprises
    .filter((p) => p.latitude && p.longitude)
    .map((p) => [p.latitude!, p.longitude!] as [number, number])

  return (
    <MapContainer
      center={defaultCenter}
      zoom={8}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      {enterprises.map((enterprise) => {
        if (!enterprise.latitude || !enterprise.longitude) return null
        return (
          <Marker
            key={enterprise.id}
            position={[enterprise.latitude, enterprise.longitude]}
            opacity={enterprise.id === selectedId ? 1 : 0.7}
            eventHandlers={{ click: () => onSelect(enterprise.id) }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{enterprise.name}</p>
                <p className="text-gray-600">{enterprise.district}</p>
                {enterprise.businessField && (
                  <p className="text-xs text-gray-500 mt-1">{enterprise.businessField}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

