/**
 * Shipping Address Management Service
 * Quản lý danh sách địa chỉ giao hàng đã lưu
 */

export interface SavedShippingAddress {
  id: string;
  label?: string; // Ví dụ: "Nhà riêng", "Công ty", "Địa chỉ 1"
  address: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;
}

const STORAGE_KEY = 'saved_shipping_addresses';

/**
 * Lấy ngày tạo tài khoản từ user profile hoặc API
 * Trả về ngày tạo tài khoản từ database, không phải ngày hiện tại
 */
async function getAccountCreatedAt(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  try {
    // Ưu tiên lấy từ user profile đã lưu trong localStorage
    const { getUserProfile } = await import("@/lib/auth");
    const profile = getUserProfile();
    if (profile?.createdAt) {
      return profile.createdAt;
    }

    // Nếu không có trong profile, thử lấy từ API
    const { getCurrentUser } = await import("@/lib/api");
    const user = await getCurrentUser();
    if (user?.createdAt) {
      // Cập nhật profile để lần sau không cần gọi API
      if (profile) {
        const { setUserProfile } = await import("@/lib/auth");
        setUserProfile({ ...profile, createdAt: user.createdAt });
      }
      return user.createdAt;
    }
  } catch (error) {
    console.warn('Không thể lấy ngày tạo tài khoản:', error);
  }

  return null;
}

/**
 * Lấy ngày tạo tài khoản (sync version, dùng khi không thể async)
 * Ưu tiên từ localStorage profile
 */
function getAccountCreatedAtSync(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const { getUserProfile } = require("@/lib/auth");
    const profile = getUserProfile();
    return profile?.createdAt || null;
  } catch {
    return null;
  }
}

/**
 * Lấy danh sách địa chỉ giao hàng đã lưu
 */
export function getSavedShippingAddresses(): SavedShippingAddress[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as SavedShippingAddress[];
  } catch (error) {
    console.error('Error loading saved shipping addresses:', error);
    return [];
  }
}

/**
 * Lưu danh sách địa chỉ giao hàng
 */
function saveShippingAddresses(addresses: SavedShippingAddress[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  } catch (error) {
    console.error('Error saving shipping addresses:', error);
  }
}

/**
 * Thêm địa chỉ giao hàng mới
 * Sử dụng ngày tạo tài khoản từ database thay vì ngày hiện tại
 */
export function addShippingAddress(
  address: string,
  label?: string,
  isDefault: boolean = false
): SavedShippingAddress {
  const addresses = getSavedShippingAddresses();

  // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
  if (isDefault) {
    addresses.forEach(addr => addr.isDefault = false);
  }

  // Lấy ngày tạo tài khoản từ database (từ user profile đã lưu)
  const accountCreatedAt = getAccountCreatedAtSync();

  // Sử dụng ngày tạo tài khoản, nếu không có thì fallback về ngày hiện tại
  const createdAt = accountCreatedAt || new Date().toISOString();

  // Nếu không có ngày tạo tài khoản, log warning để developer biết
  if (!accountCreatedAt && typeof window !== 'undefined') {
    console.warn('⚠️ Không tìm thấy ngày tạo tài khoản. Sử dụng ngày hiện tại. Hãy đảm bảo user profile có createdAt.');
  }

  const newAddress: SavedShippingAddress = {
    id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    label: label || undefined,
    address: address.trim(),
    isDefault: isDefault || addresses.length === 0, // Mặc định địa chỉ đầu tiên
    createdAt: createdAt, // Sử dụng ngày tạo tài khoản từ database
  };

  addresses.push(newAddress);
  saveShippingAddresses(addresses);

  return newAddress;
}

/**
 * Cập nhật địa chỉ giao hàng
 */
export function updateShippingAddress(
  id: string,
  updates: Partial<Pick<SavedShippingAddress, 'address' | 'label' | 'isDefault'>>
): SavedShippingAddress | null {
  const addresses = getSavedShippingAddresses();
  const index = addresses.findIndex(addr => addr.id === id);

  if (index === -1) return null;

  // Nếu đặt làm mặc định, bỏ mặc định của các địa chỉ khác
  if (updates.isDefault === true) {
    addresses.forEach(addr => {
      if (addr.id !== id) addr.isDefault = false;
    });
  }

  addresses[index] = {
    ...addresses[index],
    ...updates,
    address: updates.address?.trim() || addresses[index].address,
    updatedAt: new Date().toISOString(),
  };

  saveShippingAddresses(addresses);
  return addresses[index];
}

/**
 * Xóa địa chỉ giao hàng
 */
export function deleteShippingAddress(id: string): boolean {
  const addresses = getSavedShippingAddresses();
  const filtered = addresses.filter(addr => addr.id !== id);

  if (filtered.length === addresses.length) return false; // Không tìm thấy

  // Nếu xóa địa chỉ mặc định, đặt địa chỉ đầu tiên làm mặc định
  const deletedWasDefault = addresses.find(addr => addr.id === id)?.isDefault;
  if (deletedWasDefault && filtered.length > 0) {
    filtered[0].isDefault = true;
  }

  saveShippingAddresses(filtered);
  return true;
}

/**
 * Đặt địa chỉ làm mặc định
 */
export function setDefaultShippingAddress(id: string): boolean {
  const addresses = getSavedShippingAddresses();
  const index = addresses.findIndex(addr => addr.id === id);

  if (index === -1) return false;

  addresses.forEach(addr => addr.isDefault = false);
  addresses[index].isDefault = true;
  addresses[index].updatedAt = new Date().toISOString();

  saveShippingAddresses(addresses);
  return true;
}

/**
 * Lấy địa chỉ mặc định
 */
export function getDefaultShippingAddress(): SavedShippingAddress | null {
  const addresses = getSavedShippingAddresses();
  const defaultAddr = addresses.find(addr => addr.isDefault);

  if (defaultAddr) return defaultAddr;

  // Nếu không có địa chỉ mặc định, trả về địa chỉ đầu tiên
  return addresses.length > 0 ? addresses[0] : null;
}

/**
 * Đồng bộ địa chỉ từ backend (địa chỉ chính trong user profile)
 * Khi user cập nhật địa chỉ chính, thêm vào danh sách nếu chưa có
 */
export function syncMainAddressFromBackend(mainAddress: string | undefined): void {
  if (!mainAddress || !mainAddress.trim()) return;

  const addresses = getSavedShippingAddresses();
  const trimmedMainAddress = mainAddress.trim();

  // Kiểm tra xem địa chỉ này đã có trong danh sách chưa
  const exists = addresses.some(addr => addr.address.trim() === trimmedMainAddress);

  if (!exists) {
    // Thêm địa chỉ từ backend vào danh sách
    addShippingAddress(trimmedMainAddress, 'Địa chỉ chính', true);
  } else {
    // Cập nhật địa chỉ hiện có và đặt làm mặc định
    const existingIndex = addresses.findIndex(addr => addr.address.trim() === trimmedMainAddress);
    if (existingIndex !== -1) {
      updateShippingAddress(addresses[existingIndex].id, {
        isDefault: true,
        address: trimmedMainAddress
      });
    }
  }
}

