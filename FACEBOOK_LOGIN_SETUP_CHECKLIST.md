# Facebook Login Setup Checklist - Hướng Dẫn Cấu Hình

## 📋 Checklist Cấu Hình Facebook App

### ✅ Bước 1: Lấy App ID và App Secret

**Trong Facebook Developer Console:**

1. ✅ **App ID**: `25450048997956768` (đã thấy trong hình)
   - Copy App ID này

2. ⬜ **App Secret**: 
   - Click nút **"Show"** bên cạnh "App secret"
   - Nhập mật khẩu Facebook nếu được yêu cầu
   - Copy App Secret

---

### ✅ Bước 2: Cấu Hình App Domains

**Trong trang "Basic" settings:**

1. Tìm phần **"App domains"**
2. Thêm các domain sau (mỗi domain một dòng):
   ```
   localhost
   gialai-ocop-frontend-2.onrender.com
   ```
   **Lưu ý:** Không thêm `http://` hoặc `https://`, chỉ domain thôi

---

### ✅ Bước 3: Cấu Hình OAuth Redirect URIs

**Cách 1: Từ trang Basic Settings**
1. Scroll xuống tìm phần **"Facebook Login"** → Click **"Settings"**

**Cách 2: Từ Use Cases**
1. Vào **"Use cases"** trong sidebar
2. Click vào **"Authenticate and request data from users with Facebook Login"**
3. Click **"Settings"**

**Trong trang Facebook Login Settings:**

1. Tìm phần **"Valid OAuth Redirect URIs"**
2. Thêm các URI sau (mỗi URI một dòng):
   ```
   http://localhost:3000
   https://localhost:3000
   http://gialai-ocop-frontend-2.onrender.com
   https://gialai-ocop-frontend-2.onrender.com
   ```
   **Lưu ý:** Phải có cả `http://` và `https://` cho mỗi domain

3. Click **"Save Changes"**

---

### ⬜ Bước 4: Cấu Hình Privacy Policy và Terms of Service (Tùy chọn)

**Trong trang "Basic" settings:**

1. **Privacy Policy URL**: 
   - Thêm URL đến trang Privacy Policy của bạn
   - Ví dụ: `https://yourdomain.com/privacy-policy`
   - Hoặc để trống nếu chưa có (có thể thêm sau)

2. **Terms of Service URL**:
   - Thêm URL đến trang Terms of Service của bạn
   - Ví dụ: `https://yourdomain.com/terms`
   - Hoặc để trống nếu chưa có (có thể thêm sau)

**Lưu ý:** 
- Các URL này không bắt buộc cho Development Mode
- Cần có khi submit App Review (Production Mode)

---

### ✅ Bước 5: Cấu Hình vào Code

#### Frontend: Tạo file `.env.local`

**File:** `E:\SE18\SEP\frontend\.env.local`

```env
# Facebook App ID
NEXT_PUBLIC_FACEBOOK_APP_ID=25450048997956768
```

**Lưu ý:** 
- File `.env.local` không được commit vào Git (đã có trong `.gitignore`)
- Restart dev server sau khi thêm: `npm run dev`

#### Backend: Cập nhật `appsettings.json`

**File:** `E:\SE18\SEP\GiaLai-OCOP-BE\appsettings.json`

Tìm phần `"Facebook"` và cập nhật:

```json
{
  "Facebook": {
    "AppId": "25450048997956768",
    "AppSecret": "your_app_secret_here"
  }
}
```

**Lưu ý:** 
- Thay `your_app_secret_here` bằng App Secret bạn vừa lấy
- Không commit App Secret vào Git (nên dùng User Secrets hoặc Environment Variables)

---

## 🧪 Test Sau Khi Cấu Hình

### 1. Test với Backend Local

```bash
# Terminal 1: Start Backend
cd E:\SE18\SEP\GiaLai-OCOP-BE
dotnet run

# Terminal 2: Start Frontend
cd E:\SE18\SEP\frontend
npm run dev
```

### 2. Test Facebook Login

1. Mở trình duyệt: `http://localhost:3000/login`
2. Click nút **"Facebook"**
3. Authorize trên Facebook popup
4. Kiểm tra console logs
5. Verify redirect based on role

---

## ⚠️ Lưu Ý Quan Trọng

### Development Mode vs Production Mode

**Development Mode (Hiện tại):**
- ✅ Không cần Business Verification
- ✅ Không cần App Review
- ✅ Chỉ admin/developer có thể login
- ✅ Đủ để test và phát triển

**Production Mode (Khi deploy):**
- ⬜ Cần Business Verification
- ⬜ Cần App Review
- ⬜ Tất cả users có thể login
- ⬜ Cần Privacy Policy và Terms of Service URLs

### App ID và App Secret

- **App ID**: Có thể public (nhưng nên giữ trong `.env.local`)
- **App Secret**: **KHÔNG BAO GIỜ** commit vào Git
  - Nên dùng User Secrets: `dotnet user-secrets set "Facebook:AppSecret" "your_secret"`
  - Hoặc Environment Variables trên hosting

---

## 📝 Checklist Tổng Hợp

### Facebook Developer Console
- [x] Lấy App ID: `25450048997956768`
- [ ] Lấy App Secret (click "Show")
- [ ] Cấu hình App Domains
- [ ] Cấu hình OAuth Redirect URIs
- [ ] (Optional) Privacy Policy URL
- [ ] (Optional) Terms of Service URL

### Frontend Code
- [ ] Tạo file `.env.local`
- [ ] Thêm `NEXT_PUBLIC_FACEBOOK_APP_ID=25450048997956768`
- [ ] Restart dev server

### Backend Code
- [ ] Cập nhật `appsettings.json` với App ID mới
- [ ] Cập nhật `appsettings.json` với App Secret
- [ ] Restart backend server

### Testing
- [ ] Test Facebook Login với localhost
- [ ] Kiểm tra console logs
- [ ] Verify redirect based on role
- [ ] Test với production domain (nếu có)

---

## 🐛 Troubleshooting

### Lỗi: "Invalid OAuth Redirect URI"

**Nguyên nhân:** OAuth Redirect URI chưa được cấu hình đúng

**Giải pháp:**
1. Vào Facebook Login Settings
2. Thêm đầy đủ các URI:
   - `http://localhost:3000`
   - `https://localhost:3000`
   - `http://gialai-ocop-frontend-2.onrender.com`
   - `https://gialai-ocop-frontend-2.onrender.com`
3. Click "Save Changes"
4. Đợi 5-10 phút để Facebook cập nhật
5. Hard refresh trình duyệt (Ctrl + Shift + R)

### Lỗi: "App ID không khớp"

**Nguyên nhân:** App ID trong code khác với App ID trong Facebook Console

**Giải pháp:**
1. Kiểm tra App ID trong `.env.local` (frontend)
2. Kiểm tra App ID trong `appsettings.json` (backend)
3. Đảm bảo cả hai đều là: `25450048997956768`
4. Restart cả frontend và backend

### Lỗi: "Facebook SDK chưa sẵn sàng"

**Nguyên nhân:** Facebook SDK chưa load hoặc App ID chưa đúng

**Giải pháp:**
1. Kiểm tra `NEXT_PUBLIC_FACEBOOK_APP_ID` trong `.env.local`
2. Kiểm tra Network tab xem SDK có load không
3. Hard refresh trình duyệt
4. Clear cache và cookies

---

## ✅ Kết Luận

Sau khi hoàn thành tất cả các bước trên, Facebook Login sẽ hoạt động. 

**Thứ tự ưu tiên:**
1. ⚠️ **QUAN TRỌNG**: Lấy App Secret và cấu hình vào backend
2. ⚠️ **QUAN TRỌNG**: Cấu hình OAuth Redirect URIs
3. ✅ Cấu hình App Domains
4. ✅ Cấu hình App ID vào frontend
5. ✅ Test với localhost

**Trạng thái hiện tại:**
- ✅ App ID đã có: `25450048997956768`
- ⬜ Cần lấy App Secret
- ⬜ Cần cấu hình OAuth Redirect URIs
- ⬜ Cần cấu hình vào code

