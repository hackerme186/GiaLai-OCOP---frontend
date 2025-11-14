# 🚀 HƯỚNG DẪN RESTART FRONTEND

## ⚠️ BẠN ĐANG THẤY LỖI: "Không thể tải sản phẩm từ server"

### ✅ Backend đang HOẠT ĐỘNG (đã verify)
API: https://gialai-ocop-be.onrender.com/api/products
Status: ✅ Trả về 2 products approved

### ❌ Frontend không connect được

---

## 🔧 FIX - Làm theo thứ tự:

### BƯỚC 1: Kill Dev Server Hoàn Toàn
```bash
# Trong terminal đang chạy npm run dev:
Ctrl + C

# Đợi 3 giây để process thực sự stop
```

### BƯỚC 2: Clear Next.js Cache
```bash
# Trong terminal frontend:
rd /s /q .next
rd /s /q node_modules\.cache

# Hoặc PowerShell:
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
```

### BƯỚC 3: Start Lại Dev Server
```bash
npm run dev
```

### BƯỚC 4: Clear Browser Cache
**Chrome/Edge:**
1. Mở DevTools: `F12`
2. Right-click nút Reload
3. Chọn "Empty Cache and Hard Reload"

**Hoặc:**
```
Ctrl + Shift + Delete
→ Check "Cached images and files"
→ Click "Clear data"
```

### BƯỚC 5: Hard Reload Page
```
Ctrl + Shift + R
```

---

## 🔍 KIỂM TRA CONSOLE

Mở DevTools (F12) → Console tab

**Nếu OK, bạn sẽ thấy:**
```javascript
✅ Fetched 2 approved products from API
```

**Nếu vẫn lỗi, bạn sẽ thấy:**
```javascript
❌ Failed to fetch products from API: [Error details]
```

---

## 🐛 NẾU VẪN LỖI - DEBUG THÊM

### Check Network Tab
1. F12 → Network tab
2. Reload page (Ctrl+R)
3. Tìm request: `products?pageSize=100`
4. Click vào request đó
5. Check:
   - Status code: Phải là 200
   - Response: Phải có JSON data
   - Headers: Check CORS

### Common Issues:

#### Issue 1: CORS Error
```
Access to fetch at 'https://gialai-ocop-be.onrender.com/api/products' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Fix:** Backend cần enable CORS cho localhost:3000

#### Issue 2: Timeout
```
Failed to fetch: The request timed out
```

**Fix:** Backend đang cold start, đợi 30-60s

#### Issue 3: Network Error
```
Failed to fetch: Network request failed
```

**Fix:** 
- Check internet connection
- Check firewall/antivirus
- Try different browser

---

## 📝 TEST BACKEND TRỰC TIẾP

### Test 1: Mở trong Browser
```
https://gialai-ocop-be.onrender.com/api/products
```

Phải thấy JSON:
```json
[
  { "id": 12, "name": "Trà Dưỡng Tâm Thanh Lọc", "status": "Approved" },
  { "id": 19, "name": "Mật ong rừng Gia Lai", "status": "Approved" }
]
```

### Test 2: Test với Fetch trong Console
```javascript
// Mở Console (F12), paste code này:
fetch('https://gialai-ocop-be.onrender.com/api/products')
  .then(r => r.json())
  .then(d => console.log('✅ Data:', d))
  .catch(e => console.error('❌ Error:', e))
```

Nếu thấy "✅ Data: [...]" → Backend OK, vấn đề ở frontend code
Nếu thấy "❌ Error: ..." → CORS hoặc network issue

---

## 🆘 NẾU TẤT CẢ ĐỀU THẤT BẠI

### Option 1: Dùng Local Backend
```bash
# Terminal 1: Start backend
cd E:\SE18\SEP\GiaLai-OCOP-BE
dotnet run

# Terminal 2: Update frontend API URL
# Tạo file .env.local:
NEXT_PUBLIC_API_BASE=https://localhost:5001/api

# Terminal 2: Start frontend
npm run dev
```

### Option 2: Check Frontend API Config
File: `src/lib/api.ts` line 8
```typescript
export const API_BASE_URL = "https://gialai-ocop-be.onrender.com/api"
```

Phải đúng URL trên, không có `/products` ở cuối!

---

## ✅ SUCCESS CRITERIA

Sau khi làm theo hướng dẫn, bạn phải thấy:

**Homepage (localhost:3000):**
- ✅ Section "Sản phẩm OCOP nổi bật": 2 products
  1. Trà Dưỡng Tâm Thanh Lọc - 55,000₫
  2. Mật ong rừng Gia Lai - 150,000₫

**Console:**
```javascript
✅ Fetched 2 approved products from API
✅ Map section: 2 approved products
```

**Network Tab:**
- Request: GET /api/products?pageSize=100
- Status: 200 OK
- Response: JSON array with 2 items

---

**🎯 HÃY LÀM THEO CÁC BƯỚC TRÊN VÀ BÁO CÁO KẾT QUẢ!**

