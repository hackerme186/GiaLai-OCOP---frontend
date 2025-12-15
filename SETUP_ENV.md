# 🚀 Hướng Dẫn Setup Environment Variables

File này hướng dẫn cách setup environment variables để FE tự động chuyển đổi giữa local development và production deployment.

---

## 📋 Yêu Cầu

- Node.js 18+
- npm hoặc yarn
- Backend đang chạy (local hoặc production)

---

## ⚡ Quick Setup (Tự Động)

### Windows (PowerShell)

```powershell
# Tạo .env.local cho local development
@"
# Local Development Environment Variables
NEXT_PUBLIC_API_BASE=http://localhost:5003/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
"@ | Out-File -FilePath .env.local -Encoding utf8

# Tạo .env.production cho production deployment
@"
# Production Environment Variables
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
"@ | Out-File -FilePath .env.production -Encoding utf8

Write-Host "✅ Đã tạo .env.local và .env.production" -ForegroundColor Green
```

### Linux/Mac (Bash)

```bash
# Tạo .env.local cho local development
cat > .env.local << 'EOF'
# Local Development Environment Variables
NEXT_PUBLIC_API_BASE=http://localhost:5003/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
EOF

# Tạo .env.production cho production deployment
cat > .env.production << 'EOF'
# Production Environment Variables
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
EOF

echo "✅ Đã tạo .env.local và .env.production"
```

---

## 📝 Setup Thủ Công

### 1. Tạo file `.env.local`

Tạo file `.env.local` trong thư mục root của project với nội dung:

```env
# Local Development Environment Variables
NEXT_PUBLIC_API_BASE=http://localhost:5003/api

# Google OAuth Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com

# Facebook App ID
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

### 2. Tạo file `.env.production`

Tạo file `.env.production` trong thư mục root của project với nội dung:

```env
# Production Environment Variables
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api

# Google OAuth Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com

# Facebook App ID
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

---

## 🔍 Kiểm Tra Setup

### 1. Kiểm tra file đã được tạo

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

## 🎯 Logic Hoạt Động

### Next.js Environment Variables Loading Order

1. **Local Development** (`npm run dev`):
   - Load `.env.local` (ưu tiên cao nhất)
   - Load `.env.development` (nếu có)
   - Load `.env` (nếu có)

2. **Production Build** (`npm run build`):
   - Load `.env.production` (ưu tiên cao nhất)
   - Load `.env.local` (nếu có, nhưng không nên dùng trong production)
   - Load `.env` (nếu có)

3. **Hosting Platform** (Render, Vercel, etc.):
   - Environment variables set trên platform sẽ override tất cả file `.env`

### Code Implementation

File `src/lib/api.ts` đã được cấu hình:

```typescript
// API Base URL - lấy từ environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "https://gialai-ocop-be.onrender.com/api";
```

**Logic:**
- Ưu tiên: `process.env.NEXT_PUBLIC_API_BASE` (từ `.env.local` hoặc `.env.production`)
- Fallback: `https://gialai-ocop-be.onrender.com/api` (nếu không có env var)

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

## ✅ Checklist

- [ ] Đã tạo file `.env.local` với API URL local
- [ ] Đã tạo file `.env.production` với API URL production
- [ ] Đã restart dev server sau khi tạo file
- [ ] Đã kiểm tra `process.env.NEXT_PUBLIC_API_BASE` trong console
- [ ] Đã kiểm tra API calls trong Network tab
- [ ] Đã set environment variables trên hosting platform (nếu deploy)

---

## 🐛 Troubleshooting

### Vấn đề: API calls vẫn dùng production URL khi chạy local

**Giải pháp:**
1. Kiểm tra file `.env.local` đã được tạo chưa
2. Kiểm tra file ở đúng thư mục root (cùng cấp với `package.json`)
3. Restart dev server: `npm run dev`
4. Xóa `.next` folder và rebuild: `rm -rf .next && npm run dev` (Linux/Mac) hoặc `rmdir /s /q .next && npm run dev` (Windows)

### Vấn đề: Environment variables không được load

**Giải pháp:**
1. Đảm bảo biến bắt đầu với `NEXT_PUBLIC_` (bắt buộc cho client-side)
2. Không có khoảng trắng xung quanh dấu `=`: `NEXT_PUBLIC_API_BASE=http://...` (đúng) vs `NEXT_PUBLIC_API_BASE = http://...` (sai)
3. Không có quotes trong file `.env`: `NEXT_PUBLIC_API_BASE=http://localhost:5003/api` (đúng) vs `NEXT_PUBLIC_API_BASE="http://localhost:5003/api"` (sai)
4. Restart dev server sau khi thay đổi

### Vấn đề: CORS error khi gọi API

**Giải pháp:**
1. Kiểm tra Backend CORS đã cho phép origin của FE chưa
2. Kiểm tra Backend đang chạy chưa (local hoặc production)
3. Kiểm tra API URL trong `.env` file có đúng không

---

## 📚 Tài Liệu Tham Khảo

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [HUONG_DAN_ENV.md](./HUONG_DAN_ENV.md) - Hướng dẫn chi tiết
- [ENV_TEMPLATE.md](./ENV_TEMPLATE.md) - Template nhanh

---

**Lưu ý:** File `.env.local` và `.env.production` đã được thêm vào `.gitignore` để không commit secrets vào Git.





