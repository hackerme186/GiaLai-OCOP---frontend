# 📚 GIALAI OCOP - TÀI LIỆU TỔNG HỢP

> **Tổng hợp tất cả tài liệu kỹ thuật cho dự án GiaLai OCOP Frontend**  
> Last Updated: November 14, 2025

---

# 📖 MỤC LỤC

1. [🚀 Quick Start](#quick-start)
2. [✅ CORS Fix](#cors-fix)
3. [🐛 Debug & Troubleshooting](#debug)
4. [📊 API Implementation](#api-implementation)
5. [🔧 Configuration](#configuration)
6. [📋 Production Checklist](#production)

---

<a name="quick-start"></a>
# 🚀 QUICK START - 3 BƯỚC

## Bước 1: Start Frontend
```bash
npm run dev
```
✅ Frontend: `http://localhost:3000`  
✅ Backend: `https://gialai-ocop-be.onrender.com/api`

## Bước 2: Hard Reload Browser
```
Ctrl + Shift + R
```

## Bước 3: Verify
- ✅ Xem 2 products approved
- ✅ Check Console (F12) không còn errors

> ⚠️ Backend trên Render sleep sau 15 phút. Lần đầu mất 30-60s để wake up.

---

<a name="cors-fix"></a>
# ✅ CORS ERROR - ĐÃ FIX

## Vấn đề
```
CORS request blocked: credentials + wildcard origin (*)
```

## Nguyên nhân
- Backend: `Access-Control-Allow-Origin: *`
- Frontend: `credentials: "include"`
- **CORS không cho phép cả 2 cùng lúc!**

## Giải pháp
**File:** `src/lib/api.ts` line 44

```typescript
// ❌ TRƯỚC
credentials: "include"

// ✅ SAU
credentials: "omit"  // Don't send cookies
```

## Tại sao OK?
- Products API là public data
- Không cần cookies để xem products
- Fix CORS với wildcard origin

---

<a name="debug"></a>
# 🐛 DEBUG & TROUBLESHOOTING

## Console Logs Thành Công
```javascript
🔄 Fetching products from API...
📦 Data length: 2
Checking product 12: Trà Dưỡng Tâm Thanh Lọc, status: Approved
Checking product 19: Mật ong rừng Gia Lai, status: Approved
✅ Fetched 2 approved products from API
```

## Các Lỗi Thường Gặp

### ❌ "Failed to fetch"
**Nguyên nhân:** Backend sleep (Render free tier)  
**Fix:**
1. Đợi 30-60s - Backend wake up
2. Reload page (Ctrl+R)
3. Test: https://gialai-ocop-be.onrender.com/api/products

### ❌ CORS Blocked
**Nguyên nhân:** Đã fix rồi!  
**Verify:** Hard reload (Ctrl+Shift+R) + Check Issues tab

### ❌ Chỉ thấy 2 products
**Nguyên nhân:** Database chỉ có 2 products `Status = "Approved"`  
**Fix:** Run SQL trong Supabase:
```sql
UPDATE "Products" SET "Status" = 'Approved' WHERE "Status" IS NULL;
```

## Restart Instructions

### Clear Everything & Restart:
```bash
# 1. Stop server
Ctrl + C

# 2. Clear cache
Remove-Item -Recurse -Force .next

# 3. Start
npm run dev

# 4. Clear browser
Ctrl + Shift + Delete → Clear cache

# 5. Hard reload
Ctrl + Shift + R
```

## Test API Trực Tiếp

### Test trong Console (F12):
```javascript
fetch('https://gialai-ocop-be.onrender.com/api/products')
  .then(r => r.json())
  .then(d => console.log('✅ Products:', d.length))
  .catch(e => console.error('❌ Error:', e))
```

**Expected:** `✅ Products: 2`

---

<a name="api-implementation"></a>
# 📊 API IMPLEMENTATION

## API Helper Service
**File:** `src/lib/api.ts`

```typescript
// Generic request function
async function request<TResponse>(
  path: string,
  options: { json?: any; silent?: boolean } = {}
): Promise<TResponse>
```

**Features:**
- ✅ GET, POST, PUT, DELETE
- ✅ Auto JWT token attachment
- ✅ Error handling
- ✅ Silent mode
- ✅ CORS fixed (credentials: "omit")

## API Base URL
```typescript
export const API_BASE_URL = "https://gialai-ocop-be.onrender.com/api"
```

## Product Endpoints

### GET /products
```typescript
const products = await getProducts({
  pageSize: 100,
  status: 'Approved',
  search: 'cà phê'
})
```

### GET /products/:id
```typescript
const product = await getProduct(12)
```

### POST /products
```typescript
const newProduct = await createProduct({
  name: "Cà phê",
  price: 150000,
  ...
})
```

### PUT /products/:id
```typescript
await updateProduct(12, { price: 180000 })
```

### DELETE /products/:id
```typescript
await deleteProduct(12)
```

## TypeScript Interface
```typescript
interface Product {
  id: number
  name: string
  description: string
  price: number
  status: string  // "Approved" | "PendingApproval" | "Rejected"
  ocopRating?: number
  imageUrl?: string
  categoryName?: string
  ...
}
```

## Approved Products Filter

### Components đã implement:
1. **FeaturedProducts** (`src/components/home/FeaturedProducts.tsx`)
2. **MapSection** (`src/components/home/MapSection.tsx`)
3. **Products Page** (`src/app/products/page.tsx`)

### Filter Logic:
```typescript
const approvedProducts = allProducts.filter((p: Product) => 
  p.status === "Approved"
)
```

### Current Status:
- ✅ 2 products có `status = "Approved"` → Hiển thị
- ❌ 8 products có `status = NULL` → Không hiển thị

---

<a name="configuration"></a>
# 🔧 CONFIGURATION

## Environment Variables

### Default (Production):
```typescript
// src/lib/api.ts
export const API_BASE_URL = "https://gialai-ocop-be.onrender.com/api"
```

### Override với .env.local:
```bash
# Production
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api

# Local development
NEXT_PUBLIC_API_BASE=https://localhost:5001/api
```

### Apply changes:
```bash
npm run dev  # Restart to apply
```

## Database Setup

### Update Products Status:
```sql
-- Chạy trong Supabase SQL Editor
-- https://supabase.com/dashboard/project/obafbtrimbjllrsonszz

UPDATE "Products"
SET "Status" = 'Approved'
WHERE "Status" IS NULL;

-- Verify
SELECT "Id", "Name", "Status" FROM "Products";
```

---

<a name="production"></a>
# 📋 PRODUCTION CHECKLIST

## ✅ Đã Hoàn Thành

| Feature | Status | Notes |
|---------|--------|-------|
| API Integration | ✅ Done | GET, POST, PUT, DELETE |
| CORS Fix | ✅ Fixed | credentials: "omit" |
| Approved Filter | ✅ Done | Show 2 products |
| Error Handling | ✅ Done | With debug logs |
| Loading States | ✅ Done | UI spinners |
| TypeScript Types | ✅ Done | Full type safety |
| Backend Connection | ✅ Working | Render production |

## ⚠️ Known Issues

1. **Chỉ 2 products hiển thị**
   - Nguyên nhân: Database chỉ có 2 products approved
   - Fix: Run SQL update (xem phần Configuration)

2. **Backend Cold Start**
   - Nguyên nhân: Render free tier sleep sau 15 phút
   - Behavior: Request đầu tiên mất 30-60s
   - Fix: Đợi hoặc dùng local backend

## URLs

### Frontend
- Trang chủ: http://localhost:3000
- Products: http://localhost:3000/products
- Login: http://localhost:3000/login
- Admin: http://localhost:3000/admin

### Backend
- API: https://gialai-ocop-be.onrender.com/api
- Swagger: https://gialai-ocop-be.onrender.com/swagger
- Products: https://gialai-ocop-be.onrender.com/api/products

---

# 🎯 COMMON WORKFLOWS

## Workflow 1: Development
```bash
# Start frontend
npm run dev

# Visit
http://localhost:3000

# Check console
F12 → Console → Xem logs
```

## Workflow 2: Fix CORS/Connection Issues
```bash
# 1. Hard reload
Ctrl + Shift + R

# 2. Clear cache
Ctrl + Shift + Delete

# 3. Restart dev server
Ctrl + C → npm run dev
```

## Workflow 3: Update Database
```sql
-- 1. Mở Supabase SQL Editor
-- 2. Run SQL
UPDATE "Products" SET "Status" = 'Approved' WHERE "Status" IS NULL;

-- 3. Reload frontend
Ctrl + R
```

## Workflow 4: Debug API
```javascript
// 1. Open Console (F12)
// 2. Test API
fetch('https://gialai-ocop-be.onrender.com/api/products')
  .then(r => r.json())
  .then(d => console.log(d))

// 3. Check logs
// Xem: 🔄, 📦, ✅, ❌
```

---

# 🔍 DEBUGGING CHECKLIST

Khi gặp lỗi, check theo thứ tự:

- [ ] **Console logs:** F12 → Console → Có `✅ Fetched X products`?
- [ ] **Network tab:** F12 → Network → Request `products?pageSize=100` status 200?
- [ ] **Issues tab:** F12 → Issues → Còn CORS errors?
- [ ] **Backend online:** Mở https://gialai-ocop-be.onrender.com/api/products có JSON?
- [ ] **Cache clear:** Đã Ctrl+Shift+R?
- [ ] **Dev server:** Đã restart npm run dev?

---

# 📊 ARCHITECTURE

```
Frontend (Next.js)
    ↓
src/lib/api.ts (API Helper)
    ↓ HTTP Request
Backend API (Render)
    ↓
Supabase PostgreSQL
```

**Key Files:**
- `src/lib/api.ts` - API helper & all endpoints
- `src/components/home/FeaturedProducts.tsx` - Featured products
- `src/components/home/MapSection.tsx` - Map products
- `src/app/products/page.tsx` - Products page

---

# 🚀 NEXT STEPS

## Để thấy tất cả 10 products:

1. **Run SQL:**
```sql
UPDATE "Products" SET "Status" = 'Approved' WHERE "Status" IS NULL;
```

2. **Reload frontend:**
```
Ctrl + R
```

3. **Verify:**
- Should see 10 products
- Console: `✅ Fetched 10 products`

## Để deploy production:

1. **Build:**
```bash
npm run build
npm start  # Test production build
```

2. **Deploy:**
- Vercel/Netlify
- Set env: `NEXT_PUBLIC_API_BASE`

---

# 📞 SUPPORT & LINKS

## Documents
- `README.md` - Main readme
- `SETUP_DATABASE.sql` - SQL scripts
- `DOCS.md` - This file (tổng hợp)

## External Links
- Backend Swagger: https://gialai-ocop-be.onrender.com/swagger
- Supabase: https://supabase.com/dashboard/project/obafbtrimbjllrsonszz

---

**Last Updated:** November 14, 2025  
**Status:** ✅ Production Ready  
**Current Products:** 2 approved (ID: 12, 19)

🎉 **DONE!**

