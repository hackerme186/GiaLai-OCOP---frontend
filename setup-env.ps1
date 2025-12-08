# PowerShell Script để tự động tạo .env files
# Chạy script này: .\setup-env.ps1

Write-Host "🚀 Đang tạo environment variables files..." -ForegroundColor Cyan

# Tạo .env.local cho local development
$envLocalContent = @"
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
"@

# Tạo .env.production cho production deployment
$envProductionContent = @"
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
"@

# Kiểm tra file đã tồn tại chưa
if (Test-Path .env.local) {
    Write-Host "⚠️  File .env.local đã tồn tại. Bạn có muốn ghi đè? (y/n)" -ForegroundColor Yellow
    $overwrite = Read-Host
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Bỏ qua tạo .env.local" -ForegroundColor Red
    } else {
        $envLocalContent | Out-File -FilePath .env.local -Encoding utf8 -NoNewline
        Write-Host "✅ Đã cập nhật .env.local" -ForegroundColor Green
    }
} else {
    $envLocalContent | Out-File -FilePath .env.local -Encoding utf8 -NoNewline
    Write-Host "✅ Đã tạo .env.local" -ForegroundColor Green
}

if (Test-Path .env.production) {
    Write-Host "⚠️  File .env.production đã tồn tại. Bạn có muốn ghi đè? (y/n)" -ForegroundColor Yellow
    $overwrite = Read-Host
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Bỏ qua tạo .env.production" -ForegroundColor Red
    } else {
        $envProductionContent | Out-File -FilePath .env.production -Encoding utf8 -NoNewline
        Write-Host "✅ Đã cập nhật .env.production" -ForegroundColor Green
    }
} else {
    $envProductionContent | Out-File -FilePath .env.production -Encoding utf8 -NoNewline
    Write-Host "✅ Đã tạo .env.production" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Tóm tắt:" -ForegroundColor Cyan
Write-Host "  - .env.local: Dùng cho local development (npm run dev)" -ForegroundColor White
Write-Host "  - .env.production: Dùng cho production build (npm run build)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Lưu ý:" -ForegroundColor Yellow
Write-Host "  - Restart dev server sau khi tạo file: npm run dev" -ForegroundColor White
Write-Host "  - Kiểm tra API URL trong browser console: process.env.NEXT_PUBLIC_API_BASE" -ForegroundColor White
Write-Host ""
Write-Host "✅ Hoàn thành!" -ForegroundColor Green


