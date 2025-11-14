# 🚀 Quick Start Guide

## ⚡ Chạy Dự Án Nhanh

### 🎉 **Easiest Way - Production Backend** (Khuyến nghị)
```bash
# Chỉ cần chạy frontend - backend đã live trên Render!
npm run dev
```
✅ Frontend chạy tại: `http://localhost:3000`  
✅ Backend tự động connect: `https://gialai-ocop-be.onrender.com`

> ⚠️ **Lưu ý về Render Free Tier:**  
> Backend trên Render sleep sau 15 phút không hoạt động. Lần đầu truy cập sẽ mất 30-60 giây để wake up. Nếu thấy "Backend đang khởi động...", đợi một chút và reload lại trang.

### 🔧 **Alternative - Local Backend**

<details>
<summary>Click để xem hướng dẫn chạy backend local</summary>

#### 1️⃣ **Chạy Backend** (Terminal 1)
```bash
cd E:\SE18\SEP\GiaLai-OCOP-BE
dotnet run
```
✅ Backend chạy tại: `https://localhost:5001`

#### 2️⃣ **Configure Frontend**
Tạo file `.env.local`:
```bash
NEXT_PUBLIC_API_BASE=https://localhost:5001/api
```

#### 3️⃣ **Chạy Frontend** (Terminal 2)
```bash
npm run dev
```
✅ Frontend chạy tại: `http://localhost:3000`

</details>

---

## 🎯 Truy Cập Nhanh

### Frontend URLs
| Trang | URL | Mô tả |
|-------|-----|-------|
| Trang chủ | `http://localhost:3000` | Landing page |
| Sản phẩm | `http://localhost:3000/products` | Danh sách sản phẩm OCOP |
| Đăng nhập | `http://localhost:3000/login` | Login page |
| Đăng ký | `http://localhost:3000/register` | Register page |
| OCOP Registration | `http://localhost:3000/ocop-register` | Đăng ký OCOP |
| Admin | `http://localhost:3000/admin` | Admin dashboard |

### Backend URLs
| Service | Production (Render) | Local Development |
|---------|-------------------|-------------------|
| Backend | https://gialai-ocop-be.onrender.com | https://localhost:5001 |
| API Base | https://gialai-ocop-be.onrender.com/api | https://localhost:5001/api |
| Swagger Docs | https://gialai-ocop-be.onrender.com/swagger | https://localhost:5001/swagger |

---

## ⚠️ Gặp Lỗi?

### ❌ "Failed to fetch" hoặc Backend Slow

**Nguyên nhân:** 
- Production backend (Render free tier) có thể sleep sau 15 phút không hoạt động
- Request đầu tiên sau khi sleep mất ~30s để wake up

**Giải pháp:**
1. ⏳ **Đợi 30s** - Backend đang wake up (chỉ request đầu tiên)
2. 🔄 **Refresh page** sau 30s
3. 📦 **Fallback**: Frontend tự động dùng mock data nếu timeout

> 💡 **Backend status sẽ hiển thị ở banner góc phải-dưới**

### ⚡ Backend Alternatives

**Option 1: Đợi Production Backend Wake Up**
- ⏳ ~30s lần đầu tiên
- ✅ Requests tiếp theo rất nhanh
- ✅ Không cần setup gì

**Option 2: Sử dụng Local Backend**
```bash
# .env.local
NEXT_PUBLIC_API_BASE=https://localhost:5001/api

# Restart frontend
npm run dev
```
- ✅ Luôn nhanh
- ⚠️ Cần chạy backend local

### ❌ SSL Certificate Error

**Giải pháp:**
1. Mở `https://localhost:5001` trong browser
2. Click "Advanced" → "Proceed to localhost"
3. Refresh frontend

### ❌ CORS Error

Kiểm tra `Program.cs` đã có:
```csharp
app.UseCors(policy => policy
    .WithOrigins("http://localhost:3000")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials());
```

---

## 📱 Test Features

### ✅ Không Cần Backend (Mock Data)
- ✅ Xem trang chủ
- ✅ Xem danh sách sản phẩm
- ✅ Xem sản phẩm nổi bật
- ✅ Browse UI

### 🔐 Cần Backend
- ⚠️ Đăng ký/Đăng nhập
- ⚠️ Đăng ký OCOP
- ⚠️ Tạo đơn hàng
- ⚠️ Admin features
- ⚠️ Thanh toán

---

## 🎨 UI Features

### Homepage
- Hero slider
- Featured products (rating ≥ 4.7)
- Product showcase with OCOP ratings
- Map section
- News section

### Products Page
- Grid layout
- Search & filter
- Category filter
- OCOP rating badges (⭐ 3-5 sao)
- Pagination

### OCOP Registration
- 3-step wizard
- 66 form fields
- Validation
- File upload support

### Admin Dashboard
- Overview stats
- Enterprise approval
- OCOP approval
- Category management
- Reports & analytics

---

## 🛠️ Development Tips

### Backend Status Indicator
Frontend hiển thị banner màu vàng góc phải-dưới nếu backend offline:
```
⚠️ Backend API không khả dụng
Ứng dụng đang sử dụng mock data
```

### Environment Variables
Tạo `.env.local`:
```bash
# Backend URL
NEXT_PUBLIC_API_BASE=https://localhost:5001/api

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Mock Data
Location: `src/lib/mock-data.ts`
- 12 products
- Various categories
- OCOP ratings (3-5 stars)
- Full product info

---

## 📚 Documentation

| File | Description |
|------|-------------|
| `API_INTEGRATION_COMPLETE.md` | Chi tiết đầy đủ về API integration |
| `TROUBLESHOOTING.md` | Hướng dẫn fix lỗi thường gặp |
| `QUICK_START.md` | Guide này |

---

## 🎯 Quick Commands

```bash
# Frontend
npm install          # Cài packages
npm run dev          # Dev server
npm run build        # Production build
npm start            # Run production

# Backend
dotnet restore       # Restore packages
dotnet run           # Chạy server
dotnet ef database update  # Apply migrations
dotnet watch run     # Hot reload

# Database
createdb GiaLaiOCOP  # Tạo database
psql GiaLaiOCOP      # Connect to database
```

---

## ✨ Key Features

### 🏆 OCOP Rating System
- Products có rating 3-5 sao
- Badges hiển thị đẹp
- Filter by rating

### 📋 Product Approval
- EnterpriseAdmin tạo → `PendingApproval`
- SystemAdmin review → `Approved`/`Rejected`
- Public chỉ thấy Approved

### 💳 Multi-Enterprise Payment
- Order từ nhiều enterprises
- Payment riêng mỗi enterprise
- QR code cho BankTransfer

### 🗺️ Map Integration
- Search by location
- Filter by district, OCOP rating
- Distance calculation

---

## 🔥 Hot Tips

1. **Backend Status:** Xem banner góc phải-dưới
2. **Console Logs:** F12 → Console để xem API calls
3. **Mock Data:** Tự động fallback khi backend offline
4. **Swagger UI:** `https://localhost:5001/swagger` để test APIs
5. **Database:** Chạy migrations trước khi chạy backend

---

## 📞 Need Help?

1. ✅ Check `TROUBLESHOOTING.md`
2. ✅ Check console logs (F12)
3. ✅ Check backend terminal
4. ✅ Verify backend is running
5. ✅ Check `API_INTEGRATION_COMPLETE.md`

---

**🎉 Enjoy coding!**

