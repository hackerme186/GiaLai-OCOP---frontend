# 🔧 Troubleshooting Guide

## ⏰ Backend đang khởi động (Render Cold Start)

### **Hiện tượng**
- Console log: `❌ Backend API không khả dụng`
- Banner màu vàng: "Backend đang khởi động..."
- Request timeout sau 10 giây

### **Nguyên nhân**
Render free tier tự động sleep backend sau 15 phút không hoạt động để tiết kiệm resources.

### **Giải pháp**
1. **Đợi 30-60 giây** - Backend đang wake up
2. **Reload trang** (F5) sau khi đợi
3. Banner sẽ tự động biến mất khi backend online

> 💡 **Tip:** Backend status được check tự động mỗi 30 giây

---

## ❌ Lỗi: "Failed to fetch"

### **Nguyên nhân**
Backend API chưa chạy hoặc không thể kết nối

---

## ✅ Giải pháp

### **Cách 1: Chạy Backend (Khuyến nghị)**

1. Mở terminal mới
2. Navigate đến thư mục backend:
   ```bash
   cd E:\SE18\SEP\GiaLai-OCOP-BE
   ```

3. Chạy backend:
   ```bash
   dotnet run
   ```

4. Backend sẽ chạy tại: `https://localhost:5001`

5. Refresh frontend (`F5`)

---

### **Cách 2: Sử dụng Mock Data (Development)**

Frontend đã được cấu hình để **tự động fallback** sang mock data khi backend không available.

**Các components có fallback:**
- ✅ `FeaturedProducts` - Tự động dùng mock data
- ✅ `MapSection` - Tự động dùng mock data  
- ✅ `Products Page` - Sẽ hiển thị mock products

**Lưu ý:** Một số tính năng yêu cầu backend:
- ❌ Login/Register
- ❌ OCOP Registration
- ❌ Admin Panel
- ❌ Order Creation
- ❌ Payment Processing

---

### **Cách 3: Thay đổi API URL**

Nếu backend chạy ở địa chỉ khác:

1. Tạo file `.env.local` trong thư mục frontend:
   ```bash
   # Production backend
   NEXT_PUBLIC_API_BASE=https://your-backend-url.com/api
   
   # Hoặc local HTTP (không SSL)
   NEXT_PUBLIC_API_BASE=http://localhost:5000/api
   ```

2. Restart frontend:
   ```bash
   npm run dev
   ```

---

## 🔍 Kiểm tra Backend

### **Test backend có chạy không:**

Mở browser và truy cập:
```
https://localhost:5001/swagger
```

Hoặc sử dụng curl:
```bash
curl https://localhost:5001/api/products
```

**Nếu thấy Swagger UI hoặc response JSON** → Backend đang chạy ✅  
**Nếu không kết nối được** → Backend chưa chạy ❌

---

## ⚠️ SSL Certificate Issues

### **Lỗi: "SSL certificate problem"**

Backend chạy HTTPS với self-signed certificate. Có 2 cách giải quyết:

#### **Option 1: Trust Certificate (Khuyến nghị)**

1. Mở backend lần đầu trong browser: `https://localhost:5001`
2. Browser sẽ cảnh báo "Not Secure"
3. Click "Advanced" → "Proceed to localhost (unsafe)"
4. Certificate sẽ được trust

#### **Option 2: Chạy Backend với HTTP**

Trong `E:\SE18\SEP\GiaLai-OCOP-BE\Properties\launchSettings.json`:

```json
{
  "profiles": {
    "http": {
      "commandName": "Project",
      "launchBrowser": true,
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

Chạy với profile HTTP:
```bash
dotnet run --launch-profile http
```

Update frontend `.env.local`:
```bash
NEXT_PUBLIC_API_BASE=http://localhost:5000/api
```

---

## 🚫 CORS Errors

### **Lỗi: "CORS policy: No 'Access-Control-Allow-Origin' header"**

Backend cần enable CORS cho frontend.

Kiểm tra `Program.cs`:

```csharp
// Add this BEFORE builder.Build()
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "https://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Add this AFTER builder.Build()
app.UseCors("AllowFrontend");
```

Restart backend sau khi sửa.

---

## 🔐 Authentication Errors

### **Lỗi: "401 Unauthorized"**

1. **Kiểm tra token:**
   - Mở DevTools (F12) → Application → Local Storage
   - Tìm key `ocop_auth_token`
   - Nếu không có → Đăng nhập lại

2. **Token hết hạn:**
   - Login lại để nhận token mới
   - Backend JWT token expire sau 60 phút (mặc định)

3. **Token invalid:**
   - Clear localStorage:
     ```javascript
     localStorage.clear()
     ```
   - Refresh page và login lại

---

## 📊 Database Errors

### **Lỗi: "Cannot connect to database"**

1. **Kiểm tra PostgreSQL:**
   ```bash
   # Windows
   pg_ctl status -D "C:\Program Files\PostgreSQL\XX\data"
   
   # hoặc check services
   services.msc
   ```

2. **Kiểm tra connection string trong `appsettings.json`:**
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Port=5432;Database=GiaLaiOCOP;Username=postgres;Password=your_password"
     }
   }
   ```

3. **Chạy migrations:**
   ```bash
   cd E:\SE18\SEP\GiaLai-OCOP-BE
   dotnet ef database update
   ```

---

## 🐛 Debugging Tips

### **1. Check Console Logs**

Mở DevTools (F12) → Console tab

Frontend sẽ log:
```
❌ Backend API không khả dụng (https://localhost:5001/api)
💡 Hướng dẫn: Chạy backend tại E:\SE18\SEP\GiaLai-OCOP-BE với lệnh: dotnet run
```

### **2. Network Tab**

DevTools (F12) → Network tab → Filter: "Fetch/XHR"

Xem:
- Status code (200 OK, 404 Not Found, 500 Error, Failed)
- Request URL
- Response data

### **3. Backend Logs**

Terminal chạy backend sẽ hiển thị:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: https://localhost:5001
```

---

## 📝 Common Issues Checklist

- [ ] Backend đang chạy (`dotnet run`)
- [ ] Backend URL đúng (mặc định: `https://localhost:5001/api`)
- [ ] PostgreSQL database đang chạy
- [ ] Migrations đã apply (`dotnet ef database update`)
- [ ] CORS đã enable trong `Program.cs`
- [ ] Frontend đã restart sau khi thay đổi `.env.local`
- [ ] Browser đã clear cache/cookies
- [ ] SSL certificate đã trust (nếu dùng HTTPS)

---

## 💡 Development Mode

Để development dễ dàng hơn, sử dụng mock data:

Frontend đã có **automatic fallback**:
- Khi API fails → Tự động dùng mock data từ `src/lib/mock-data.ts`
- Không cần backend để xem UI
- Mock data có 12 products với đầy đủ OCOP info

**Giới hạn:** Không test được auth, orders, payments, admin features

---

## 🚀 Production Deployment

Khi deploy production:

1. **Update API URL:**
   ```bash
   # .env.production
   NEXT_PUBLIC_API_BASE=https://your-production-api.com/api
   ```

2. **Build frontend:**
   ```bash
   npm run build
   npm start
   ```

3. **Backend CORS:**
   Update `Program.cs` để allow production domain:
   ```csharp
   policy.WithOrigins(
       "http://localhost:3000",
       "https://your-production-domain.com"
   )
   ```

---

## 📞 Cần Trợ Giúp?

1. Check console logs (F12)
2. Check backend terminal logs
3. Đọc error message cẩn thận
4. Google error message cụ thể
5. Check `API_INTEGRATION_COMPLETE.md` để xem API endpoints

---

## 🎯 Quick Commands

```bash
# Chạy frontend
npm run dev

# Chạy backend
cd E:\SE18\SEP\GiaLai-OCOP-BE
dotnet run

# Check backend status
curl https://localhost:5001/swagger

# Reset database
cd E:\SE18\SEP\GiaLai-OCOP-BE
dotnet ef database drop
dotnet ef database update

# Clear frontend cache
# DevTools → Application → Storage → Clear site data
```

---

**🎉 Sau khi fix, frontend sẽ tự động fallback sang mock data nếu backend không available!**

