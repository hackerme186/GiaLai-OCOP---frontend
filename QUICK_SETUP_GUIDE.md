# 🚀 QUICK SETUP GUIDE - Hiển thị Data Thật từ Database

## ⚡ 3 BƯỚC ĐƠN GIẢN

### ✅ BƯỚC 1: Update Database (Quan trọng nhất!)

**Mở Supabase SQL Editor:**
1. Vào: https://supabase.com/dashboard/project/obafbtrimbjllrsonszz
2. Click **SQL Editor** (sidebar bên trái)
3. Click **New query**

**Copy & Paste SQL này:**
```sql
UPDATE "Products"
SET "Status" = 'Approved'
WHERE "Status" IS NULL;

-- Verify
SELECT "Id", "Name", "Status", "Price" FROM "Products";
```

4. Click **RUN** (hoặc nhấn `Ctrl + Enter`)
5. Kết quả phải thấy: "Success. No rows returned" hoặc danh sách products

---

### ✅ BƯỚC 2: Restart Frontend

**Trong terminal đang chạy `npm run dev`:**
```bash
# Nhấn Ctrl+C để stop

# Đợi 2 giây, rồi chạy lại:
npm run dev
```

---

### ✅ BƯỚC 3: Reload Browser

**Hard refresh để xóa cache:**
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Hoặc:**
```
Windows/Linux: Ctrl + F5
Mac: Cmd + R
```

---

## 🎉 XONG! Kiểm tra kết quả:

✅ Mở http://localhost:3000  
✅ Scroll xuống "Sản phẩm OCOP nổi bật"  
✅ Bạn sẽ thấy **10 sản phẩm THẬT** từ database:

1. ☕ Cà phê Robusta Gia Lai - 150,000₫
2. 🍯 Mật ong rừng Gia Lai - 150,000₫
3. 🌾 Tinh dầu sả chanh - 150,000₫
4. 🍵 Trà atiso Đà Lạt - 120,000₫
5. 🌺 Hoa Điều Quy Nhơn - 150,000₫
6. 🐟 Cá Biển Quy Nhơn - 150,000₫
7. 🧃 Trà Dưỡng Tâm Thanh Lộc - 55,000₫
8. 🧋 TRA SUA TRAN CHAU - 4,000₫
9. 🍵 matcha latte - 30,000₫
10. 🎵 GiaGungNhauLaDuoc - 100,000₫

---

## 🔍 KIỂM TRA BACKEND TRỰC TIẾP

**Mở URL này trong browser:**
```
https://gialai-ocop-be.onrender.com/api/products?pageSize=10
```

**Kết quả mong đợi:**
- ✅ Thấy JSON data với danh sách products
- ✅ Mỗi product có: id, name, price, status, etc.

**Nếu thấy:**
- ⏳ "Backend is starting..." → Đợi 30-60 giây (Render cold start)
- ❌ Error → Backend offline, check Render dashboard

---

## 🐛 TROUBLESHOOTING

### Vấn đề: Vẫn thấy mock data

**Nguyên nhân:** Browser cache  
**Giải pháp:**
1. Mở DevTools: `F12`
2. Right-click nút Reload
3. Chọn "Empty Cache and Hard Reload"

### Vấn đề: Backend "Failed to fetch"

**Nguyên nhân:** Backend đang sleep (Render free tier)  
**Giải pháp:**
1. Mở: https://gialai-ocop-be.onrender.com/api/products
2. Đợi 30-60 giây để wake up
3. Reload frontend

### Vấn đề: Chỉ thấy 1 sản phẩm

**Nguyên nhân:** Chưa chạy SQL UPDATE  
**Giải pháp:** Quay lại BƯỚC 1 ở trên

---

## 📚 DOCUMENTS CHI TIẾT

- 📖 **API Implementation:** `API_IMPLEMENTATION_STATUS.md`
- 🔧 **Database Setup:** `SETUP_DATABASE.sql`
- 📋 **Full Docs:** `PRODUCTION_READY.md`

---

## 🎯 TÓM TẮT CÁC FILE QUAN TRỌNG

```
frontend/
├── src/lib/api.ts                    # ✅ API Helper (đã có sẵn)
├── src/components/home/
│   ├── FeaturedProducts.tsx          # ✅ Dùng real API
│   └── MapSection.tsx                # ✅ Dùng real API
├── src/app/products/page.tsx         # ✅ Dùng real API
├── API_IMPLEMENTATION_STATUS.md      # 📖 Docs đầy đủ
├── SETUP_DATABASE.sql                # 🔧 SQL cần chạy
└── QUICK_SETUP_GUIDE.md              # 🚀 Guide này
```

---

## ✨ DONE!

Sau 3 bước trên, frontend sẽ hiển thị **100% data thật từ Supabase**!

Nếu có vấn đề gì, check:
1. ✅ SQL đã chạy trong Supabase?
2. ✅ Frontend đã restart?
3. ✅ Browser đã hard refresh?
4. ✅ Backend có online? (check link ở trên)

**Good luck! 🚀**

