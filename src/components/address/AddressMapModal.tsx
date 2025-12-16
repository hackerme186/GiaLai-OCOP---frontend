"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import dynamic from "next/dynamic"
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { getAddressFromCoordinates, getCoordinatesFromAddress } from "@/lib/geolocation"


const defaultCenter: [number, number] = [13.9712, 108.0076] // Gia Lai

// Icon marker màu đỏ
const RedMarkerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface AddressMapModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (address: string, latitude?: number, longitude?: number) => void
  initialAddress?: string
}

interface SuggestedAddress {
  displayName: string
  address: string
  latitude: number
  longitude: number
}

// Component để xử lý click trên bản đồ
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

// Component để di chuyển map đến vị trí
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap()
  
  useEffect(() => {
    if (center) {
      map.setView(center, 15, { animate: true })
    }
  }, [center, map])
  
  return null
}

// Component nút "Vị trí của tôi"
function MyLocationButton({ onLocationUpdate }: { onLocationUpdate: (lat: number, lng: number) => void }) {
  const map = useMap()
  const [isLocating, setIsLocating] = useState(false)

  const handleClick = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS")
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        onLocationUpdate(latitude, longitude)
        map.setView([latitude, longitude], 15, { animate: true })
        setIsLocating(false)
      },
      (error) => {
        alert("Không thể lấy vị trí GPS")
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: "10px", marginRight: "10px", zIndex: 1000 }}>
      <div className="leaflet-control">
        <button
          onClick={handleClick}
          disabled={isLocating}
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#ffffff",
            border: "2px solid rgba(0,0,0,0.2)",
            borderRadius: "50%",
            cursor: isLocating ? "wait" : "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
          }}
          title="Vị trí của tôi"
        >
          {isLocating ? (
            <svg className="animate-spin" style={{ width: "20px", height: "20px" }} fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg style={{ width: "20px", height: "20px", fill: "#333" }} viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

export default function AddressMapModal({ isOpen, onClose, onSelect, initialAddress }: AddressMapModalProps) {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null)
  const [suggestedAddresses, setSuggestedAddresses] = useState<SuggestedAddress[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SuggestedAddress[]>([])

  // Load initial address if provided - chỉ set query, không tự động search
  useEffect(() => {
    if (isOpen && initialAddress) {
      setSearchQuery(initialAddress)
      // Không tự động search để tránh lỗi nếu địa chỉ không tìm thấy
      // Người dùng có thể click vào bản đồ hoặc dùng nút "Vị trí của tôi"
    }
  }, [isOpen, initialAddress])

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setSelectedPosition([lat, lng])
    setLoading(true)

    try {
      // Reverse geocoding để lấy địa chỉ từ tọa độ
      const addressResult = await getAddressFromCoordinates({ latitude: lat, longitude: lng })
      
      // Thêm vào danh sách gợi ý
      const newAddress: SuggestedAddress = {
        displayName: addressResult.formattedAddress || addressResult.address,
        address: addressResult.address,
        latitude: lat,
        longitude: lng,
      }

      setSuggestedAddresses((prev) => {
        // Kiểm tra xem địa chỉ đã tồn tại chưa
        const exists = prev.some(
          (addr) => addr.latitude === lat && addr.longitude === lng
        )
        if (exists) return prev
        return [newAddress, ...prev]
      })
    } catch (error) {
      console.error("Error getting address:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearchAddress = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      // Forward geocoding để tìm địa chỉ
      const result = await getCoordinatesFromAddress(query)
      
      const address: SuggestedAddress = {
        displayName: result.displayName || query,
        address: query,
        latitude: result.latitude,
        longitude: result.longitude,
      }

      setSearchResults([address])
      setSelectedPosition([result.latitude, result.longitude])
    } catch (error) {
      // Xử lý lỗi một cách im lặng - không throw, chỉ log
      console.warn("Không tìm thấy địa chỉ:", query, error)
      setSearchResults([])
      // Không set error state để tránh làm phiền người dùng
      // Họ có thể click vào bản đồ để chọn địa chỉ
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAddress = (address: SuggestedAddress) => {
    setSelectedPosition([address.latitude, address.longitude])
    onSelect(address.address, address.latitude, address.longitude)
    onClose()
  }

  const handleMyLocation = (lat: number, lng: number) => {
    setSelectedPosition([lat, lng])
    handleMapClick(lat, lng)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Chọn địa chỉ</h2>
        </div>
      </div>

      {/* Map Section - Takes 50% of screen height */}
      <div className="flex-1 relative" style={{ height: "50vh" }}>
        {typeof window !== "undefined" && (
          <MapContainer
            center={selectedPosition || defaultCenter}
            zoom={selectedPosition ? 15 : 10}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            scrollWheelZoom={true}
            zoomControl={false}
            key={selectedPosition ? `${selectedPosition[0]}-${selectedPosition[1]}` : "default"}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {selectedPosition && <MapCenter center={selectedPosition} />}
            <MapClickHandler onMapClick={handleMapClick} />
            <MyLocationButton onLocationUpdate={handleMyLocation} />
            {selectedPosition && (
              <Marker position={selectedPosition} icon={RedMarkerIcon} />
            )}
          </MapContainer>
        )}
      </div>

      {/* Suggested Addresses Section - Takes remaining space */}
      <div className="flex-1 overflow-y-auto bg-white border-t border-gray-200">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Địa chỉ gợi ý</h3>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          )}
          
          {(searchResults.length > 0 || suggestedAddresses.length > 0) && !loading && (
            <div className="space-y-2">
              {/* Search results first */}
              {searchResults.map((addr, index) => (
                <button
                  key={`search-${index}`}
                  onClick={() => handleSelectAddress(addr)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 break-words">{addr.displayName}</p>
                    </div>
                  </div>
                </button>
              ))}

              {/* Suggested addresses from map clicks */}
              {suggestedAddresses.map((addr, index) => (
                <button
                  key={`suggested-${index}`}
                  onClick={() => handleSelectAddress(addr)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 break-words">{addr.displayName}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!loading && searchResults.length === 0 && suggestedAddresses.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Nhấn vào bản đồ để chọn địa chỉ</p>
              <p className="text-xs mt-1">hoặc tìm kiếm địa chỉ ở trên</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

