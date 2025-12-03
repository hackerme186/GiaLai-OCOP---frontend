"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import type { EnterpriseMapDto } from "@/lib/api"
import "leaflet/dist/leaflet.css"

const defaultCenter: [number, number] = [13.9712, 108.0076]

// Custom Enterprise Marker Icon với ảnh đại diện của doanh nghiệp
const createEnterpriseIcon = (isSelected: boolean, imageUrl?: string, rating?: number) => {
  const color = isSelected ? '#4f46e5' : '#6366f1' // Indigo
  const size = isSelected ? 48 : 42
  const shadow = isSelected ? '0 4px 16px rgba(79, 70, 229, 0.5)' : '0 2px 10px rgba(0,0,0,0.3)'
  const hasRating = rating !== undefined && rating !== null
  const hasImage = imageUrl && imageUrl.trim() !== ''
  
  // Fallback image nếu không có ảnh - sử dụng SVG encoded đúng cách
  const svgString = `<svg width="40" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" fill="#6366f1" rx="4"/><text x="20" y="28" font-family="Arial" font-size="20" fill="white" text-anchor="middle">B</text></svg>`
  const defaultImage = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
  
  const imageSource = hasImage ? imageUrl : defaultImage
  
  return L.divIcon({
    className: 'enterprise-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        <!-- Pin shape với ảnh -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, ${color}, ${isSelected ? '#7c3aed' : '#818cf8'});
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: ${shadow};
          transition: all 0.3s ease;
          overflow: hidden;
        ">
          <!-- Ảnh đại diện doanh nghiệp -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            width: ${size - 10}px;
            height: ${size - 10}px;
            border-radius: 4px;
            overflow: hidden;
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <img 
              src="${imageSource}" 
              alt="Enterprise"
              style="
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
              "
              onerror="this.onerror=null; this.style.display='none'; this.parentElement.innerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:18px;background:#6366f1;color:white;font-weight:bold;\\'>B</div>';"
            />
          </div>
        </div>
        ${hasRating ? `
          <!-- Rating badge -->
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 1000;
            line-height: 1;
          ">${rating}</div>
        ` : ''}
        ${isSelected ? `
          <!-- Pulse animation khi selected -->
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size + 8}px;
            height: ${size + 8}px;
            border: 2px solid ${color};
            border-radius: 50% 50% 50% 0;
            transform: translate(-50%, -50%) rotate(-45deg);
            animation: pulse 2s infinite;
            pointer-events: none;
          "></div>
        ` : ''}
      </div>
      <style>
        @keyframes pulse {
          0% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(-45deg) scale(1);
          }
          50% {
            opacity: 0.5;
            transform: translate(-50%, -50%) rotate(-45deg) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(-45deg) scale(1.2);
          }
        }
      </style>
    `,
    iconSize: [size + (hasRating ? 12 : 0), size + (hasRating ? 12 : 0)],
    iconAnchor: [(size + (hasRating ? 12 : 0)) / 2, size + (hasRating ? 12 : 0)],
    popupAnchor: [0, -(size + (hasRating ? 12 : 0))],
  })
}

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

// Icon màu đỏ cho vị trí GPS của người dùng
const UserLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="
    width: 20px;
    height: 20px;
    background-color: #dc2626;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

interface FitBoundsProps {
  points: Array<[number, number]>
}

const FitBounds = ({ points }: FitBoundsProps) => {
  const map = useMap()
  const [hasFitted, setHasFitted] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)

  useEffect(() => {
    // Chỉ fit bounds một lần khi có points và chưa fit lần nào, và người dùng chưa tương tác
    if (!points.length || hasFitted || userInteracted) return

    // Delay nhỏ để đảm bảo map đã render xong
    const timer = setTimeout(() => {
      const bounds = L.latLngBounds(points)
      map.fitBounds(bounds, { padding: [40, 40] })
      setHasFitted(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [points, map, hasFitted, userInteracted])

  // Theo dõi khi người dùng tương tác với map
  useEffect(() => {
    const handleInteraction = () => {
      setUserInteracted(true)
    }

    map.on('dragstart', handleInteraction)
    map.on('zoomstart', handleInteraction)
    map.on('click', handleInteraction)

    return () => {
      map.off('dragstart', handleInteraction)
      map.off('zoomstart', handleInteraction)
      map.off('click', handleInteraction)
    }
  }, [map])

  return null
}

// Component tự động lấy vị trí GPS khi map load (không tự động zoom)
const AutoGeolocation = ({
  onLocationUpdate,
  onError
}: {
  onLocationUpdate: (latitude: number, longitude: number) => void
  onError: (error: string) => void
}) => {
  const hasRun = useRef(false)
  const onLocationUpdateRef = useRef(onLocationUpdate)
  const onErrorRef = useRef(onError)

  // Cập nhật ref khi callback thay đổi
  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate
    onErrorRef.current = onError
  }, [onLocationUpdate, onError])

  useEffect(() => {
    // Chỉ chạy một lần khi component mount
    if (hasRun.current) return
    hasRun.current = true

    // Kiểm tra trình duyệt có hỗ trợ geolocation không
    if (!navigator.geolocation) {
      // Không hiển thị lỗi nếu không hỗ trợ, chỉ log
      console.warn("Trình duyệt không hỗ trợ định vị GPS")
      return
    }

    // Tự động lấy vị trí hiện tại (chỉ lấy một lần khi component mount)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords

        // Kiểm tra tính hợp lệ của tọa độ
        if (typeof latitude === 'number' && typeof longitude === 'number' &&
          !isNaN(latitude) && !isNaN(longitude) &&
          latitude >= -90 && latitude <= 90 &&
          longitude >= -180 && longitude <= 180) {

          // Cập nhật vị trí (không tự động zoom, chỉ hiển thị marker)
          onLocationUpdateRef.current(latitude, longitude)
        } else {
          console.warn("Tọa độ GPS không hợp lệ")
        }
      },
      (error) => {
        // Chỉ log lỗi, không hiển thị alert để không làm phiền người dùng
        if (error && typeof error === 'object' && 'code' in error) {
          const errorCode = error.code as number
          if (errorCode === 1) {
            // PERMISSION_DENIED - người dùng từ chối, không cần thông báo
            console.warn("Người dùng từ chối cấp quyền định vị")
          } else {
            console.warn("Geolocation error:", error)
          }
        } else {
          console.warn("Geolocation error:", error)
        }
        // Không gọi onError để tránh hiển thị alert
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // Cache 1 phút
      }
    )
  }, []) // Empty dependency array - chỉ chạy một lần

  return null
}

// Component nút "Vị trí của tôi" (giống Google Maps)
const MyLocationButton = ({
  onLocationUpdate
}: {
  onLocationUpdate: (latitude: number, longitude: number) => void
}) => {
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

        if (typeof latitude === 'number' && typeof longitude === 'number' &&
          !isNaN(latitude) && !isNaN(longitude) &&
          latitude >= -90 && latitude <= 90 &&
          longitude >= -180 && longitude <= 180) {

          // Cập nhật vị trí
          onLocationUpdate(latitude, longitude)

          // Zoom đến vị trí của người dùng (giống Google Maps)
          map.setView([latitude, longitude], 15, {
            animate: true,
          })
        }
        setIsLocating(false)
      },
      (error) => {
        let errorMessage = "Không thể lấy vị trí GPS"

        if (error && typeof error === 'object' && 'code' in error) {
          const errorCode = error.code as number
          switch (errorCode) {
            case 1: // PERMISSION_DENIED
              errorMessage = "Bạn đã từ chối cấp quyền định vị. Vui lòng cấp quyền để sử dụng tính năng này."
              break
            case 2: // POSITION_UNAVAILABLE
              errorMessage = "Thông tin vị trí không khả dụng"
              break
            case 3: // TIMEOUT
              errorMessage = "Yêu cầu lấy vị trí đã hết thời gian chờ"
              break
            default:
              errorMessage = "Đã xảy ra lỗi khi lấy vị trí GPS"
              break
          }
        }

        alert(errorMessage)
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
      <div className="leaflet-control" style={{ marginBottom: "10px" }}>
        <button
          onClick={handleClick}
          disabled={isLocating}
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#ffffff",
            border: "2px solid rgba(0,0,0,0.2)",
            borderRadius: "2px",
            color: "#333333",
            cursor: isLocating ? "wait" : "pointer",
            boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isLocating) {
              e.currentTarget.style.backgroundColor = "#f9f9f9"
            }
          }}
          onMouseLeave={(e) => {
            if (!isLocating) {
              e.currentTarget.style.backgroundColor = "#ffffff"
            }
          }}
          title="Vị trí của tôi"
        >
          {isLocating ? (
            <svg
              style={{ width: "20px", height: "20px" }}
              className="animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                style={{ opacity: 0.25 }}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                style={{ opacity: 0.75 }}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "20px", height: "20px", fill: "#4285f4" }}
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

// Component nút Zoom Controls (giống Google Maps)
const ZoomControls = () => {
  const map = useMap()
  const [zoom, setZoom] = useState(map.getZoom())

  useEffect(() => {
    const updateZoom = () => {
      setZoom(map.getZoom())
    }

    map.on('zoomend', updateZoom)
    map.on('zoom', updateZoom)

    return () => {
      map.off('zoomend', updateZoom)
      map.off('zoom', updateZoom)
    }
  }, [map])

  const handleZoomIn = () => {
    map.zoomIn()
  }

  const handleZoomOut = () => {
    map.zoomOut()
  }

  const minZoom = map.getMinZoom()
  const maxZoom = map.getMaxZoom()
  const canZoomIn = zoom < maxZoom
  const canZoomOut = zoom > minZoom

  return (
    <div className="leaflet-top leaflet-right" style={{ marginTop: "60px", marginRight: "10px", zIndex: 1000 }}>
      <div className="leaflet-control">
        <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          {/* Zoom In Button */}
          <button
            onClick={handleZoomIn}
            disabled={!canZoomIn}
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#ffffff",
              border: "2px solid rgba(0,0,0,0.2)",
              borderBottom: "none",
              borderTopLeftRadius: "2px",
              borderTopRightRadius: "2px",
              color: canZoomIn ? "#333333" : "#cccccc",
              cursor: canZoomIn ? "pointer" : "not-allowed",
              boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (canZoomIn) {
                e.currentTarget.style.backgroundColor = "#f9f9f9"
              }
            }}
            onMouseLeave={(e) => {
              if (canZoomIn) {
                e.currentTarget.style.backgroundColor = "#ffffff"
              }
            }}
            title="Phóng to"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "20px", height: "20px", fill: "currentColor" }}
              viewBox="0 0 24 24"
            >
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </button>

          {/* Zoom Out Button */}
          <button
            onClick={handleZoomOut}
            disabled={!canZoomOut}
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#ffffff",
              border: "2px solid rgba(0,0,0,0.2)",
              borderTop: "none",
              borderBottomLeftRadius: "2px",
              borderBottomRightRadius: "2px",
              color: canZoomOut ? "#333333" : "#cccccc",
              cursor: canZoomOut ? "pointer" : "not-allowed",
              boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (canZoomOut) {
                e.currentTarget.style.backgroundColor = "#f9f9f9"
              }
            }}
            onMouseLeave={(e) => {
              if (canZoomOut) {
                e.currentTarget.style.backgroundColor = "#ffffff"
              }
            }}
            title="Thu nhỏ"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "20px", height: "20px", fill: "currentColor" }}
              viewBox="0 0 24 24"
            >
              <path d="M19 13H5v-2h14v2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Component theo dõi zoom level và cập nhật cho tất cả labels
const ZoomTracker = ({ onZoomChange }: { onZoomChange: (zoom: number) => void }) => {
  const map = useMap()

  useEffect(() => {
    const updateZoom = () => {
      onZoomChange(map.getZoom())
    }

    updateZoom()
    map.on('zoomend', updateZoom)
    map.on('zoom', updateZoom)

    return () => {
      map.off('zoomend', updateZoom)
      map.off('zoom', updateZoom)
    }
  }, [map, onZoomChange])

  return null
}

// Component hiển thị label tên doanh nghiệp khi zoom đủ gần
const EnterpriseLabel = ({
  enterprise,
  position,
  showLabel
}: {
  enterprise: EnterpriseMapDto
  position: [number, number]
  showLabel: boolean
}) => {
  if (!showLabel) return null

  // Lấy tên doanh nghiệp từ dữ liệu (field 'name' trong EnterpriseMapDto)
  const companyName = enterprise.name || ''

  // Tạo label text - cắt nếu quá dài
  const labelText = companyName.length > 30
    ? companyName.substring(0, 30) + '...'
    : companyName

  // Escape HTML để tránh XSS
  const escapedText = labelText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  // Tạo label icon với vị trí phía trên marker
  // Tính toán kích thước để đặt anchor đúng
  const estimatedWidth = Math.min(labelText.length * 7 + 12, 200)
  const labelHeight = 24

  const labelIcon = L.divIcon({
    html: `<div style="
      background: linear-gradient(135deg, #ffffff, #f8fafc);
      border: 2px solid #6366f1;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
      pointer-events: none;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: center;
      line-height: 1.4;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      display: inline-block;
    ">${escapedText}</div>`,
    iconSize: [estimatedWidth, labelHeight],
    iconAnchor: [estimatedWidth / 2, 42], // Center label và đặt phía trên marker (marker cao ~41px)
    className: 'enterprise-label-wrapper',
  })

  // Sử dụng cùng vị trí với marker để đảm bảo label hiển thị đúng
  return (
    <Marker
      position={position}
      icon={labelIcon}
      interactive={false}
      zIndexOffset={1000}
    />
  )
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

  // State để lưu vị trí GPS của người dùng
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)

  // State để theo dõi zoom level cho labels
  const [currentZoom, setCurrentZoom] = useState(8)
  // Hiển thị label khi zoom >= 14
  const showLabels = currentZoom >= 14

  // Xử lý khi có vị trí mới (từ AutoGeolocation hoặc MyLocationButton)
  // Sử dụng useCallback để tránh tạo lại function mỗi lần render
  const handleLocationUpdate = useCallback((latitude: number, longitude: number) => {
    setUserLocation({ latitude, longitude })
  }, [])

  // Xử lý khi zoom thay đổi
  // Sử dụng useCallback để tránh tạo lại function mỗi lần render
  const handleZoomChange = useCallback((zoom: number) => {
    setCurrentZoom(zoom)
  }, [])

  return (
    <MapContainer
      center={defaultCenter}
      zoom={8}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      scrollWheelZoom={true}
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
      zoomControl={false}
      boxZoom={true}
      keyboard={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={points} />
      <ZoomTracker onZoomChange={handleZoomChange} />
      <AutoGeolocation
        onLocationUpdate={handleLocationUpdate}
        onError={() => { }} // Không cần xử lý lỗi ở đây
      />
      <MyLocationButton onLocationUpdate={handleLocationUpdate} />
      <ZoomControls />

      {/* Marker vị trí GPS của người dùng */}
      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={UserLocationIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-red-600 mb-1">Vị trí của bạn</p>
              <p className="text-xs text-gray-600">
                Vĩ độ: {userLocation.latitude.toFixed(6)}
              </p>
              <p className="text-xs text-gray-600">
                Kinh độ: {userLocation.longitude.toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Marker các doanh nghiệp */}
      {enterprises.map((enterprise) => {
        if (!enterprise.latitude || !enterprise.longitude) return null
        const isSelected = enterprise.id === selectedId
        const imageUrl = enterprise.imageUrl || ''
        return (
          <div key={enterprise.id}>
            <Marker
              position={[enterprise.latitude, enterprise.longitude]}
              icon={createEnterpriseIcon(isSelected, imageUrl, enterprise.ocopRating)}
              eventHandlers={{ 
                click: () => onSelect(enterprise.id),
                mouseover: (e) => {
                  const marker = e.target
                  marker.setIcon(createEnterpriseIcon(true, imageUrl, enterprise.ocopRating))
                },
                mouseout: (e) => {
                  const marker = e.target
                  if (!isSelected) {
                    marker.setIcon(createEnterpriseIcon(false, imageUrl, enterprise.ocopRating))
                  }
                }
              }}
            >
              <Popup className="custom-popup">
                <div className="text-sm min-w-[200px]">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {enterprise.imageUrl && (
                        <img 
                          src={enterprise.imageUrl} 
                          alt={enterprise.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-base mb-1">{enterprise.name}</p>
                      <div className="flex items-center gap-2">
                        {enterprise.ocopRating && (
                          <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                            ⭐ {enterprise.ocopRating}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">{enterprise.district}</span>
                      </div>
                    </div>
                  </div>
                  {enterprise.businessField && (
                    <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded mt-2">
                      📦 {enterprise.businessField}
                    </p>
                  )}
                  <button
                    onClick={() => {
                      onSelect(enterprise.id)
                      // Close popup after selection
                      setTimeout(() => {
                        const popup = document.querySelector('.leaflet-popup')
                        if (popup) {
                          (popup as HTMLElement).style.display = 'none'
                        }
                      }, 100)
                    }}
                    className="mt-3 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </Popup>
            </Marker>
            {/* Label tên doanh nghiệp - hiển thị khi zoom đủ gần */}
            <EnterpriseLabel
              enterprise={enterprise}
              position={[enterprise.latitude, enterprise.longitude]}
              showLabel={showLabels}
            />
          </div>
        )
      })}
    </MapContainer>
  )
}

