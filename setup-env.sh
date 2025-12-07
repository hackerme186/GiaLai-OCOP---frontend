#!/bin/bash
# Bash Script để tự động tạo .env files
# Chạy script này: chmod +x setup-env.sh && ./setup-env.sh

echo "🚀 Đang tạo environment variables files..."

# Tạo .env.local cho local development
if [ -f .env.local ]; then
    echo "⚠️  File .env.local đã tồn tại. Bạn có muốn ghi đè? (y/n)"
    read -r overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "❌ Bỏ qua tạo .env.local"
    else
        cat > .env.local << 'EOF'
# Local Development Environment Variables
# File này chỉ dùng cho local development
# Không commit file này vào Git (đã có trong .gitignore)

# Backend API URL cho local development
# Backend chạy local tại http://localhost:5003 hoặc https://localhost:7018
NEXT_PUBLIC_API_BASE=http://localhost:5003/api

# Google OAuth Client ID (cho local development)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com

# Facebook App ID (cho local development)
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
EOF
        echo "✅ Đã cập nhật .env.local"
    fi
else
    cat > .env.local << 'EOF'
# Local Development Environment Variables
# File này chỉ dùng cho local development
# Không commit file này vào Git (đã có trong .gitignore)

# Backend API URL cho local development
# Backend chạy local tại http://localhost:5003 hoặc https://localhost:7018
NEXT_PUBLIC_API_BASE=http://localhost:5003/api

# Google OAuth Client ID (cho local development)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com

# Facebook App ID (cho local development)
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
EOF
    echo "✅ Đã tạo .env.local"
fi

# Tạo .env.production cho production deployment
if [ -f .env.production ]; then
    echo "⚠️  File .env.production đã tồn tại. Bạn có muốn ghi đè? (y/n)"
    read -r overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "❌ Bỏ qua tạo .env.production"
    else
        cat > .env.production << 'EOF'
# Production Environment Variables
# File này dùng cho production deployment (Render, Vercel, etc.)
# Có thể override bằng environment variables trên hosting platform

# Backend API URL cho production
# Backend deploy trên Render tại https://gialai-ocop-be.onrender.com
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api

# Google OAuth Client ID (cho production)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com

# Facebook App ID (cho production)
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
EOF
        echo "✅ Đã cập nhật .env.production"
    fi
else
    cat > .env.production << 'EOF'
# Production Environment Variables
# File này dùng cho production deployment (Render, Vercel, etc.)
# Có thể override bằng environment variables trên hosting platform

# Backend API URL cho production
# Backend deploy trên Render tại https://gialai-ocop-be.onrender.com
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api

# Google OAuth Client ID (cho production)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com

# Facebook App ID (cho production)
NEXT_PUBLIC_FACEBOOK_APP_ID=842051432020279
EOF
    echo "✅ Đã tạo .env.production"
fi

echo ""
echo "📋 Tóm tắt:"
echo "  - .env.local: Dùng cho local development (npm run dev)"
echo "  - .env.production: Dùng cho production build (npm run build)"
echo ""
echo "💡 Lưu ý:"
echo "  - Restart dev server sau khi tạo file: npm run dev"
echo "  - Kiểm tra API URL trong browser console: process.env.NEXT_PUBLIC_API_BASE"
echo ""
echo "✅ Hoàn thành!"

