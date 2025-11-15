# 📋 TEST CASES - GIALAI OCOP E-COMMERCE

Test cases đầy đủ cho dự án GiaLai OCOP Frontend

## 📁 Danh sách File Test Cases

| File | Module | Số Test Cases | Mô tả |
|------|--------|---------------|-------|
| **01_Authentication_TestCases.csv** | Authentication | 20 TCs | Login, Register, Logout, Protected Routes |
| **02_Products_TestCases.csv** | Products | 25 TCs | Browse, Search, Filter, View Details, OCOP Rating |
| **03_OCOP_Registration_TestCases.csv** | OCOP Registration | 25 TCs | 3-step Form, Validation, File Upload, Submit |
| **04_Shopping_Cart_TestCases.csv** | Shopping Cart | 25 TCs | Add, Update, Remove, Checkout, LocalStorage |
| **05_Admin_Functions_TestCases.csv** | Admin Dashboard | 25 TCs | Approve Enterprises, Approve Products, Manage Categories |
| **06_Orders_Payment_TestCases.csv** | Orders & Payment | 25 TCs | Create Order, Payment COD/BankTransfer, QR Code |
| **07_Map_Search_TestCases.csv** | Map & Search | 20 TCs | Map Display, Search, Filter, Nearby, Enterprise Details |
| **08_UI_UX_TestCases.csv** | UI/UX | 25 TCs | Responsive, Loading, Errors, Animations, Accessibility |

**TỔNG CỘNG: 190+ Test Cases**

---

## 📊 Format Test Case

Mỗi file CSV có cấu trúc:

```
ID | Mô tả | Điều kiện | Dữ liệu đầu vào | Bước thực hiện | Kết quả mong đợi | Kết quả | Mức độ Ưu tiên
```

### Ví dụ:

```csv
AUTH-001,Đăng nhập thành công với tài khoản Customer,Backend API hoạt động; User đã được tạo trong DB,"Email: customer@test.com
Password: Test@123","1. Mở trang /login
2. Nhập email hợp lệ
3. Nhập password hợp lệ
4. Click nút Đăng nhập","- Hiển thị loading
- Lưu token vào localStorage
- Redirect tới /home
- Header hiển thị tên user",,High
```

---

## 🎯 Mức độ Ưu tiên

| Mức độ | Ý nghĩa | Số lượng ước tính |
|--------|---------|-------------------|
| **High** | Chức năng core, phải test trước | ~80 TCs (42%) |
| **Medium** | Chức năng quan trọng, test sau | ~70 TCs (37%) |
| **Low** | Chức năng phụ, UI/UX polish | ~40 TCs (21%) |

---

## 🚀 Cách sử dụng

### 1. Mở file CSV bằng Excel/Google Sheets

```bash
# Windows
start excel test-cases/01_Authentication_TestCases.csv

# Mac
open -a "Microsoft Excel" test-cases/01_Authentication_TestCases.csv

# Linux
libreoffice test-cases/01_Authentication_TestCases.csv
```

### 2. Import vào Test Management Tool

- **Jira/Xray**: Import CSV
- **TestRail**: Import test cases
- **Azure DevOps**: Import work items
- **Zephyr**: Import test cases

### 3. Thực hiện Testing

1. Mở file test case tương ứng
2. Thực hiện từng bước trong cột "Bước thực hiện"
3. So sánh với "Kết quả mong đợi"
4. Ghi kết quả vào cột "Kết quả": **PASS** / **FAIL** / **BLOCKED**
5. Nếu FAIL, ghi chi tiết lỗi và attach screenshot

---

## 📝 Coverage Map

### Module Coverage

```
✅ Authentication (Login, Register, Logout, Session)
✅ Products (CRUD, Search, Filter, OCOP Rating)
✅ OCOP Registration (3-step form với 66 fields)
✅ Shopping Cart (Add, Update, Remove, Checkout)
✅ Orders (Create, View, Status, Cancel)
✅ Payment (COD, BankTransfer, QR Code, Multi-enterprise)
✅ Admin (Approve applications, Approve products, Categories, Reports)
✅ Map (Search, Filter, Nearby, Enterprise details)
✅ UI/UX (Responsive, Loading, Errors, Animations)
```

### User Roles Coverage

```
✅ Guest User (Browse products, View details)
✅ Customer (Login, Shop, Checkout, OCOP Registration)
✅ EnterpriseAdmin (Manage products, View orders, Confirm payments)
✅ SystemAdmin (Approve all, Manage system, Reports)
```

---

## 🔍 Test Scenarios

### Critical Path Testing

1. **User Registration → Login → Browse Products → Add to Cart → Checkout**
   - Files: 01, 02, 04, 06
   - ~30 test cases

2. **OCOP Registration → Admin Approval → Enterprise Created**
   - Files: 01, 03, 05
   - ~25 test cases

3. **Product Upload → Admin Approve → Product Live**
   - Files: 02, 05
   - ~15 test cases

### Regression Testing

- Chạy toàn bộ High priority test cases: ~80 TCs
- Estimate: 4-6 hours

### Smoke Testing

- Login/Logout: AUTH-001, AUTH-002, AUTH-017
- View Products: PROD-001, PROD-002
- Add to Cart: CART-001
- Admin Access: ADMIN-001
- Total: ~10 TCs, ~20 minutes

---

## 🐛 Bug Report Template

Khi phát hiện lỗi, báo cáo theo format:

```markdown
**Test Case ID**: PROD-015
**Title**: Hover effect không hoạt động trên product card
**Severity**: Low
**Priority**: P3
**Steps to Reproduce**:
1. Mở /products
2. Di chuột vào product card
3. Observe

**Expected**: Card shadow tăng, image zoom
**Actual**: Không có effect nào

**Environment**:
- Browser: Chrome 120
- OS: Windows 11
- URL: http://localhost:3000/products

**Screenshot**: [attach]
```

---

## 📈 Test Execution Tracking

### Cách tracking progress:

1. **Google Sheets**: Import CSV, thêm cột "Tester", "Date", "Status"
2. **Excel**: Pivot table để thống kê PASS/FAIL rate
3. **Jira**: Create test execution, link to requirements

### Metrics cần track:

- Total Test Cases: 190+
- Executed: ? / 190
- Pass: ?
- Fail: ?
- Blocked: ?
- Pass Rate: (Pass / Executed) * 100%

---

## 🔗 Liên kết

- **Backend API**: https://gialai-ocop-be.onrender.com/api
- **Swagger**: https://gialai-ocop-be.onrender.com/swagger
- **Frontend Dev**: http://localhost:3000
- **Project README**: ../README.md

---

## 💡 Tips Testing

### Testing hiệu quả:

1. **Test theo Priority**: High → Medium → Low
2. **Test theo User Flow**: Theo critical paths
3. **Regression Test**: Mỗi release chạy lại High TCs
4. **Automation**: Ưu tiên automate High priority TCs
5. **Cross-browser**: Test trên Chrome, Firefox, Safari, Edge
6. **Responsive**: Test trên Desktop, Tablet, Mobile

### Common Issues:

- ⚠️ **Backend Cold Start**: Lần đầu request mất 30-60s (Render free tier)
- ⚠️ **CORS**: Đã fix với `credentials: "omit"`
- ⚠️ **Empty Products**: Chỉ products `status="Approved"` mới hiển thị
- ⚠️ **LocalStorage**: Clear browser cache khi test authentication

---

## 📞 Support

Có vấn đề về test cases?

- **Issue Tracker**: Create GitHub issue
- **Documentation**: See ../DOCS.md, ../TROUBLESHOOTING.md

---

**Created**: November 15, 2025
**Version**: 1.0
**Status**: ✅ Ready for Testing


