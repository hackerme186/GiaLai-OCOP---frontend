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
 */
export async function getCurrentLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Trình duyệt không hỗ trợ định vị GPS"))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      (error) => {
        let message = "Không thể lấy vị trí hiện tại"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Quyền truy cập vị trí bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt."
            break
          case error.POSITION_UNAVAILABLE:
            message = "Thông tin vị trí không khả dụng."
            break
          case error.TIMEOUT:
            message = "Yêu cầu lấy vị trí đã hết thời gian chờ."
            break
        }
        reject(new Error(message))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
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

