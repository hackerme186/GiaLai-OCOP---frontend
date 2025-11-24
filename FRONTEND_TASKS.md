# 📋 DANH SÁCH CÔNG VIỆC CẦN LÀM - FRONTEND

## 📊 TỔNG QUAN

Dựa trên yêu cầu Enterprise Admin và code hiện tại, đây là danh sách chi tiết những việc cần làm cho **FRONTEND**.

---

## 🟢 FRONTEND - CẦN TÍCH HỢP API

### 1. **OrderManagementTab.tsx**

**File:** `src/components/enterprise/OrderManagementTab.tsx`

**Cần thêm:**
- [ ] **Modal Assign Shipper**
  - Button "Gán shipper" cho mỗi đơn hàng (status = "Processing")
  - Modal hiển thị danh sách shippers từ `getShippers()`
  - Gọi `assignOrderToShipper(orderId, shipperId)`
  - Refresh danh sách đơn hàng sau khi assign

- [ ] **Button Export Excel**
  - Thêm button "Xuất Excel" trong header
  - Sử dụng `exportOrdersToExcel(filteredOrders)`
  - Filter theo status/date range trước khi export

- [ ] **Button Print Invoice**
  - Thêm button "In hóa đơn" cho mỗi đơn hàng
  - Sử dụng `printInvoice(order)`

**Code mẫu:**
```tsx
// Assign Shipper Modal
const [showAssignModal, setShowAssignModal] = useState(false)
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
const [shippers, setShippers] = useState<Shipper[]>([])

const loadShippers = async () => {
  try {
    const data = await getShippers()
    setShippers(data)
  } catch (err) {
    console.error("Failed to load shippers:", err)
  }
}

const handleAssignShipper = async (orderId: number, shipperId: number) => {
  try {
    await assignOrderToShipper(orderId, shipperId)
    setSuccessMessage(`Đã gán đơn hàng #${orderId} cho shipper thành công!`)
    await loadOrders()
    setShowAssignModal(false)
  } catch (err) {
    alert(err instanceof Error ? err.message : "Không thể gán shipper")
  }
}
```

---

### 2. **InventoryTab.tsx**

**File:** `src/components/enterprise/InventoryTab.tsx`

**Cần sửa:**
- [ ] **API Integration cho Inventory History**
  - Thay thế mock data bằng `getInventoryHistory(productId)`
  - Load history khi mở modal điều chỉnh

- [ ] **Persist Stock Adjustments**
  - Khi điều chỉnh tồn kho, gọi `updateProductStock(productId, { stockQuantity, stockStatus })`
  - Hiển thị loading state và error handling
  - Refresh danh sách sản phẩm sau khi cập nhật

**Code mẫu:**
```tsx
const handleAdjustStock = async () => {
  if (!selectedProduct || !adjustQuantity || !adjustReason) {
    alert("Vui lòng điền đầy đủ thông tin")
    return
  }

  const quantity = parseInt(adjustQuantity)
  if (isNaN(quantity) || quantity === 0) {
    alert("Số lượng không hợp lệ")
    return
  }

  try {
    setSaving(true)
    const currentQuantity = selectedProduct.stockQuantity ?? 0
    const newQuantity = Math.max(0, currentQuantity + quantity)
    
    // Determine stock status
    let newStockStatus: string
    if (newQuantity === 0) {
      newStockStatus = "OutOfStock"
    } else if (newQuantity <= lowStockThreshold) {
      newStockStatus = "LowStock"
    } else {
      newStockStatus = "InStock"
    }
    
    // Call API
    await updateProductStock(selectedProduct.id, {
      stockQuantity: newQuantity,
      stockStatus: newStockStatus,
    })
    
    // Refresh products
    await loadProducts()
    setShowAdjustModal(false)
    setSuccess("Đã điều chỉnh tồn kho thành công!")
  } catch (err) {
    alert(err instanceof Error ? err.message : "Không thể điều chỉnh tồn kho")
  } finally {
    setSaving(false)
  }
}
```

---

### 3. **NotificationsTab.tsx**

**File:** `src/components/enterprise/NotificationsTab.tsx`

**Cần sửa:**
- [ ] **API Integration**
  - Thay thế mock data bằng `getNotifications({ unreadOnly: filter === "unread" })`
  - Implement `markNotificationAsRead(id)`
  - Implement `markAllNotificationsAsRead()`
  - Implement `deleteNotification(id)`
  - Error handling và loading states

**Code mẫu:**
```tsx
const loadNotifications = async () => {
  try {
    setLoading(true)
    const params: any = {}
    if (filter === "unread") params.unreadOnly = true
    const data = await getNotifications(params)
    setNotifications(data)
  } catch (err) {
    console.error("Failed to load notifications:", err)
    setError("Không thể tải thông báo")
  } finally {
    setLoading(false)
  }
}

const markAsRead = async (id: number) => {
  try {
    await markNotificationAsRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  } catch (err) {
    console.error("Failed to mark as read:", err)
  }
}
```

---

### 4. **SettingsTab.tsx**

**File:** `src/components/enterprise/SettingsTab.tsx`

**Cần sửa:**
- [ ] **API Integration**
  - Load settings từ `getEnterpriseSettings(enterpriseId)` khi mount
  - Save settings bằng `updateEnterpriseSettings(enterpriseId, settings)`
  - Fallback về localStorage nếu backend chưa có API
  - Error handling

**Code mẫu:**
```tsx
const loadSettings = async () => {
  if (!user?.enterpriseId) return
  
  try {
    setLoading(true)
    const data = await getEnterpriseSettings(user.enterpriseId)
    if (data) {
      setShippingMethods(data.shippingMethods || [])
      setSettings({
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        contactAddress: data.contactAddress,
        businessHours: data.businessHours,
        returnPolicy: data.returnPolicy || "",
        shippingPolicy: data.shippingPolicy || "",
      })
    }
  } catch (err) {
    // Fallback to localStorage
    const stored = localStorage.getItem(`enterprise_settings_${user.enterpriseId}`)
    if (stored) {
      const parsed = JSON.parse(stored)
      setShippingMethods(parsed.shippingMethods || [])
      setSettings(prev => ({ ...prev, ...parsed }))
    }
  } finally {
    setLoading(false)
  }
}
```

---

### 5. **EnterpriseProfileTab.tsx**

**File:** `src/components/enterprise/EnterpriseProfileTab.tsx`

**Cần thêm:**
- [ ] **Hiển thị Approval Status**
  - Thêm section hiển thị trạng thái phê duyệt
  - Dựa vào `enterprise.ocopRating`:
    - `null` → "Chờ duyệt" (Pending)
    - Có giá trị → "Đã duyệt" (Approved) - hiển thị số sao
  - Màu sắc: Pending (vàng), Approved (xanh)

- [ ] **Upload Tài liệu xác thực**
  - Tích hợp với `FileUploadController.UploadDocument`
  - Hiển thị danh sách documents đã upload
  - Xóa document (nếu backend có API)

**Code mẫu:**
```tsx
// Approval Status Section
{enterprise && (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Trạng thái phê duyệt</h3>
    <div className="flex items-center gap-4">
      {enterprise.ocopRating ? (
        <>
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold">
            Đã duyệt
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: enterprise.ocopRating }).map((_, i) => (
              <span key={i} className="text-yellow-400 text-xl">⭐</span>
            ))}
          </div>
        </>
      ) : (
        <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-semibold">
          Chờ duyệt
        </span>
      )}
    </div>
  </div>
)}
```

---

### 6. **ReportsTab.tsx**

**File:** `src/components/enterprise/ReportsTab.tsx`

**Cần thêm:**
- [ ] **Date Range Filter**
  - Dropdown: "Hôm nay", "Tuần này", "Tháng này", "Năm nay", "Tùy chọn"
  - Date picker cho "Tùy chọn"
  - Tính toán lại stats theo date range

- [ ] **Shipper Performance Report** (nếu có dữ liệu)
  - Bảng thống kê shipper
  - Số đơn đã giao, tỷ lệ thành công, thời gian trung bình

**Code mẫu:**
```tsx
const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year" | "custom">("month")
const [customStartDate, setCustomStartDate] = useState<string>("")
const [customEndDate, setCustomEndDate] = useState<string>("")

const getDateRange = () => {
  const now = new Date()
  switch (dateRange) {
    case "today":
      return { start: new Date(now.setHours(0, 0, 0, 0)), end: new Date() }
    case "week":
      const weekStart = new Date(now.setDate(now.getDate() - 7))
      return { start: weekStart, end: new Date() }
    case "month":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: monthStart, end: new Date() }
    case "year":
      const yearStart = new Date(now.getFullYear(), 0, 1)
      return { start: yearStart, end: new Date() }
    case "custom":
      return {
        start: customStartDate ? new Date(customStartDate) : null,
        end: customEndDate ? new Date(customEndDate) : null
      }
  }
}

// Filter orders by date range
const filteredOrders = useMemo(() => {
  const range = getDateRange()
  if (!range.start || !range.end) return orders
  
  return orders.filter(order => {
    const orderDate = new Date(order.orderDate)
    return orderDate >= range.start! && orderDate <= range.end!
  })
}, [orders, dateRange, customStartDate, customEndDate])
```

---

## 📝 TÓM TẮT ƯU TIÊN - FRONTEND

### 🔴 High Priority (Làm ngay)
1. **OrderManagementTab** - Assign Shipper, Export Excel, Print Invoice
2. **InventoryTab** - API integration cho stock adjustments

### 🟡 Medium Priority
3. **NotificationsTab** - API integration
4. **EnterpriseProfileTab** - Approval status display

### 🟢 Low Priority (Có thể làm sau)
5. **SettingsTab** - API integration
6. **ReportsTab** - Date range filter

---

## 🎯 MỤC TIÊU FRONTEND

- ✅ Tất cả UI components đã có
- ✅ Frontend API functions đã có (một số là placeholder trong `src/lib/api.ts`)
- ⚠️ Cần tích hợp API vào UI components
- ⚠️ Cần test và xử lý error handling đầy đủ

---

## 📌 LƯU Ý

- Một số API functions trong `src/lib/api.ts` đang là placeholder (trả về empty array hoặc throw error)
- Cần đợi backend implement các APIs tương ứng trước khi tích hợp vào frontend
- Có thể implement UI trước và dùng mock data, sau đó thay thế bằng API calls khi backend sẵn sàng

