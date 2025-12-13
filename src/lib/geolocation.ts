// Utility functions for geolocation and reverse geocoding

export interface Location {
  latitude: number;
  longitude: number;
}

export interface AddressResult {
  address: string;
  formattedAddress?: string;
}

/**
 * Get current location using browser Geolocation API
 * Uses watchPosition to wait for accurate GPS fix instead of cached/IP location
 */
export async function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ định vị GPS"))
      return
    }

    let watchId: number | null = null
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let bestPosition: GeolocationPosition | null = null
    const maxWaitTime = 30000 // 30 seconds max wait
    const minAccuracy = 500 // Reject positions with accuracy worse than 500m (likely IP-based)

    // Clear function
    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
        watchId = null
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    // Success handler
    const onSuccess = (position: GeolocationPosition) => {
      const accuracy = position.coords.accuracy || Infinity
      
      // Reject positions with poor accuracy (likely IP-based location)
      if (accuracy > minAccuracy) {
        console.warn(`Vị trí không chính xác (độ chính xác: ${accuracy.toFixed(0)}m). Đang chờ GPS...`)
        
        // Keep tracking for better position
        if (!bestPosition || accuracy < (bestPosition.coords.accuracy || Infinity)) {
          bestPosition = position
        }
        return
      }

      // Got a good GPS position
      cleanup()
      resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      })
    }

    // Error handler
    const onError = (error: GeolocationPositionError) => {
      cleanup()
      
      let message = "Không thể lấy vị trí hiện tại"
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message = "Quyền truy cập vị trí bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt."
          break
        case error.POSITION_UNAVAILABLE:
          message = "Thông tin vị trí không khả dụng. Vui lòng kiểm tra kết nối GPS."
          break
        case error.TIMEOUT:
          message = "Yêu cầu lấy vị trí đã hết thời gian chờ. Vui lòng thử lại ở nơi có tín hiệu GPS tốt hơn."
          break
      }
      reject(new Error(message))
    }

    // Start watching for position updates
    watchId = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      {
        enableHighAccuracy: true, // Force GPS usage, not IP/cell towers
        timeout: 30000, // 30 seconds per position attempt
        maximumAge: 0, // Don't use cached positions
      }
    )

    // Overall timeout - if no good position after maxWaitTime, use best available or reject
    timeoutId = setTimeout(() => {
      cleanup()
      
      if (bestPosition) {
        // Use best available position even if not perfect
        console.warn(`Sử dụng vị trí tốt nhất có được (độ chính xác: ${(bestPosition.coords.accuracy || 0).toFixed(0)}m)`)
        resolve({
          latitude: bestPosition.coords.latitude,
          longitude: bestPosition.coords.longitude,
        })
      } else {
        reject(new Error("Không thể lấy vị trí GPS chính xác. Vui lòng đảm bảo thiết bị có GPS và đang ở nơi có tín hiệu tốt."))
      }
    }, maxWaitTime)
  })
}

/**
 * Reverse geocoding: Convert coordinates to address using OpenStreetMap Nominatim API
 */
export async function getAddressFromCoordinates(location: Location): Promise<AddressResult> {
  try {
    // Use OpenStreetMap Nominatim API (free, no API key required)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent": "GiaLai-OCOP-App/1.0", // Required by Nominatim
        },
      }
    )

    if (!response.ok) {
      throw new Error("Không thể lấy địa chỉ từ tọa độ")
    }

    const data = await response.json()
    
    if (!data.address) {
      throw new Error("Không tìm thấy địa chỉ cho vị trí này")
    }

    const addr = data.address
    
    // Build address string in Vietnamese format
    const addressParts: string[] = []
    
    // House number and road
    if (addr.house_number) {
      addressParts.push(`Số ${addr.house_number}`)
    }
    if (addr.road || addr.street) {
      addressParts.push(addr.road || addr.street)
    }
    
    // Ward/Commune
    if (addr.ward || addr.village || addr.neighbourhood) {
      addressParts.push(addr.ward || addr.village || addr.neighbourhood)
    }
    
    // District
    if (addr.suburb || addr.district || addr.city_district) {
      addressParts.push(addr.suburb || addr.district || addr.city_district)
    }
    
    // Province/City
    if (addr.state || addr.province) {
      addressParts.push(addr.state || addr.province)
    }
    
    // Country (usually not needed for Vietnam addresses)
    // if (addr.country) {
    //   addressParts.push(addr.country)
    // }

    const address = addressParts.join(", ")
    const formattedAddress = data.display_name || address

    return {
      address: address || formattedAddress,
      formattedAddress,
    }
  } catch (error) {
    console.error("Error reverse geocoding:", error)
    throw error instanceof Error 
      ? error 
      : new Error("Không thể lấy địa chỉ từ vị trí GPS")
  }
}

/**
 * Get current address from GPS location
 */
export async function getCurrentAddress(): Promise<AddressResult> {
  try {
    const location = await getCurrentLocation()
    const address = await getAddressFromCoordinates(location)
    return address
  } catch (error) {
    throw error
  }
}

/**
 * Forward geocoding: Convert address text to coordinates using OpenStreetMap Nominatim API
 */
export interface GeocodeResult extends Location {
  displayName?: string;
  address?: any;
}

export async function getCoordinatesFromAddress(addressText: string, countryCode: string = "VN"): Promise<GeocodeResult> {
  try {
    // Encode address for URL
    const encodedAddress = encodeURIComponent(addressText)
    
    // Use OpenStreetMap Nominatim API for forward geocoding
    // Add country code and limit results to Vietnam for better accuracy
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=${countryCode}&limit=5&addressdetails=1&accept-language=vi`
    
    console.log("🔍 Searching for address:", addressText)
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "GiaLai-OCOP-App/1.0", // Required by Nominatim
      },
    })

    if (!response.ok) {
      console.error("❌ API response not OK:", response.status, response.statusText)
      throw new Error("Không thể tìm kiếm địa chỉ")
    }

    const data = await response.json()
    
    console.log("📥 API response:", data)
    
    if (!Array.isArray(data) || data.length === 0) {
      console.warn("⚠️ No results found for:", addressText)
      throw new Error("Không tìm thấy tọa độ cho địa chỉ này. Vui lòng kiểm tra lại địa chỉ.")
    }

    // Get the first result (most relevant)
    const result = data[0]
    
    console.log("✅ Found location:", result.display_name, "at", result.lat, result.lon)
    
    return {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      displayName: result.display_name,
      address: result.address,
    }
  } catch (error) {
    console.error("❌ Error forward geocoding:", error)
    throw error instanceof Error 
      ? error 
      : new Error("Không thể lấy tọa độ từ địa chỉ")
  }
}

/**
 * Get coordinates from address components (street, ward, district, province)
 * Builds a full address string and geocodes it
 */
export interface AddressComponents {
  street?: string;      // Tên đường
  ward?: string;        // Phường/Xã
  district?: string;    // Quận/Huyện
  province?: string;    // Tỉnh/Thành phố
  houseNumber?: string; // Số nhà
}

export async function getCoordinatesFromAddressComponents(components: AddressComponents, countryCode: string = "VN"): Promise<GeocodeResult> {
  // Try multiple address formats for better success rate
  const addressVariations: string[] = []
  
  // Format 1: Full address with all components
  const fullParts: string[] = []
  if (components.houseNumber) {
    fullParts.push(components.houseNumber)
  }
  if (components.street) {
    fullParts.push(components.street)
  }
  if (components.ward) {
    fullParts.push(components.ward)
  }
  if (components.district) {
    fullParts.push(components.district)
  }
  if (components.province) {
    fullParts.push(components.province)
  }
  fullParts.push("Vietnam")
  if (fullParts.length > 1) {
    addressVariations.push(fullParts.join(", "))
  }
  
  // Format 2: Without house number (sometimes house numbers cause issues)
  if (components.street || components.ward || components.district || components.province) {
    const partsNoHouse: string[] = []
    if (components.street) partsNoHouse.push(components.street)
    if (components.ward) partsNoHouse.push(components.ward)
    if (components.district) partsNoHouse.push(components.district)
    if (components.province) partsNoHouse.push(components.province)
    partsNoHouse.push("Vietnam")
    if (partsNoHouse.length > 1) {
      addressVariations.push(partsNoHouse.join(", "))
    }
  }
  
  // Format 3: District + Province (broader search)
  if (components.district && components.province) {
    addressVariations.push(`${components.district}, ${components.province}, Vietnam`)
  }
  
  // Format 4: Ward + District + Province (medium detail)
  if (components.ward && components.district && components.province) {
    addressVariations.push(`${components.ward}, ${components.district}, ${components.province}, Vietnam`)
  }
  
  // Format 5: Just street + ward/district/province
  if (components.street) {
    if (components.district && components.province) {
      addressVariations.push(`${components.street}, ${components.district}, ${components.province}, Vietnam`)
    }
  }
  
  console.log("🔍 Trying address variations:", addressVariations)
  
  // Try each variation until one succeeds
  let lastError: Error | null = null
  
  for (let i = 0; i < addressVariations.length; i++) {
    const address = addressVariations[i]
    try {
      console.log(`📍 Attempting (${i + 1}/${addressVariations.length}): ${address}`)
      
      // Add small delay between requests to respect Nominatim rate limits (max 1 request per second)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1200)) // 1.2 seconds between requests
      }
      
      const result = await getCoordinatesFromAddress(address, countryCode)
      console.log(`✅ Success with: ${address}`)
      return result
    } catch (error) {
      console.log(`❌ Failed with: ${address}`, error instanceof Error ? error.message : error)
      lastError = error instanceof Error ? error : new Error(String(error))
      // Continue to next variation
    }
  }
  
  // If all variations failed, throw the last error with a helpful message
  console.error("❌ All address variations failed")
  throw lastError || new Error("Không thể lấy tọa độ từ địa chỉ. Vui lòng kiểm tra lại thông tin địa chỉ (tên đường, phường, quận/huyện, tỉnh).")
}

