# 📋 Environment Variables Template

Copy nội dung dưới đây để tạo file `.env.local` và `.env.production`.

---

## 🔧 .env.local (Local Development)

Tạo file `.env.local` trong thư mục root:

```env
# Local Development Environment Variables
NEXT_PUBLIC_API_BASE=http://localhost:5003/api

# Google OAuth Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com

# Facebook App ID
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

---

## 🚀 .env.production (Production Deployment)

Tạo file `.env.production` trong thư mục root:

```env
# Production Environment Variables
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api

# Google OAuth Client ID
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com

# Facebook App ID
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
```

---

## ⚡ Quick Commands

```bash
# Tạo .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_BASE=http://localhost:5003/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
EOF

# Tạo .env.production
cat > .env.production << 'EOF'
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
EOF
```

---

## ✅ Sau Khi Tạo File

1. Restart dev server: `npm run dev`
2. Kiểm tra: Mở browser console → `process.env.NEXT_PUBLIC_API_BASE` phải hiển thị đúng URL


