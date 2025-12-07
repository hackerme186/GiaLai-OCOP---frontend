# 📘 FE Setup Guide - Hướng Dẫn Setup Frontend

File này hướng dẫn **logic chuẩn** để setup Frontend project, đảm bảo FE hoạt động đúng cả local và production mà không cần chỉnh code.

---

## 🎯 Mục Tiêu

**FE tự động chuyển đổi giữa local development và production deployment:**
- ✅ Local: Dùng `.env.local` → API: `http://localhost:5003/api`
- ✅ Production: Dùng `.env.production` → API: `https://gialai-ocop-be.onrender.com/api`
- ✅ Không cần chỉnh code: Chỉ cần tạo file `.env` tương ứng

---

## 🚀 Bước 1: Setup Environment Variables

### Cách 1: Tự Động (Khuyến Nghị)

**Windows:**
```powershell
.\setup-env.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-env.sh && ./setup-env.sh
```

### Cách 2: Thủ Công

Tạo 2 files trong thư mục root:

**`.env.local`** (cho local development):
```env
NEXT_PUBLIC_API_BASE=http://localhost:5003/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

**`.env.production`** (cho production):
```env
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

---

## 🔍 Bước 2: Kiểm Tra Setup

### 1. Kiểm tra files đã được tạo

```bash
# Windows
dir .env.local .env.production

# Linux/Mac
ls -la .env.local .env.production
```

### 2. Kiểm tra trong code

Mở browser console khi chạy `npm run dev` và gõ:

```javascript
console.log('API Base URL:', process.env.NEXT_PUBLIC_API_BASE)
```

**Kết quả mong đợi:**
- Local: `http://localhost:5003/api`
- Production: `https://gialai-ocop-be.onrender.com/api`

### 3. Kiểm tra API calls

Mở Network tab trong DevTools:
- Local: API calls phải đi đến `http://localhost:5003/api`
- Production: API calls phải đi đến `https://gialai-ocop-be.onrender.com/api`

---

## 🎯 Logic Hoạt Động (Chi Tiết)

### Next.js Environment Variables Loading

Next.js tự động load environment variables theo thứ tự ưu tiên:

#### 1. Local Development (`npm run dev`)

```
.env.local (ưu tiên cao nhất)
  ↓
.env.development (nếu có)
  ↓
.env (nếu có)
```

**Kết quả:** FE dùng API URL từ `.env.local` → `http://localhost:5003/api`

#### 2. Production Build (`npm run build`)

```
.env.production (ưu tiên cao nhất)
  ↓
.env.local (nếu có, nhưng không nên dùng)
  ↓
.env (nếu có)
```

**Kết quả:** FE dùng API URL từ `.env.production` → `https://gialai-ocop-be.onrender.com/api`

#### 3. Hosting Platform (Render, Vercel, etc.)

Environment variables set trên hosting platform sẽ **override** tất cả file `.env`.

**Ví dụ trên Render:**
```
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
```

---

## 💻 Code Implementation

### File: `src/lib/api.ts`

```typescript
// API Base URL - lấy từ environment variable
// Next.js tự động load .env.local (development) hoặc .env.production (production)
// Fallback: production URL nếu không có env var
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "https://gialai-ocop-be.onrender.com/api";
```

**Logic:**
1. Ưu tiên: `process.env.NEXT_PUBLIC_API_BASE` (từ `.env.local` hoặc `.env.production`)
2. Fallback: `https://gialai-ocop-be.onrender.com/api` (nếu không có env var)

**Lưu ý:** Biến phải bắt đầu với `NEXT_PUBLIC_` để có thể truy cập từ client-side code.

---

## ✅ Checklist Setup

- [ ] Đã clone repository
- [ ] Đã chạy `npm install`
- [ ] Đã tạo file `.env.local` với API URL local
- [ ] Đã tạo file `.env.production` với API URL production
- [ ] Đã restart dev server sau khi tạo file
- [ ] Đã kiểm tra `process.env.NEXT_PUBLIC_API_BASE` trong console
- [ ] Đã kiểm tra API calls trong Network tab
- [ ] Đã set environment variables trên hosting platform (nếu deploy)

---

## 🚀 Chạy Project

### Local Development

```bash
npm run dev
```

FE sẽ tự động:
- Load `.env.local`
- Dùng API: `http://localhost:5003/api`
- Chạy tại: `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

FE sẽ tự động:
- Load `.env.production`
- Dùng API: `https://gialai-ocop-be.onrender.com/api`
- Chạy tại port được cấu hình

---

## 🔧 Cấu Hình Trên Hosting Platform

### Render / Vercel / Netlify

Set environment variables trực tiếp trên dashboard:

```
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

**Lưu ý:** Environment variables trên hosting platform sẽ override file `.env.production`.

---

## 🐛 Troubleshooting

### Vấn đề: API calls vẫn dùng production URL khi chạy local

**Nguyên nhân:**
- File `.env.local` chưa được tạo
- File ở sai thư mục (phải ở root, cùng cấp với `package.json`)
- Dev server chưa được restart

**Giải pháp:**
1. Kiểm tra file `.env.local` đã được tạo chưa
2. Kiểm tra file ở đúng thư mục root
3. Restart dev server: `npm run dev`
4. Xóa `.next` folder và rebuild: 
   - Windows: `rmdir /s /q .next && npm run dev`
   - Linux/Mac: `rm -rf .next && npm run dev`

### Vấn đề: Environment variables không được load

**Nguyên nhân:**
- Biến không bắt đầu với `NEXT_PUBLIC_`
- Có khoảng trắng quanh dấu `=`
- Có quotes trong file `.env`

**Giải pháp:**
1. Đảm bảo biến bắt đầu với `NEXT_PUBLIC_` (bắt buộc cho client-side)
2. Không có khoảng trắng: `NEXT_PUBLIC_API_BASE=http://...` ✅ (đúng) vs `NEXT_PUBLIC_API_BASE = http://...` ❌ (sai)
3. Không có quotes: `NEXT_PUBLIC_API_BASE=http://localhost:5003/api` ✅ (đúng) vs `NEXT_PUBLIC_API_BASE="http://localhost:5003/api"` ❌ (sai)
4. Restart dev server sau khi thay đổi

### Vấn đề: CORS error khi gọi API

**Nguyên nhân:**
- Backend CORS chưa cho phép origin của FE
- Backend chưa chạy
- API URL trong `.env` file sai

**Giải pháp:**
1. Kiểm tra Backend CORS đã cho phép origin của FE chưa
2. Kiểm tra Backend đang chạy chưa (local hoặc production)
3. Kiểm tra API URL trong `.env` file có đúng không
4. Xem [Backend CORS Configuration](../GiaLai-OCOP-BE/appsettings.json)

---

## 📚 Tài Liệu Tham Khảo

- [README_ENV.md](./README_ENV.md) - Quick guide
- [SETUP_ENV.md](./SETUP_ENV.md) - Hướng dẫn chi tiết đầy đủ
- [HUONG_DAN_ENV.md](./HUONG_DAN_ENV.md) - Hướng dẫn cấu hình
- [ENV_TEMPLATE.md](./ENV_TEMPLATE.md) - Template nhanh
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 🎉 Kết Luận

Sau khi setup xong:

✅ **Local Development**: FE tự động dùng `http://localhost:5003/api`  
✅ **Production**: FE tự động dùng `https://gialai-ocop-be.onrender.com/api`  
✅ **Không cần chỉnh code**: Chỉ cần tạo file `.env` tương ứng  
✅ **Tự động chuyển đổi**: Next.js tự động load đúng file `.env` theo môi trường  

**FE sẽ hoạt động trơn tru cả local và production mà không cần chỉnh code!** 🚀

