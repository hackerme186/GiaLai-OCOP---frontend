# 🔧 Fix Lỗi Google OAuth: "The given origin is not allowed"

## ❌ Lỗi

```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

## 🔍 Nguyên Nhân

Lỗi này xảy ra khi origin (URL) của website chưa được thêm vào Google Cloud Console trong cấu hình OAuth 2.0 Client ID.

---

## ✅ Giải Pháp

### Bước 1: Truy cập Google Cloud Console

1. Mở trình duyệt và truy cập:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. Đăng nhập bằng tài khoản Google có quyền quản lý project

### Bước 2: Tìm OAuth 2.0 Client ID

1. Tìm OAuth 2.0 Client ID có Client ID:
   ```
   873979098760-9cbdcjnrspc4o0sfekq809c0iiqujtu7.apps.googleusercontent.com
   ```

2. Click vào Client ID để mở cấu hình

### Bước 3: Thêm Authorized JavaScript Origins

1. Trong phần **"Authorized JavaScript origins"**, click **"+ ADD URI"**

2. Thêm các origins sau:

   **Local Development:**
   ```
   http://localhost:3000
   http://localhost:3001
   ```

   **Production:**
   ```
   https://gialai-ocop-frontend-2.onrender.com
   ```

3. Click **"SAVE"**

### Bước 4: Thêm Authorized Redirect URIs

1. Trong phần **"Authorized redirect URIs"**, click **"+ ADD URI"**

2. Thêm các redirect URIs sau:

   **Local Development:**
   ```
   http://localhost:3000
   http://localhost:3000/login
   http://localhost:3001
   http://localhost:3001/login
   ```

   **Production:**
   ```
   https://gialai-ocop-frontend-2.onrender.com
   https://gialai-ocop-frontend-2.onrender.com/login
   ```

3. Click **"SAVE"**

### Bước 5: Đợi Google Cập Nhật

- Google có thể mất **5-10 phút** để cập nhật cấu hình
- Đợi vài phút sau khi save

### Bước 6: Refresh Trang và Thử Lại

1. Refresh trang web (F5 hoặc Ctrl+R)
2. Thử đăng nhập bằng Google lại
3. Lỗi sẽ biến mất nếu cấu hình đúng

---

## 📋 Checklist

- [ ] Đã truy cập Google Cloud Console
- [ ] Đã tìm đúng OAuth 2.0 Client ID
- [ ] Đã thêm `http://localhost:3000` vào Authorized JavaScript origins
- [ ] Đã thêm `http://localhost:3000` vào Authorized redirect URIs
- [ ] Đã thêm production URL (nếu deploy)
- [ ] Đã đợi 5-10 phút sau khi save
- [ ] Đã refresh trang và thử lại

---

## 🎯 Origins Cần Thêm

### Local Development:
```
Authorized JavaScript origins:
- http://localhost:3000
- http://localhost:3001

Authorized redirect URIs:
- http://localhost:3000
- http://localhost:3000/login
- http://localhost:3001
- http://localhost:3001/login
```

### Production:
```
Authorized JavaScript origins:
- https://gialai-ocop-frontend-2.onrender.com

Authorized redirect URIs:
- https://gialai-ocop-frontend-2.onrender.com
- https://gialai-ocop-frontend-2.onrender.com/login
```

---

## ⚠️ Lưu Ý

1. **Không có trailing slash**: 
   - ✅ Đúng: `http://localhost:3000`
   - ❌ Sai: `http://localhost:3000/`

2. **Protocol phải đúng**:
   - Local: `http://` (không phải `https://`)
   - Production: `https://` (không phải `http://`)

3. **Port phải đúng**:
   - Local: `3000` hoặc `3001` (tùy bạn chạy trên port nào)

4. **Đợi Google cập nhật**:
   - Thường mất 5-10 phút
   - Có thể mất đến 30 phút trong một số trường hợp

---

## 🐛 Troubleshooting

### Vẫn còn lỗi sau khi thêm origin?

1. **Kiểm tra lại origin đã thêm đúng chưa:**
   - Mở browser console
   - Gõ: `window.location.origin`
   - Đảm bảo origin này đã được thêm vào Google Cloud Console

2. **Kiểm tra Client ID:**
   - Đảm bảo Client ID trong `.env.local` khớp với Client ID trong Google Cloud Console

3. **Clear cache và thử lại:**
   ```bash
   # Clear browser cache
   Ctrl + Shift + Delete (Windows)
   Cmd + Shift + Delete (Mac)
   
   # Hoặc hard refresh
   Ctrl + F5 (Windows)
   Cmd + Shift + R (Mac)
   ```

4. **Kiểm tra lại sau 30 phút:**
   - Google có thể cần thời gian để propagate cấu hình

---

## 📚 Tài Liệu Tham Khảo

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)

---

## ✅ Sau Khi Fix

Sau khi thêm origin đúng và đợi Google cập nhật, lỗi sẽ biến mất và bạn có thể đăng nhập bằng Google thành công! 🎉


