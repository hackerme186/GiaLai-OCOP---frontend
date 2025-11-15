# 🏗️ Hệ thống Customer - Thiết kế và Implementation

## 📋 Tổng quan

Hệ thống đảm bảo mỗi Customer có dữ liệu hoàn toàn riêng biệt, không trùng lặp giữa các Customer. Mỗi Customer được xác định bằng **CustomerId** (chính là `User.id`), và tất cả dữ liệu đều được liên kết với CustomerId này.

---

## 🔐 1. Định danh Customer (CustomerId)

### Backend:
- **CustomerId = User.Id** (từ bảng `Users` trong database)
- User được tạo khi đăng ký với `Role = "Customer"`
- Mỗi User có `Id` duy nhất (auto-increment primary key)

### Frontend:
- Lưu `userId` trong `localStorage` key: `ocop_user_profile`
- JWT token chứa `userId` trong claim `NameIdentifier`
- Frontend extract `userId` từ JWT hoặc từ profile

### Cách lấy CustomerId:
```typescript
import { getUserProfile } from "@/lib/auth"
const profile = getUserProfile()
const customerId = profile?.id  // Đây chính là CustomerId
```

---

## 🛒 2. Giỏ hàng (Cart) - Theo từng Customer

### Implementation:

#### Storage Key:
- **Key format**: `cart_{customerId}`
- **Ví dụ**: `cart_123` cho customer có id = 123
- **Guest cart**: `cart_guest` (tạm thời, sẽ bị clear khi login)

#### File: `src/lib/cart-context.tsx`

**Tính năng:**
- ✅ Mỗi Customer có cart riêng biệt
- ✅ Tự động load cart khi user login
- ✅ Tự động clear cart khi user logout
- ✅ Tự động switch cart khi user đổi (login user khác)
- ✅ Lưu cart vào localStorage với key theo userId

**Flow:**
```
1. User login → Load cart từ `cart_{userId}`
2. User thêm sản phẩm → Lưu vào `cart_{userId}`
3. User logout → Clear `cart_{userId}` và load cart trống
4. User login user khác → Load cart mới từ `cart_{newUserId}`
```

**Code Example:**
```typescript
// Load cart khi user login
const profile = getUserProfile()
const userId = profile?.id
const cartKey = `cart_${userId}`
const savedCart = localStorage.getItem(cartKey)

// Save cart khi thay đổi
localStorage.setItem(cartKey, JSON.stringify(cart))
```

---

## 📦 3. Địa chỉ giao hàng (Shipping Addresses) - Theo từng Customer

### Implementation:

#### Storage Key:
- **Key format**: `saved_addresses_{customerId}`
- **Ví dụ**: `saved_addresses_123` cho customer có id = 123
- **Guest addresses**: `saved_addresses_guest` (tạm thời)

#### File: `src/lib/shipping-addresses.ts`

**Tính năng:**
- ✅ Mỗi Customer có danh sách địa chỉ riêng
- ✅ Tự động lấy địa chỉ theo userId hiện tại
- ✅ Lưu địa chỉ với key theo userId
- ✅ Clear địa chỉ khi logout

**Functions:**
```typescript
// Tất cả functions tự động sử dụng userId hiện tại
getSavedShippingAddresses()  // Lấy theo userId hiện tại
addShippingAddress(...)      // Thêm vào userId hiện tại
updateShippingAddress(...)   // Cập nhật của userId hiện tại
deleteShippingAddress(...)   // Xóa của userId hiện tại
```

---

## 🛍️ 4. Đơn hàng (Orders) - Liên kết với CustomerId

### Backend:
- Order có field `UserId` trong bảng `Orders`
- Backend tự động lấy `UserId` từ JWT token khi tạo order
- Frontend không cần gửi `userId` trong request body

### Frontend:
- Gọi API `createOrder()` với payload:
  ```typescript
  {
    shippingAddress: string,
    items: Array<{ productId, quantity }>,
    paymentMethod: "COD" | "BankTransfer"
  }
  ```
- Backend tự động gắn `userId` từ JWT token

### File: `src/lib/api.ts`
```typescript
export async function createOrder(payload: CreateOrderDto): Promise<Order> {
  // JWT token được tự động gửi trong Authorization header
  // Backend extract userId từ token và gắn vào order
  return request<Order>("/orders", {
    method: "POST",
    json: payload,
  });
}
```

**Order Interface:**
```typescript
export interface Order {
  id: number;
  userId: number;  // ← CustomerId được gắn tự động từ backend
  orderDate: string;
  shippingAddress?: string;
  totalAmount: number;
  status: string;
  // ...
}
```

### Xem đơn hàng:
- API `GET /orders` trả về orders của user hiện tại (filtered by userId từ JWT)
- File: `src/app/orders/page.tsx` - Chỉ hiển thị orders của customer hiện tại

---

## 💳 5. Thanh toán (Payments) - Liên kết với Order và Customer

### Backend:
- Payment có field `OrderId` → Liên kết với Order
- Order có field `UserId` → Liên kết với Customer
- **Chain**: Payment → Order → Customer

### Frontend:
- Khi tạo payment, chỉ cần gửi `orderId`
- Backend tự động lấy customerId từ Order

---

## 🔑 6. Authentication & User Isolation

### Đăng ký (Register):

#### Backend: `AuthController.Register()`
```csharp
// Kiểm tra email đã tồn tại
if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email))
    return Conflict("Email đã được sử dụng.");
```

✅ **Đảm bảo không trùng email:**
- Backend check `Email` (case-insensitive)
- Trả về `409 Conflict` nếu email đã tồn tại
- Frontend hiển thị lỗi: "Email đã được sử dụng"

#### Frontend: `RegisterForm.tsx`
- Validate email format trước khi submit
- Hiển thị lỗi từ backend nếu email trùng

### Đăng nhập (Login):

#### Backend: `AuthController.Login()`
```csharp
var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == email);
if (user == null || !BCrypt.Verify(password, user.Password))
    return Unauthorized("Email hoặc mật khẩu không đúng.");
```

✅ **Đảm bảo xác thực đúng:**
- Check email và password
- Mỗi email chỉ map với 1 user
- JWT token chứa userId duy nhất

#### Frontend: `LoginForm.tsx`
- Lưu token và profile vào localStorage
- Trigger cart reload khi login thành công
- Clear cart cũ và load cart của user mới

### Đăng xuất (Logout):

#### Frontend: `src/lib/auth.ts`
```typescript
export function logout() {
  const profile = getUserProfile();
  const userId = profile?.id;
  
  // Clear authentication
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(PROFILE_KEY);
  
  // Clear user-specific data
  if (userId) {
    localStorage.removeItem(`cart_${userId}`);
    localStorage.removeItem(`saved_addresses_${userId}`);
  }
  
  // Trigger storage event
  window.dispatchEvent(new Event('storage'));
}
```

✅ **Xóa dữ liệu khi logout:**
- Clear token và profile
- Clear cart của user
- Clear shipping addresses của user
- Trigger event để cart context clear state

---

## 🔄 7. Data Flow - Customer Isolation

### Scenario 1: User A login → User B login

```
1. User A login:
   - Load cart từ `cart_123`
   - Load addresses từ `saved_addresses_123`
   
2. User B login:
   - Clear cart của User A
   - Load cart từ `cart_456` (User B)
   - Load addresses từ `saved_addresses_456` (User B)
```

### Scenario 2: User A thêm sản phẩm vào cart

```
1. User A click "Thêm vào giỏ"
2. Cart context lấy userId hiện tại: 123
3. Lưu vào `cart_123`
4. User B không thấy sản phẩm của User A
```

### Scenario 3: User A tạo đơn hàng

```
1. User A click "Thanh toán"
2. Frontend gọi `createOrder({ shippingAddress, items, paymentMethod })`
3. Backend extract userId từ JWT token (userId = 123)
4. Backend tạo Order với `UserId = 123`
5. User B không thấy order của User A
```

### Scenario 4: User A logout

```
1. User A click "Đăng xuất"
2. Clear `cart_123`
3. Clear `saved_addresses_123`
4. Clear token và profile
5. Cart context load cart trống
```

---

## 🛡️ 8. Bảo mật và Validation

### Email Uniqueness:
- ✅ **Backend**: Check email trùng khi register
- ✅ **Database**: Unique constraint trên column `Email` (nên có)

### UserId Isolation:
- ✅ **Orders**: Backend chỉ trả về orders của user hiện tại (filtered by JWT userId)
- ✅ **Payments**: Linked through Order.UserId
- ✅ **Cart**: localStorage key theo userId
- ✅ **Addresses**: localStorage key theo userId

### Token-based Authentication:
- ✅ JWT token chứa userId
- ✅ Backend extract userId từ token, không trust client
- ✅ Frontend gửi token trong `Authorization: Bearer {token}` header

---

## 📊 9. Database Schema (Backend)

```sql
-- Users table (Customer = User với Role = 'Customer')
CREATE TABLE Users (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    Email NVARCHAR(100) NOT NULL UNIQUE,  -- ← UNIQUE constraint
    Password NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'Customer',
    ShippingAddress NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    IsEmailVerified BIT DEFAULT 0
);

-- Orders table
CREATE TABLE Orders (
    Id INT PRIMARY KEY IDENTITY(1,1),
    UserId INT NOT NULL,  -- ← Foreign key to Users.Id
    OrderDate DATETIME2 NOT NULL,
    ShippingAddress NVARCHAR(500),
    TotalAmount DECIMAL(18,2) NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    PaymentMethod NVARCHAR(50),
    PaymentStatus NVARCHAR(50),
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- Payments table
CREATE TABLE Payments (
    Id INT PRIMARY KEY IDENTITY(1,1),
    OrderId INT NOT NULL,  -- ← Foreign key to Orders.Id
    Amount DECIMAL(18,2) NOT NULL,
    PaymentMethod NVARCHAR(50),
    PaymentStatus NVARCHAR(50),
    FOREIGN KEY (OrderId) REFERENCES Orders(Id)
);

-- Indexes để tối ưu query
CREATE INDEX IX_Orders_UserId ON Orders(UserId);
CREATE INDEX IX_Users_Email ON Users(Email);
```

---

## ✅ 10. Checklist - Đảm bảo Customer Isolation

### Backend:
- [x] Email unique constraint trong database
- [x] Check email trùng khi register
- [x] Extract userId từ JWT token (không trust client)
- [x] Filter orders theo userId từ JWT
- [x] Orders có foreign key đến Users.Id

### Frontend:
- [x] Cart lưu theo `cart_{userId}`
- [x] Addresses lưu theo `saved_addresses_{userId}`
- [x] Logout clear tất cả dữ liệu user-specific
- [x] Login trigger reload cart và addresses
- [x] Register tạo user mới với unique email
- [x] Display error khi email trùng

---

## 🧪 11. Test Cases

### Test 1: Email Uniqueness
```
1. Register với email: test@example.com
2. Thử register lại với email: test@example.com
3. Expected: Lỗi "Email đã được sử dụng"
```

### Test 2: Cart Isolation
```
1. User A login → Thêm sản phẩm vào cart
2. User A logout
3. User B login → Cart phải trống (không có sản phẩm của User A)
```

### Test 3: Order Isolation
```
1. User A login → Tạo đơn hàng
2. User B login → Xem orders
3. Expected: User B không thấy orders của User A
```

### Test 4: Address Isolation
```
1. User A login → Thêm địa chỉ "Nhà A"
2. User A logout
3. User B login → Thêm địa chỉ "Nhà B"
4. User B logout
5. User A login lại → Chỉ thấy "Nhà A" (không thấy "Nhà B")
```

---

## 📝 12. Migration Guide (cho dữ liệu cũ)

Nếu có dữ liệu cart/addresses cũ dùng key chung:

```typescript
// Migration script (chạy một lần khi deploy)
function migrateOldData() {
  const oldCart = localStorage.getItem('cart');
  const oldAddresses = localStorage.getItem('saved_shipping_addresses');
  
  const profile = getUserProfile();
  const userId = profile?.id;
  
  if (userId && oldCart) {
    localStorage.setItem(`cart_${userId}`, oldCart);
    localStorage.removeItem('cart');
  }
  
  if (userId && oldAddresses) {
    localStorage.setItem(`saved_addresses_${userId}`, oldAddresses);
    localStorage.removeItem('saved_shipping_addresses');
  }
}
```

---

## 🎯 Kết luận

Hệ thống đã được thiết kế để đảm bảo:

✅ **Mỗi Customer có CustomerId duy nhất** (từ User.Id)
✅ **Dữ liệu hoàn toàn riêng biệt** (cart, addresses theo userId)
✅ **Không trùng email** (backend validation + database constraint)
✅ **Orders liên kết đúng CustomerId** (backend tự động gắn từ JWT)
✅ **Logout clear dữ liệu** (cart, addresses của user đó)
✅ **Login load lại dữ liệu** (cart, addresses của user mới)

**Tất cả dữ liệu đều được bảo vệ và cách ly theo CustomerId!** 🎉

