// Error Handler - Chuyển đổi mã lỗi thành thông báo dễ hiểu cho người dùng

/**
 * Chuyển đổi error object thành thông báo dễ hiểu cho người dùng
 * @param error - Error object hoặc string
 * @returns Thông báo lỗi dễ hiểu (không có mã lỗi 401, 500, etc.)
 */
export function getUserFriendlyError(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return "Đã xảy ra lỗi không xác định. Vui lòng thử lại."
  }

  // Handle string errors
  if (typeof error === "string") {
    return cleanErrorMessage(error)
  }

  // Handle Error instances
  if (error instanceof Error) {
    const errorObj = error as any

    // Check for network errors
    if (
      errorObj.isNetworkError ||
      errorObj.status === 0 ||
      errorObj.message?.includes("network") ||
      errorObj.message?.includes("fetch") ||
      errorObj.message?.includes("Failed to fetch") ||
      errorObj.message?.includes("NetworkError")
    ) {
      return "Lỗi kết nối. Vui lòng kiểm tra internet và thử lại."
    }

    // Check for authentication errors (401)
    if (
      errorObj.isAuthError ||
      errorObj.status === 401 ||
      errorObj.message?.includes("401") ||
      errorObj.message?.includes("Unauthorized") ||
      errorObj.message?.includes("phiên đăng nhập") ||
      errorObj.message?.includes("hết hạn")
    ) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
    }

    // Check for forbidden errors (403)
    if (
      errorObj.status === 403 ||
      errorObj.message?.includes("403") ||
      errorObj.message?.includes("Forbidden")
    ) {
      return "Bạn không có quyền thực hiện thao tác này."
    }

    // Check for not found errors (404)
    if (
      errorObj.status === 404 ||
      errorObj.message?.includes("404") ||
      errorObj.message?.includes("Not Found")
    ) {
      return "Không tìm thấy dữ liệu. Vui lòng thử lại."
    }

    // Check for server errors (500+)
    if (errorObj.status >= 500 || errorObj.message?.includes("500")) {
      return "Lỗi server. Vui lòng thử lại sau."
    }

    // Check for timeout errors
    if (
      errorObj.message?.includes("timeout") ||
      errorObj.message?.includes("Timeout")
    ) {
      return "Kết nối quá lâu. Vui lòng thử lại."
    }

    // Check for validation errors (400)
    if (errorObj.status === 400 || errorObj.message?.includes("400")) {
      // Extract backend message if available
      const backendMessage = errorObj.bodyMessage || errorObj.response?.message
      if (backendMessage && typeof backendMessage === "string") {
        return cleanErrorMessage(backendMessage)
      }
      return "Thông tin không hợp lệ. Vui lòng kiểm tra lại."
    }

    // Check for conflict errors (409)
    if (errorObj.status === 409 || errorObj.message?.includes("409")) {
      return "Dữ liệu đã tồn tại. Vui lòng kiểm tra lại."
    }

    // Clean the error message from status codes
    return cleanErrorMessage(error.message)
  }

  // Handle generic objects
  if (typeof error === "object") {
    const errorObj = error as any

    // Check for status code
    if (errorObj.status) {
      if (errorObj.status === 401) {
        return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
      }
      if (errorObj.status === 403) {
        return "Bạn không có quyền thực hiện thao tác này."
      }
      if (errorObj.status === 404) {
        return "Không tìm thấy dữ liệu. Vui lòng thử lại."
      }
      if (errorObj.status >= 500) {
        return "Lỗi server. Vui lòng thử lại sau."
      }
      if (errorObj.status === 400) {
        return "Thông tin không hợp lệ. Vui lòng kiểm tra lại."
      }
    }

    // Check for message property
    if (errorObj.message && typeof errorObj.message === "string") {
      return cleanErrorMessage(errorObj.message)
    }
  }

  // Fallback
  return "Đã xảy ra lỗi. Vui lòng thử lại."
}

/**
 * Làm sạch thông báo lỗi - xóa mã lỗi HTTP và các thông tin kỹ thuật
 * @param message - Thông báo lỗi gốc
 * @returns Thông báo lỗi đã được làm sạch
 */
function cleanErrorMessage(message: string): string {
  if (!message || typeof message !== "string") {
    return "Đã xảy ra lỗi. Vui lòng thử lại."
  }

  let cleaned = message

  // Remove HTTP status codes and status text
  // Examples: "401 Unauthorized", "500 Internal Server Error", "404 Not Found"
  cleaned = cleaned.replace(/\b\d{3}\s+[A-Za-z\s]+\s*-\s*/g, "")
  cleaned = cleaned.replace(/\b\d{3}\s+[A-Za-z\s]+/g, "")
  
  // Remove status code only (e.g., "401", "500")
  cleaned = cleaned.replace(/^(401|403|404|500|502|503|504)\s*-?\s*/i, "")

  // Map technical terms to user-friendly messages
  const technicalTerms: Record<string, string> = {
    "Unauthorized": "Phiên đăng nhập đã hết hạn",
    "Forbidden": "Bạn không có quyền thực hiện thao tác này",
    "Not Found": "Không tìm thấy dữ liệu",
    "Internal Server Error": "Lỗi server",
    "Bad Request": "Thông tin không hợp lệ",
    "Bad Gateway": "Lỗi kết nối server",
    "Service Unavailable": "Dịch vụ tạm thời không khả dụng",
    "Gateway Timeout": "Kết nối quá lâu",
    "Network Error": "Lỗi kết nối mạng",
    "Connection refused": "Không thể kết nối đến server",
    "ECONNREFUSED": "Không thể kết nối đến server",
    "Failed to fetch": "Lỗi kết nối mạng",
  }

  // Replace technical terms
  for (const [technical, friendly] of Object.entries(technicalTerms)) {
    const regex = new RegExp(technical, "gi")
    cleaned = cleaned.replace(regex, friendly)
  }

  // Remove leading/trailing whitespace and dashes
  cleaned = cleaned.trim().replace(/^[-\s]+|[-\s]+$/g, "")

  // If message is now empty or too short, provide a default
  if (!cleaned || cleaned.length < 5) {
    return "Đã xảy ra lỗi. Vui lòng thử lại."
  }

  // Ensure first letter is uppercase
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)

  // Ensure message ends with a period
  if (!cleaned.endsWith(".") && !cleaned.endsWith("!") && !cleaned.endsWith("?")) {
    cleaned += "."
  }

  return cleaned
}

/**
 * Map specific error types to user-friendly messages
 * Useful for form validation errors, etc.
 */
export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: "Lỗi kết nối. Vui lòng kiểm tra internet và thử lại.",
  TIMEOUT: "Kết nối quá lâu. Vui lòng thử lại.",
  SERVER_UNAVAILABLE: "Server tạm thời không khả dụng. Vui lòng thử lại sau.",

  // Auth errors
  AUTH_EXPIRED: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  AUTH_INVALID: "Thông tin đăng nhập không chính xác.",
  AUTH_REQUIRED: "Vui lòng đăng nhập để tiếp tục.",
  WRONG_PASSWORD: "Mật khẩu không chính xác. Vui lòng thử lại.",
  WRONG_EMAIL: "Email không tồn tại trong hệ thống.",
  
  // Permission errors
  FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
  UNAUTHORIZED: "Bạn cần đăng nhập để thực hiện thao tác này.",

  // Validation errors
  INVALID_INPUT: "Thông tin không hợp lệ. Vui lòng kiểm tra lại.",
  MISSING_REQUIRED: "Vui lòng điền đầy đủ thông tin bắt buộc.",
  EMAIL_EXISTS: "Email đã được sử dụng.",
  INVALID_EMAIL: "Định dạng email không hợp lệ.",
  PASSWORD_WEAK: "Mật khẩu không đủ mạnh. Vui lòng sử dụng ít nhất 8 ký tự, bao gồm số và ký tự đặc biệt.",

  // Resource errors
  NOT_FOUND: "Không tìm thấy dữ liệu. Vui lòng thử lại.",
  ALREADY_EXISTS: "Dữ liệu đã tồn tại. Vui lòng kiểm tra lại.",

  // Server errors
  SERVER_ERROR: "Lỗi server. Vui lòng thử lại sau.",
  DATABASE_ERROR: "Lỗi cơ sở dữ liệu. Vui lòng thử lại sau.",

  // File upload errors
  FILE_TOO_LARGE: "File quá lớn. Vui lòng chọn file nhỏ hơn.",
  INVALID_FILE_TYPE: "Định dạng file không được hỗ trợ.",
  UPLOAD_FAILED: "Tải file lên thất bại. Vui lòng thử lại.",

  // Generic errors
  UNKNOWN_ERROR: "Đã xảy ra lỗi không xác định. Vui lòng thử lại.",
  OPERATION_FAILED: "Thao tác thất bại. Vui lòng thử lại.",
} as const

/**
 * Get a user-friendly error message for login errors
 * Specialized for authentication scenarios
 * 
 * Security Note: Trả về thông báo chung cho tất cả lỗi đăng nhập
 * để tránh lộ thông tin về email có tồn tại hay không
 */
export function getLoginError(error: unknown): string {
  // Kiểm tra nếu là lỗi network hoặc server (giữ nguyên message)
  if (error && typeof error === 'object') {
    const errorObj = error as any
    
    // Network errors - giữ nguyên
    if (errorObj.isNetworkError || errorObj.status === 0) {
      return getUserFriendlyError(error)
    }
    
    // Server errors (500+) - giữ nguyên
    if (errorObj.status >= 500) {
      return getUserFriendlyError(error)
    }
  }
  
  const message = getUserFriendlyError(error)
  
  // Tất cả các lỗi liên quan đến authentication (401, 400, sai email/password, etc.)
  // đều trả về thông báo chung để bảo mật
  if (
    // Lỗi 401, 400, 403
    message.includes("Phiên đăng nhập") ||
    message.includes("hết hạn") ||
    message.includes("Thông tin") ||
    message.includes("không hợp lệ") ||
    message.includes("không có quyền") ||
    // Các từ khóa liên quan đến sai thông tin
    message.includes("sai mật khẩu") ||
    message.includes("password") ||
    message.includes("incorrect") ||
    message.includes("mật khẩu") ||
    message.includes("email") ||
    message.includes("không tìm thấy") ||
    message.includes("not found") ||
    message.includes("invalid") ||
    message.includes("unauthorized") ||
    message.includes("không chính xác") ||
    message.includes("không đúng") ||
    message.includes("sai") ||
    message.includes("wrong")
  ) {
    return "Email hoặc mật khẩu không đúng."
  }

  // Các lỗi khác (network, server, timeout) - giữ nguyên
  return message
}

/**
 * Get a user-friendly error message for registration errors
 * Specialized for registration scenarios
 */
export function getRegisterError(error: unknown): string {
  const message = getUserFriendlyError(error)
  
  // Map common registration error patterns to specific messages
  if (
    message.includes("email") &&
    (message.includes("đã tồn tại") || message.includes("exists"))
  ) {
    return ERROR_MESSAGES.EMAIL_EXISTS
  }

  if (
    message.includes("mật khẩu") &&
    (message.includes("yếu") || message.includes("weak"))
  ) {
    return ERROR_MESSAGES.PASSWORD_WEAK
  }

  return message
}

