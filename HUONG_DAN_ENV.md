# 📋 Hướng Dẫn Cấu Hình Environment Variables

Dự án sử dụng environment variables để tự động chuyển đổi giữa local development và production deployment mà không cần chỉnh code.

---

## 🚀 Quick Start

### 1. Tạo file `.env.local` cho Local Development

Tạo file `.env.local` trong thư mục root của project với nội dung:

```env
# Local Development Environment Variables
NEXT_PUBLIC_API_BASE=http://localhost:5003/api

# Google OAuth Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com

# Facebook App ID
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

### 2. Tạo file `.env.production` cho Production Deployment

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

## 📝 Chi Tiết

### Environment Variables

| Biến | Mô tả | Local | Production |
|------|-------|-------|------------|
| `NEXT_PUBLIC_API_BASE` | Backend API URL | `http://localhost:5003/api` | `https://gialai-ocop-be.onrender.com/api` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | (giống nhau) | (giống nhau) |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Facebook App ID | (giống nhau) | (giống nhau) |

### Cách Hoạt Động

1. **Local Development**: Next.js tự động load `.env.local` khi chạy `npm run dev`
2. **Production Build**: Next.js tự động load `.env.production` khi build với `NODE_ENV=production`
3. **Hosting Platform**: Có thể override bằng cách set environment variables trực tiếp trên platform (Render, Vercel, etc.)

### Lưu Ý

- ✅ File `.env.local` và `.env.production` đã được thêm vào `.gitignore` (không commit)
- ✅ File `.env.local.example` và `.env.production.example` có thể commit để làm template
- ✅ Biến môi trường phải bắt đầu với `NEXT_PUBLIC_` để có thể truy cập từ client-side code
- ✅ Sau khi thay đổi `.env` files, cần restart dev server (`npm run dev`)

---

## 🔧 Cấu Hình Trên Hosting Platform

### Render / Vercel / Netlify

Set environment variables trực tiếp trên dashboard:

```
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

Environment variables trên hosting platform sẽ override file `.env.production`.

---

## ✅ Kiểm Tra

Sau khi cấu hình, kiểm tra:

1. **Local**: Mở browser console, gõ `process.env.NEXT_PUBLIC_API_BASE` → phải hiển thị `http://localhost:5003/api`
2. **Production**: Deploy và kiểm tra network tab → API calls phải đi đến `https://gialai-ocop-be.onrender.com/api`

---

## 🐛 Troubleshooting

### API calls vẫn dùng production URL khi chạy local

- Kiểm tra file `.env.local` đã được tạo chưa
- Restart dev server: `npm run dev`
- Xóa `.next` folder và rebuild: `rm -rf .next && npm run dev`

### Environment variables không được load

- Đảm bảo biến bắt đầu với `NEXT_PUBLIC_`
- Kiểm tra file `.env.local` hoặc `.env.production` ở root directory
- Restart dev server sau khi thay đổi





