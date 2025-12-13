# 🐛 Troubleshooting Guide

## Lỗi: Google OAuth Origin Not Allowed

### Triệu chứng:
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

### Nguyên nhân:
Origin (URL) của website chưa được thêm vào Google Cloud Console.

### Giải pháp:
Xem file [FIX_GOOGLE_OAUTH_ORIGIN.md](./FIX_GOOGLE_OAUTH_ORIGIN.md) để biết hướng dẫn chi tiết.

**Tóm tắt:**
1. Vào https://console.cloud.google.com/apis/credentials
2. Chọn OAuth 2.0 Client ID của bạn
3. Thêm origin vào "Authorized JavaScript origins"
4. Thêm redirect URI vào "Authorized redirect URIs"
5. Đợi 5-10 phút để Google cập nhật
6. Refresh trang và thử lại

---

## Lỗi: ERR_CONNECTION_REFUSED

### Triệu chứng:
```
GET http://localhost:5003/api/map/search net::ERR_CONNECTION_REFUSED
```

### Nguyên nhân:
Backend chưa được khởi động hoặc không chạy trên port 5003.

### Giải pháp:

#### 1. Khởi động Backend

Mở terminal mới và chạy:

```bash
# Chuyển đến thư mục Backend
cd D:\GiaLai-OCOP-BE

# Chạy Backend
dotnet run
```

Hoặc chạy với profile http:

```bash
dotnet run --launch-profile http
```

**Backend sẽ chạy tại:** `http://localhost:5003`

#### 2. Kiểm tra Backend đã chạy chưa

Mở browser và truy cập:
- Health check: `http://localhost:5003/health`
- Swagger: `http://localhost:5003/swagger`

Nếu thấy Swagger UI hoặc health check response → Backend đã chạy thành công.

#### 3. Kiểm tra port có bị chiếm không

**Windows:**
```powershell
netstat -ano | findstr :5003
```

**Linux/Mac:**
```bash
lsof -i :5003
```

Nếu port đã bị chiếm, có thể:
- Đổi port trong `Properties/launchSettings.json`
- Hoặc kill process đang dùng port đó

---

## Lỗi: CORS Error

### Triệu chứng:
```
Access to fetch at 'http://localhost:5003/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

### Nguyên nhân:
Backend CORS chưa cho phép origin của FE.

### Giải pháp:

1. Kiểm tra `appsettings.json` có chứa:
```json
{
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001"
    ]
  }
}
```

2. Restart Backend sau khi thay đổi CORS config.

---

## Lỗi: Environment Variables không load

### Triệu chứng:
FE vẫn dùng production URL khi chạy local.

### Giải pháp:

1. **Kiểm tra file `.env.local` đã tạo chưa:**
```bash
# Windows
dir .env.local

# Linux/Mac
ls -la .env.local
```

2. **Kiểm tra nội dung file:**
```bash
# Windows
type .env.local

# Linux/Mac
cat .env.local
```

Phải có dòng:
```
NEXT_PUBLIC_API_BASE=http://localhost:5003/api
```

3. **Restart dev server:**
```bash
# Dừng server (Ctrl+C)
# Sau đó chạy lại
npm run dev
```

4. **Xóa cache và rebuild:**
```bash
# Windows
rmdir /s /q .next
npm run dev

# Linux/Mac
rm -rf .next
npm run dev
```

---

## Lỗi: API calls vẫn đi đến production URL

### Nguyên nhân:
File `.env.local` chưa được tạo hoặc có lỗi.

### Giải pháp:

1. **Tạo lại file `.env.local`:**
```bash
# Windows
.\setup-env.ps1

# Linux/Mac
chmod +x setup-env.sh && ./setup-env.sh
```

2. **Kiểm tra trong browser console:**
```javascript
console.log(process.env.NEXT_PUBLIC_API_BASE)
```

Kết quả phải là: `http://localhost:5003/api`

---

## Checklist Khi Gặp Lỗi

- [ ] Backend đã chạy chưa? (`http://localhost:5003/health`)
- [ ] File `.env.local` đã tạo chưa?
- [ ] Nội dung `.env.local` có đúng không?
- [ ] Dev server đã restart chưa?
- [ ] CORS đã được cấu hình đúng chưa?
- [ ] Port 5003 có bị chiếm không?

---

## Hướng Dẫn Chạy Đầy Đủ

### Terminal 1: Backend
```bash
cd D:\GiaLai-OCOP-BE
dotnet run
```

### Terminal 2: Frontend
```bash
cd D:\GiaLai-OCOP-FE\GiaLai-OCOP---frontend
npm run dev
```

### Kiểm tra:
- Backend: `http://localhost:5003/swagger`
- Frontend: `http://localhost:3000`
- API calls trong Network tab phải đi đến `http://localhost:5003/api`

---

## Liên Hệ

Nếu vẫn gặp vấn đề, kiểm tra:
1. [FE_SETUP_GUIDE.md](./FE_SETUP_GUIDE.md) - Hướng dẫn setup đầy đủ
2. [SETUP_ENV.md](./SETUP_ENV.md) - Hướng dẫn environment variables
3. Backend logs để xem lỗi chi tiết

