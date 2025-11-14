# 🐛 DEBUG FRONTEND - Sản phẩm không hiển thị

## ✅ ĐÃ THÊM DEBUG LOGS

Code đã được update với **debugging logs chi tiết** để xem chính xác lỗi gì.

---

## 🚀 HƯỚNG DẪN DEBUG

### BƯỚC 1: Restart Dev Server (QUAN TRỌNG!)
```bash
# Stop server
Ctrl + C

# Clear cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Start lại
npm run dev
```

### BƯỚC 2: Mở Browser Console
```
F12 → Console tab
```

### BƯỚC 3: Reload Page
```
Ctrl + Shift + R
```

---

## 📊 KIỂM TRA CONSOLE LOGS

Sau khi reload, bạn sẽ thấy **chi tiết logs** trong console:

### ✅ NẾU THÀNH CÔNG:
```javascript
🔄 Fetching products from API...
📦 Raw API response: [Array]
📦 Is array? true
📦 Data length: 2
📋 Product list: [...]
📋 Product list length: 2
Checking product 12: Trà Dưỡng Tâm Thanh Lọc, status: Approved
Checking product 19: Mật ong rừng Gia Lai, status: Approved
✅ Fetched 2 approved products from API
✅ Approved products: [...]
```

→ **Products sẽ hiển thị!** 🎉

---

### ❌ NẾU LỖI - Các trường hợp:

#### Lỗi 1: Network/CORS Error
```javascript
🔄 Fetching products from API...
❌ Failed to fetch products from API: TypeError: Failed to fetch
❌ Error details: {
  message: "Failed to fetch",
  ...
}
```

**Nguyên nhân:** 
- Backend đang cold start (Render sleep)
- CORS issue
- Network connectivity

**Giải pháp:**
1. Đợi 30-60 giây (backend wake up)
2. Reload lại (Ctrl+R)
3. Check Network tab (F12) xem có request đến API không

---

#### Lỗi 2: Empty Response
```javascript
🔄 Fetching products from API...
📦 Raw API response: []
📦 Is array? true
📦 Data length: 0
✅ Fetched 0 approved products from API
```

**Nguyên nhân:** Backend trả về empty array

**Giải pháp:**
1. Check API trực tiếp: https://gialai-ocop-be.onrender.com/api/products
2. Nếu empty → Database không có products approved
3. Run SQL: `UPDATE "Products" SET "Status" = 'Approved' WHERE "Id" IN (12, 19)`

---

#### Lỗi 3: Response không phải Array
```javascript
🔄 Fetching products from API...
📦 Raw API response: {...}
📦 Is array? false
📋 Product list: []
📋 Product list length: 0
✅ Fetched 0 approved products from API
```

**Nguyên nhân:** Backend trả về object thay vì array

**Giải pháp:** Check response structure, có thể cần extract data từ `response.items` hoặc `response.data`

---

#### Lỗi 4: Products Không Có Status "Approved"
```javascript
🔄 Fetching products from API...
📦 Raw API response: [...]
📦 Is array? true
📦 Data length: 2
📋 Product list: [...]
📋 Product list length: 2
Checking product 12: Trà Dưỡng Tâm Thanh Lọc, status: null
Checking product 19: Mật ong rừng Gia Lai, status: PendingApproval
✅ Fetched 0 approved products from API
```

**Nguyên nhân:** Products có status khác "Approved"

**Giải pháp:** Update database với SQL để set status = "Approved"

---

## 🔍 CHECK NETWORK TAB

### Bước 1: Mở Network Tab
```
F12 → Network tab → Reload (Ctrl+R)
```

### Bước 2: Tìm Request
Tìm request: **`products?pageSize=100`**

### Bước 3: Check Details
Click vào request đó, check:

**Status Code:**
- ✅ `200 OK` → Success
- ❌ `404` → Wrong URL
- ❌ `500` → Server error
- ❌ `0 (cancelled)` → CORS issue

**Response Tab:**
Phải thấy JSON:
```json
[
  {
    "id": 12,
    "name": "Trà Dưỡng Tâm Thanh Lọc",
    "status": "Approved",
    ...
  },
  {
    "id": 19,
    "name": "Mật ong rừng Gia Lai",
    "status": "Approved",
    ...
  }
]
```

**Headers Tab:**
- Request URL: `https://gialai-ocop-be.onrender.com/api/products?pageSize=100`
- Request Method: `GET`
- Status Code: `200`

---

## 🧪 TEST API TRỰC TIẾP

### Test 1: Browser
```
https://gialai-ocop-be.onrender.com/api/products
```

Phải thấy JSON với 2 products.

### Test 2: Console Fetch
```javascript
// Paste vào Console (F12):
fetch('https://gialai-ocop-be.onrender.com/api/products')
  .then(r => r.json())
  .then(d => {
    console.log('✅ API Data:', d)
    console.log('✅ Count:', d.length)
    console.log('✅ Approved:', d.filter(p => p.status === 'Approved').length)
  })
  .catch(e => console.error('❌ Error:', e))
```

**Expected output:**
```javascript
✅ API Data: Array(2)
✅ Count: 2
✅ Approved: 2
```

---

## 🔧 COMMON FIXES

### Fix 1: Clear Everything
```bash
# Stop server
Ctrl + C

# Clear all cache
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules\.cache
Remove-Item -Recurse -Force .turbo

# Start clean
npm run dev
```

### Fix 2: Clear Browser
```
Ctrl + Shift + Delete
→ Check: Cookies, Cached images, Site data
→ Time range: All time
→ Clear data
```

### Fix 3: Try Different Browser
- Chrome → Try Edge
- Edge → Try Firefox
- Check if issue persists

### Fix 4: Check Environment
```bash
# Check if .env.local exists
Get-Content .env.local

# Should show:
# NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
```

---

## 📝 ERROR MESSAGES GIẢI NGHĨA

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| `Failed to fetch` | Network error | Wait 30s, reload |
| `CORS policy` | CORS blocked | Backend issue |
| `Timeout` | Request too slow | Backend cold start |
| `404 Not Found` | Wrong URL | Check API_BASE_URL |
| `500 Server Error` | Backend crash | Check backend logs |
| `Không thể tải sản phẩm` | Generic error | Check console for details |

---

## 🆘 LAST RESORT

Nếu tất cả đều thất bại, dùng local backend:

```bash
# Terminal 1: Backend
cd E:\SE18\SEP\GiaLai-OCOP-BE
dotnet run

# Terminal 2: Frontend
# Tạo .env.local:
echo NEXT_PUBLIC_API_BASE=https://localhost:5001/api > .env.local

# Start
npm run dev
```

---

## ✅ SUCCESS CRITERIA

Khi mọi thứ OK:

**Console:**
```javascript
✅ Fetched 2 approved products from API
```

**UI:**
- Section "Sản phẩm OCOP nổi bật": 2 products
  1. Trà Dưỡng Tâm Thanh Lọc - 55,000₫
  2. Mật ong rừng Gia Lai - 150,000₫

**Network Tab:**
- Request: `products?pageSize=100`
- Status: 200 OK
- Response: JSON array [2 items]

---

**🎯 BÁO CÁO KẾT QUẢ SAU KHI DEBUG!**

Paste console logs và screenshot để tôi giúp debug tiếp!

