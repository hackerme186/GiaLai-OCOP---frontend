# 🚀 Setup Environment Variables - Quick Guide

## ⚡ Cách Nhanh Nhất

### Windows
```powershell
.\setup-env.ps1
```

### Linux/Mac
```bash
chmod +x setup-env.sh && ./setup-env.sh
```

---

## 📝 Cách Thủ Công

### 1. Tạo `.env.local` (cho local development)

Tạo file `.env.local` trong thư mục root:

```env
NEXT_PUBLIC_API_BASE=http://localhost:5003/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

### 2. Tạo `.env.production` (cho production)

Tạo file `.env.production` trong thư mục root:

```env
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

### 3. Restart dev server

```bash
npm run dev
```

---

## ✅ Kiểm Tra

Mở browser console và gõ:
```javascript
console.log(process.env.NEXT_PUBLIC_API_BASE)
```

**Kết quả:**
- Local: `http://localhost:5003/api`
- Production: `https://gialai-ocop-be.onrender.com/api`

---

## 🎯 Logic Hoạt Động

1. **Local Development** (`npm run dev`):
   - Tự động load `.env.local`
   - API URL: `http://localhost:5003/api`

2. **Production Build** (`npm run build`):
   - Tự động load `.env.production`
   - API URL: `https://gialai-ocop-be.onrender.com/api`

3. **Hosting Platform** (Render, Vercel):
   - Set environment variables trên dashboard sẽ override file `.env`

---

## 📚 Tài Liệu Chi Tiết

- [SETUP_ENV.md](./SETUP_ENV.md) - Hướng dẫn chi tiết đầy đủ
- [HUONG_DAN_ENV.md](./HUONG_DAN_ENV.md) - Hướng dẫn cấu hình
- [ENV_TEMPLATE.md](./ENV_TEMPLATE.md) - Template nhanh

---

## 🐛 Troubleshooting

**API vẫn dùng production URL khi chạy local?**
1. Kiểm tra file `.env.local` đã tạo chưa
2. Restart dev server: `npm run dev`
3. Xóa `.next` và rebuild: `rm -rf .next && npm run dev`

**Environment variables không load?**
1. Đảm bảo biến bắt đầu với `NEXT_PUBLIC_`
2. Không có khoảng trắng quanh dấu `=`
3. Không có quotes trong file `.env`

---

**✅ Sau khi setup xong, FE sẽ tự động chuyển đổi giữa local và production mà không cần chỉnh code!**

