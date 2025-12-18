# 📋 TỔNG QUAN DỰ ÁN GIA LAI OCOP

## 🎯 MỤC ĐÍCH DỰ ÁN

**GiaLai OCOP** là một nền tảng thương mại điện tử chuyên biệt dành cho các sản phẩm OCOP (One Commune One Product - Mỗi xã một sản phẩm) của tỉnh Gia Lai, Việt Nam. Hệ thống cho phép:

- Các doanh nghiệp/hộ kinh doanh đăng ký và bán sản phẩm OCOP
- Khách hàng mua sắm sản phẩm OCOP trực tuyến
- Quản trị viên hệ thống quản lý toàn bộ nền tảng
- Hiển thị bản đồ các doanh nghiệp OCOP trên địa bàn tỉnh

---

## 🏗️ KIẾN TRÚC HỆ THỐNG

### Frontend (Next.js)
- **Framework**: Next.js 15.5.7 với React 19.1.0
- **Styling**: TailwindCSS 4
- **State Management**: TanStack React Query 5.90
- **Authentication**: NextAuth 4.24
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Recharts 3.5
- **QR Code**: qrcode.react

### Backend (ASP.NET Core)
- **Framework**: .NET 9.0
- **Database**: PostgreSQL (Npgsql)
- **ORM**: Entity Framework Core 9.0
- **Authentication**: JWT Bearer
- **File Storage**: Cloudinary
- **Email**: SendGrid
- **Payment**: VietQR
- **API Docs**: Swagger/OpenAPI

---

## 👥 PHÂN QUYỀN NGƯỜI DÙNG (ROLES)

### 1. **SystemAdmin** (Quản trị viên hệ thống)
- Quản lý toàn bộ hệ thống
- Duyệt/từ chối đơn đăng ký doanh nghiệp
- Duyệt/từ chối sản phẩm OCOP
- Quản lý danh mục sản phẩm
- Quản lý người dùng
- Quản lý ví điện tử hệ thống
- Xem báo cáo tổng hợp
- Quản lý tin tức
- Quản lý hình ảnh hệ thống

### 2. **EnterpriseAdmin** (Admin doanh nghiệp)
- Quản lý thông tin doanh nghiệp
- Quản lý sản phẩm của doanh nghiệp
- Quản lý đơn hàng
- Quản lý kho hàng (inventory)
- Xem báo cáo doanh thu
- Quản lý ví điện tử doanh nghiệp
- Nhận thông báo

### 3. **Customer** (Khách hàng)
- Xem và mua sản phẩm
- Quản lý giỏ hàng
- Đặt hàng và thanh toán
- Quản lý địa chỉ giao hàng
- Đánh giá sản phẩm
- Quản lý ví điện tử cá nhân
- Theo dõi đơn hàng

### 4. **Shipper** (Người giao hàng)
- Xem danh sách đơn hàng cần giao
- Cập nhật trạng thái giao hàng

---

## 📊 CƠ SỞ DỮ LIỆU (DATABASE MODELS)

### Bảng chính:

#### 1. **Users** - Người dùng
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| Name | string | Họ tên |
| Email | string | Email đăng nhập |
| Password | string | Mật khẩu (BCrypt hash) |
| PhoneNumber | string? | Số điện thoại |
| Gender | string? | Giới tính |
| DateOfBirth | DateTime? | Ngày sinh |
| AvatarUrl | string? | URL ảnh đại diện |
| Role | string | SystemAdmin/EnterpriseAdmin/Customer |
| IsEmailVerified | bool | Đã xác thực email |
| IsActive | bool | Trạng thái hoạt động |
| GoogleId | string? | Google OAuth ID |
| FacebookId | string? | Facebook OAuth ID |
| EnterpriseId | int? | ID doanh nghiệp (nếu là EnterpriseAdmin) |
| ProvinceId | int? | Tỉnh/Thành phố |
| DistrictId | int? | Quận/Huyện |
| WardId | int? | Phường/Xã |
| AddressDetail | string? | Địa chỉ chi tiết |
| CreatedAt | DateTime | Ngày tạo |
| UpdatedAt | DateTime? | Ngày cập nhật |
| PasswordUpdatedAt | DateTime? | Ngày đổi mật khẩu |

#### 2. **Enterprises** - Doanh nghiệp
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| Name | string | Tên doanh nghiệp |
| Description | string | Mô tả |
| Address | string | Địa chỉ chi tiết |
| Ward | string | Phường/Xã |
| District | string | Quận/Huyện |
| Province | string | Tỉnh/Thành phố |
| Latitude | double? | Vĩ độ (GPS) |
| Longitude | double? | Kinh độ (GPS) |
| PhoneNumber | string | Số điện thoại |
| EmailContact | string | Email liên hệ |
| Website | string | Website |
| OCOPRating | int? | Xếp hạng OCOP (3-5 sao) |
| BusinessField | string | Ngành hàng |
| ImageUrl | string? | Ảnh đại diện |
| ApprovalStatus | string | Pending/Approved/Rejected |
| RejectionReason | string? | Lý do từ chối |
| AverageRating | double? | Điểm đánh giá trung bình |
| BankCode | string? | Mã ngân hàng |
| BankAccount | string? | Số tài khoản |
| BankAccountName | string? | Tên chủ TK |
| CreatedAt | DateTime | Ngày tạo |
| UpdatedAt | DateTime? | Ngày cập nhật |

#### 3. **Products** - Sản phẩm
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| Name | string | Tên sản phẩm |
| Description | string | Mô tả |
| Price | decimal | Giá bán |
| ImageUrl | string? | Ảnh chính |
| OCOPRating | int? | Xếp hạng OCOP (3-5 sao) |
| StockStatus | string | InStock/OutOfStock |
| StockQuantity | int | Số lượng tồn kho |
| Status | string | PendingApproval/Approved/Rejected |
| ApprovedByUserId | int? | Người duyệt |
| ApprovedAt | DateTime? | Ngày duyệt |
| AverageRating | double? | Điểm đánh giá TB |
| EnterpriseId | int | FK → Enterprises |
| CategoryId | int? | FK → Categories |
| CreatedAt | DateTime | Ngày tạo |
| UpdatedAt | DateTime? | Ngày cập nhật |

#### 4. **Orders** - Đơn hàng
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| UserId | int | FK → Users |
| OrderDate | DateTime | Ngày đặt |
| TotalAmount | decimal | Tổng tiền |
| Status | string | Pending/Processing/Shipped/Completed/Cancelled/PendingCompletion |
| ShippingAddress | string? | Địa chỉ giao hàng (cũ) |
| ShippingAddressId | int? | FK → ShippingAddresses |
| ShipperId | int? | Người giao hàng |
| ShippedAt | DateTime? | Ngày giao |
| DeliveredAt | DateTime? | Ngày nhận |
| DeliveryNotes | string? | Ghi chú giao hàng |
| PaymentMethod | string | COD/BankTransfer |
| PaymentStatus | string | Pending/AwaitingTransfer/BankTransferConfirmed/Paid/... |
| PaymentReference | string? | Mã tham chiếu |
| BankTransferRejectionReason | string? | Lý do từ chối CK |
| CompletionRequestedAt | DateTime? | Yêu cầu hoàn thành |
| CompletionApprovedAt | DateTime? | Duyệt hoàn thành |
| CompletionRejectedAt | DateTime? | Từ chối hoàn thành |
| CompletionRejectionReason | string? | Lý do từ chối |

#### 5. **OrderItems** - Chi tiết đơn hàng
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| OrderId | int | FK → Orders |
| ProductId | int | FK → Products |
| Quantity | int | Số lượng |
| Price | decimal | Đơn giá |

#### 6. **Categories** - Danh mục sản phẩm
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| Name | string | Tên danh mục |
| Description | string? | Mô tả |
| IsActive | bool | Trạng thái |

#### 7. **Reviews** - Đánh giá sản phẩm
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| UserId | int | FK → Users |
| ProductId | int | FK → Products |
| Comment | string | Nội dung đánh giá |
| Rating | int | Điểm (1-5) |
| CreatedAt | DateTime | Ngày tạo |

#### 8. **ShippingAddresses** - Địa chỉ giao hàng
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| UserId | int | FK → Users |
| FullName | string | Họ tên người nhận |
| PhoneNumber | string | SĐT |
| AddressLine | string | Số nhà, đường |
| Ward | string | Phường/Xã |
| District | string | Quận/Huyện |
| Province | string | Tỉnh/TP |
| Latitude | double? | Vĩ độ |
| Longitude | double? | Kinh độ |
| Label | string? | Nhãn (Nhà riêng, Công ty) |
| IsDefault | bool | Địa chỉ mặc định |
| CreatedAt | DateTime | Ngày tạo |
| UpdatedAt | DateTime? | Ngày cập nhật |

#### 9. **Wallets** - Ví điện tử
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| UserId | int | FK → Users (Unique) |
| Balance | decimal | Số dư |
| Currency | string | Loại tiền (VND) |
| CreatedAt | DateTime | Ngày tạo |

#### 10. **WalletTransactions** - Giao dịch ví
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| WalletId | int | FK → Wallets |
| Type | string | deposit/withdraw/payment/refund |
| Amount | decimal | Số tiền |
| BalanceAfter | decimal | Số dư sau GD |
| Description | string | Mô tả |
| Status | string | pending/success/failed |
| OrderId | int? | FK → Orders |
| PaymentGateway | string? | vietqr/admin |
| PaymentGatewayTransactionId | string? | Mã GD bên ngoài |
| CreatedAt | DateTime | Ngày tạo |

#### 11. **WalletRequests** - Yêu cầu nạp/rút tiền
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| UserId | int | FK → Users |
| WalletId | int | FK → Wallets |
| Type | string | deposit/withdraw |
| Amount | decimal | Số tiền |
| Description | string | Mô tả |
| Status | string | pending/approved/rejected/completed |
| RejectionReason | string? | Lý do từ chối |
| ProcessedBy | int? | Admin xử lý |
| ProcessedAt | DateTime? | Ngày xử lý |
| BankAccountId | int? | FK → BankAccounts |
| CreatedAt | DateTime | Ngày tạo |
| UpdatedAt | DateTime? | Ngày cập nhật |

#### 12. **BankAccounts** - Tài khoản ngân hàng
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| UserId | int | FK → Users |
| BankCode | string | Mã ngân hàng |
| BankName | string | Tên ngân hàng |
| AccountNumber | string | Số tài khoản |
| AccountName | string | Tên chủ TK |
| IsDefault | bool | Mặc định |
| CreatedAt | DateTime | Ngày tạo |

#### 13. **Payments** - Thanh toán
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| OrderId | int | FK → Orders |
| EnterpriseId | int | FK → Enterprises |
| Amount | decimal | Số tiền |
| Method | string | COD/BankTransfer |
| Status | string | Pending/AwaitingTransfer/Paid/Cancelled |
| Reference | string | Mã tham chiếu |
| BankCode | string? | Mã ngân hàng |
| BankAccount | string? | Số TK |
| AccountName | string? | Tên chủ TK |
| QrCodeUrl | string? | URL mã QR |
| Notes | string? | Ghi chú |
| CreatedAt | DateTime | Ngày tạo |
| PaidAt | DateTime? | Ngày thanh toán |

#### 14. **Transactions** - Giao dịch (cũ)
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| OrderId | int | FK → Orders |
| Amount | decimal | Số tiền |
| TransactionDate | DateTime | Ngày GD |
| PaymentMethod | string | Phương thức |

#### 15. **EnterpriseApplications** - Đơn đăng ký doanh nghiệp
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| UserId | int | FK → Users |
| EnterpriseName | string | Tên DN |
| BusinessType | string | Loại hình (TNHH, HTX, HKD) |
| TaxCode | string | Mã số thuế |
| BusinessLicenseNumber | string | Số GPKD |
| LicenseIssuedDate | DateTime? | Ngày cấp |
| LicenseIssuedBy | string | Nơi cấp |
| Address | string | Địa chỉ |
| Ward | string | Phường/Xã |
| District | string | Quận/Huyện |
| Province | string | Tỉnh/TP |
| PhoneNumber | string | SĐT |
| EmailContact | string | Email |
| Website | string | Website |
| RepresentativeName | string | Người đại diện |
| RepresentativePosition | string | Chức vụ |
| RepresentativeIdNumber | string | CCCD/CMND |
| RepresentativeIdIssuedDate | DateTime? | Ngày cấp |
| RepresentativeIdIssuedBy | string | Nơi cấp |
| ProductionLocation | string | Địa điểm SX |
| NumberOfEmployees | string | Số lao động |
| ProductionScale | string | Quy mô SX |
| BusinessField | string | Ngành nghề |
| ProductName | string | Tên SP OCOP |
| ProductCategory | string | Nhóm SP |
| ProductDescription | string | Mô tả SP |
| ProductOrigin | string | Nguồn gốc |
| ProductCertifications | string | Chứng nhận |
| ProductImages | string | Ảnh SP |
| AttachedDocuments | string | Tài liệu đính kèm |
| AdditionalNotes | string | Ghi chú |
| Status | string | Pending/Approved/Rejected/Returned |
| AdminComment | string? | Nhận xét admin |
| CreatedAt | DateTime | Ngày nộp |
| UpdatedAt | DateTime? | Ngày cập nhật |

#### 16. **Images** - Hình ảnh
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| Url | string | URL ảnh |
| FileName | string? | Tên file |
| ContentType | string? | MIME type |
| FileSize | long? | Kích thước |
| ImageType | string | ProfileAvatar/ProductImage/EnterpriseImage/Other |
| UserId | int? | FK → Users |
| ProductId | int? | FK → Products |
| EnterpriseId | int? | FK → Enterprises |
| UploadedByUserId | int? | Người upload |
| UploadedByRole | string | Role người upload |
| IsActive | bool | Đang sử dụng |
| IsApproved | bool | Đã duyệt |
| Width | int? | Chiều rộng |
| Height | int? | Chiều cao |
| CreatedAt | DateTime | Ngày tạo |
| UpdatedAt | DateTime? | Ngày cập nhật |
| DeletedAt | DateTime? | Soft delete |

#### 17. **Notifications** - Thông báo
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| Type | string | product_approved/rejected/new_order/low_stock/system |
| Title | string | Tiêu đề |
| Message | string | Nội dung |
| Read | bool | Đã đọc |
| Link | string? | Link liên quan |
| EnterpriseId | int? | FK → Enterprises |
| UserId | int? | FK → Users |
| ProductId | int? | FK → Products |
| OrderId | int? | FK → Orders |
| CreatedAt | DateTime | Ngày tạo |

#### 18. **InventoryHistories** - Lịch sử kho
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| ProductId | int | FK → Products |
| EnterpriseId | int | FK → Enterprises |
| Type | string | import/export/adjustment |
| Quantity | int | Số lượng thay đổi |
| PreviousQuantity | int | SL trước |
| NewQuantity | int | SL sau |
| Reason | string? | Lý do |
| CreatedByUserId | int? | Người thực hiện |
| CreatedAt | DateTime | Ngày tạo |

#### 19. **Locations** - Vị trí (cho bản đồ)
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| Name | string | Tên |
| Address | string | Địa chỉ |
| Latitude | double | Vĩ độ |
| Longitude | double | Kinh độ |

#### 20. **Producers** - Nhà sản xuất
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| Name | string | Tên |
| Address | string | Địa chỉ |

#### 21. **Provinces/Districts/Wards** - Địa giới hành chính
- **Provinces**: Tỉnh/Thành phố
- **Districts**: Quận/Huyện (FK → Provinces)
- **Wards**: Phường/Xã (FK → Districts)

#### 22. **EmailVerifications** - Xác thực email
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| Email | string | Email |
| Code | string | Mã OTP |
| Purpose | string | register/reset_password |
| UserId | int? | FK → Users |
| ExpiresAt | DateTime | Hết hạn |
| IsUsed | bool | Đã sử dụng |
| CreatedAt | DateTime | Ngày tạo |

#### 23. **EnterpriseSettings** - Cài đặt doanh nghiệp
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| EnterpriseId | int | FK → Enterprises (Unique) |
| LowStockThreshold | int | Ngưỡng cảnh báo tồn kho |
| AutoNotifyLowStock | bool | Tự động thông báo |

#### 24. **EnterpriseBankInfo** - Thông tin ngân hàng DN
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| EnterpriseId | int | FK → Enterprises (Unique) |
| BankCode | string | Mã ngân hàng |
| BankName | string | Tên ngân hàng |
| AccountNumber | string | Số TK |
| AccountName | string | Tên chủ TK |
| IsVerified | bool | Đã xác thực |

#### 25. **OrderEnterpriseStatuses** - Trạng thái đơn hàng theo DN
| Field | Type | Description |
|-------|------|-------------|
| Id | int | Primary Key |
| OrderId | int | FK → Orders |
| EnterpriseId | int | FK → Enterprises |
| Status | string | Trạng thái riêng của DN |
| UpdatedAt | DateTime | Ngày cập nhật |

---

## 🔌 API ENDPOINTS (CONTROLLERS)

### 1. **AuthController** - Xác thực
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/google` - Đăng nhập Google
- `POST /api/auth/facebook` - Đăng nhập Facebook
- `POST /api/auth/verify-email` - Xác thực email
- `POST /api/auth/resend-verification` - Gửi lại mã xác thực
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu

### 2. **UsersController** - Người dùng
- `GET /api/users` - Danh sách người dùng (Admin)
- `GET /api/users/{id}` - Chi tiết người dùng
- `PUT /api/users/{id}` - Cập nhật người dùng
- `DELETE /api/users/{id}` - Xóa người dùng
- `PUT /api/users/{id}/toggle-active` - Bật/tắt trạng thái

### 3. **ProfileController** - Hồ sơ cá nhân
- `GET /api/profile` - Lấy thông tin profile
- `PUT /api/profile` - Cập nhật profile
- `PUT /api/profile/change-password` - Đổi mật khẩu
- `POST /api/profile/avatar` - Upload avatar

### 4. **ProductsController** - Sản phẩm
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/{id}` - Chi tiết sản phẩm
- `POST /api/products` - Tạo sản phẩm (Enterprise)
- `PUT /api/products/{id}` - Cập nhật sản phẩm
- `DELETE /api/products/{id}` - Xóa sản phẩm
- `PUT /api/products/{id}/approve` - Duyệt sản phẩm (Admin)
- `PUT /api/products/{id}/reject` - Từ chối sản phẩm (Admin)

### 5. **CategoriesController** - Danh mục
- `GET /api/categories` - Danh sách danh mục
- `GET /api/categories/{id}` - Chi tiết danh mục
- `POST /api/categories` - Tạo danh mục (Admin)
- `PUT /api/categories/{id}` - Cập nhật danh mục
- `DELETE /api/categories/{id}` - Xóa danh mục

### 6. **OrdersController** - Đơn hàng
- `GET /api/orders` - Danh sách đơn hàng
- `GET /api/orders/{id}` - Chi tiết đơn hàng
- `POST /api/orders` - Tạo đơn hàng
- `PUT /api/orders/{id}/status` - Cập nhật trạng thái
- `PUT /api/orders/{id}/cancel` - Hủy đơn hàng
- `PUT /api/orders/{id}/request-completion` - Yêu cầu hoàn thành
- `PUT /api/orders/{id}/approve-completion` - Duyệt hoàn thành (Admin)
- `PUT /api/orders/{id}/reject-completion` - Từ chối hoàn thành (Admin)

### 7. **PaymentsController** - Thanh toán
- `GET /api/payments` - Danh sách thanh toán
- `GET /api/payments/{id}` - Chi tiết thanh toán
- `POST /api/payments/confirm-bank-transfer` - Xác nhận chuyển khoản
- `PUT /api/payments/{id}/approve` - Duyệt thanh toán
- `PUT /api/payments/{id}/reject` - Từ chối thanh toán

### 8. **EnterprisesController** - Doanh nghiệp
- `GET /api/enterprises` - Danh sách doanh nghiệp
- `GET /api/enterprises/{id}` - Chi tiết doanh nghiệp
- `PUT /api/enterprises/{id}` - Cập nhật doanh nghiệp
- `PUT /api/enterprises/{id}/approve` - Duyệt doanh nghiệp (Admin)
- `PUT /api/enterprises/{id}/reject` - Từ chối doanh nghiệp (Admin)

### 9. **EnterpriseApplicationsController** - Đơn đăng ký DN
- `GET /api/enterprise-applications` - Danh sách đơn
- `GET /api/enterprise-applications/{id}` - Chi tiết đơn
- `POST /api/enterprise-applications` - Nộp đơn đăng ký
- `PUT /api/enterprise-applications/{id}/approve` - Duyệt đơn (Admin)
- `PUT /api/enterprise-applications/{id}/reject` - Từ chối đơn (Admin)

### 10. **WalletController** - Ví điện tử
- `GET /api/wallet` - Thông tin ví
- `GET /api/wallet/transactions` - Lịch sử giao dịch
- `POST /api/wallet/deposit` - Nạp tiền
- `POST /api/wallet/pay-order` - Thanh toán đơn hàng
- `POST /api/wallet/withdraw` - Rút tiền
- `GET /api/wallet/system-summary` - Tổng quan hệ thống (Admin)
- `GET /api/wallet/all-users` - Tất cả ví người dùng (Admin)
- `PUT /api/wallet/users/{userId}/balance` - Cập nhật số dư (Admin)

### 11. **WalletRequestController** - Yêu cầu nạp/rút
- `GET /api/wallet-requests` - Danh sách yêu cầu
- `GET /api/wallet-requests/{id}` - Chi tiết yêu cầu
- `POST /api/wallet-requests` - Tạo yêu cầu
- `PUT /api/wallet-requests/{id}/approve` - Duyệt yêu cầu (Admin)
- `PUT /api/wallet-requests/{id}/reject` - Từ chối yêu cầu (Admin)

### 12. **ReviewsController** - Đánh giá
- `GET /api/reviews` - Danh sách đánh giá
- `GET /api/reviews/product/{productId}` - Đánh giá của sản phẩm
- `POST /api/reviews` - Tạo đánh giá
- `PUT /api/reviews/{id}` - Cập nhật đánh giá
- `DELETE /api/reviews/{id}` - Xóa đánh giá

### 13. **ShippingAddressesController** - Địa chỉ giao hàng
- `GET /api/shipping-addresses` - Danh sách địa chỉ
- `GET /api/shipping-addresses/{id}` - Chi tiết địa chỉ
- `POST /api/shipping-addresses` - Tạo địa chỉ
- `PUT /api/shipping-addresses/{id}` - Cập nhật địa chỉ
- `DELETE /api/shipping-addresses/{id}` - Xóa địa chỉ
- `PUT /api/shipping-addresses/{id}/set-default` - Đặt mặc định

### 14. **BankAccountController** - Tài khoản ngân hàng
- `GET /api/bank-accounts` - Danh sách TK
- `POST /api/bank-accounts` - Thêm TK
- `PUT /api/bank-accounts/{id}` - Cập nhật TK
- `DELETE /api/bank-accounts/{id}` - Xóa TK
- `PUT /api/bank-accounts/{id}/set-default` - Đặt mặc định

### 15. **InventoryController** - Kho hàng
- `GET /api/inventory` - Danh sách sản phẩm trong kho
- `GET /api/inventory/history` - Lịch sử kho
- `POST /api/inventory/import` - Nhập kho
- `POST /api/inventory/export` - Xuất kho
- `POST /api/inventory/adjust` - Điều chỉnh

### 16. **NotificationsController** - Thông báo
- `GET /api/notifications` - Danh sách thông báo
- `PUT /api/notifications/{id}/read` - Đánh dấu đã đọc
- `PUT /api/notifications/read-all` - Đánh dấu tất cả đã đọc
- `DELETE /api/notifications/{id}` - Xóa thông báo

### 17. **MapController** - Bản đồ
- `GET /api/map/enterprises` - Doanh nghiệp trên bản đồ
- `GET /api/map/locations` - Các vị trí

### 18. **LocationsController** - Địa điểm
- `GET /api/locations` - Danh sách địa điểm
- `POST /api/locations` - Thêm địa điểm
- `PUT /api/locations/{id}` - Cập nhật địa điểm
- `DELETE /api/locations/{id}` - Xóa địa điểm

### 19. **AddressController** - Địa giới hành chính
- `GET /api/address/provinces` - Danh sách tỉnh/TP
- `GET /api/address/districts/{provinceId}` - Quận/huyện theo tỉnh
- `GET /api/address/wards/{districtId}` - Phường/xã theo quận

### 20. **ReportsController** - Báo cáo
- `GET /api/reports/dashboard` - Dashboard tổng quan
- `GET /api/reports/revenue` - Báo cáo doanh thu
- `GET /api/reports/products` - Báo cáo sản phẩm
- `GET /api/reports/orders` - Báo cáo đơn hàng

### 21. **FileUploadController** - Upload file
- `POST /api/upload/image` - Upload ảnh
- `POST /api/upload/document` - Upload tài liệu
- `DELETE /api/upload/{id}` - Xóa file

### 22. **AdminImagesController** - Quản lý ảnh (Admin)
- `GET /api/admin/images` - Danh sách ảnh
- `PUT /api/admin/images/{id}/approve` - Duyệt ảnh
- `DELETE /api/admin/images/{id}` - Xóa ảnh

### 23. **ProductImagesController** - Ảnh sản phẩm
- `GET /api/product-images/{productId}` - Ảnh của sản phẩm
- `POST /api/product-images` - Thêm ảnh
- `DELETE /api/product-images/{id}` - Xóa ảnh

### 24. **HomeController** - Trang chủ
- `GET /api/home/featured-products` - Sản phẩm nổi bật
- `GET /api/home/news` - Tin tức
- `GET /api/home/statistics` - Thống kê

### 25. **ShippersController** - Shipper
- `GET /api/shippers/orders` - Đơn hàng cần giao
- `PUT /api/shippers/orders/{id}/pickup` - Nhận đơn
- `PUT /api/shippers/orders/{id}/deliver` - Giao thành công
- `PUT /api/shippers/orders/{id}/fail` - Giao thất bại

### 26. **TransactionsController** - Giao dịch
- `GET /api/transactions` - Danh sách giao dịch
- `GET /api/transactions/{id}` - Chi tiết giao dịch

### 27. **TransactionHistoryController** - Lịch sử giao dịch
- `GET /api/transaction-history` - Lịch sử

---

## 📁 CẤU TRÚC FRONTEND

```
src/
├── app/                          # Next.js App Router
│   ├── about/                    # Trang giới thiệu
│   ├── account/                  # Trang tài khoản
│   ├── admin/                    # Trang quản trị
│   │   ├── page.tsx              # Dashboard admin
│   │   └── wallet-requests/      # Quản lý yêu cầu ví
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth endpoints
│   │   ├── enterprises/          # API proxy
│   │   ├── geocode/              # Geocoding
│   │   └── proxy/                # Proxy requests
│   ├── cart/                     # Giỏ hàng
│   ├── checkout/                 # Thanh toán
│   │   └── success/              # Thanh toán thành công
│   ├── dashboard/                # Dashboard user
│   ├── enterprise-admin/         # Dashboard doanh nghiệp
│   ├── enterprises/              # Quản lý doanh nghiệp
│   │   └── orders/               # Đơn hàng DN
│   ├── forgot/                   # Quên mật khẩu
│   ├── home/                     # Trang chủ
│   ├── login/                    # Đăng nhập
│   ├── map/                      # Bản đồ
│   ├── news/                     # Tin tức
│   │   └── [id]/                 # Chi tiết tin
│   ├── ocop-register/            # Đăng ký OCOP
│   ├── orders/                   # Đơn hàng
│   │   └── tracking/             # Theo dõi đơn
│   ├── payment/                  # Thanh toán
│   │   └── [orderId]/            # Thanh toán đơn
│   ├── payments/                 # Lịch sử thanh toán
│   │   └── history/              # Chi tiết lịch sử
│   ├── products/                 # Sản phẩm
│   │   └── [id]/                 # Chi tiết sản phẩm
│   ├── register/                 # Đăng ký
│   ├── shipper/                  # Shipper
│   │   └── orders/               # Đơn hàng shipper
│   ├── transactions/             # Giao dịch
│   │   └── [id]/                 # Chi tiết giao dịch
│   ├── wallet/                   # Ví điện tử
│   ├── globals.css               # CSS toàn cục
│   ├── layout.tsx                # Layout chính
│   ├── page.tsx                  # Trang chủ
│   └── providers.tsx             # Context providers
│
├── components/                   # Components
│   ├── address/                  # Components địa chỉ
│   │   ├── AddressMapModal.tsx   # Modal chọn địa chỉ trên map
│   │   └── NewAddressForm.tsx    # Form thêm địa chỉ
│   ├── admin/                    # Components admin
│   │   ├── AdminHeader.tsx       # Header admin
│   │   ├── AdminOrderManagementTab.tsx
│   │   ├── CategoryManagementTab.tsx
│   │   ├── CreateEnterpriseAdminTab.tsx
│   │   ├── EnterpriseApprovalTab.tsx
│   │   ├── EnterpriseManagementTab.tsx
│   │   ├── HomeManagementTab.tsx
│   │   ├── ImageManagementTab.tsx
│   │   ├── LocationsTab.tsx
│   │   ├── NewsManagementTab.tsx
│   │   ├── OcopApprovalTab.tsx
│   │   ├── ProducersTab.tsx
│   │   ├── ProductManagementTab.tsx
│   │   ├── ProvinceReportTab.tsx
│   │   ├── TransactionsTab.tsx
│   │   ├── UserManagementTab.tsx
│   │   └── WalletManagementTab.tsx
│   ├── cart/                     # Components giỏ hàng
│   │   └── CheckoutModal.tsx     # Modal checkout
│   ├── enterprise/               # Components doanh nghiệp
│   │   ├── DashboardTab.tsx
│   │   ├── EnterpriseHeader.tsx
│   │   ├── EnterpriseProfileTab.tsx
│   │   ├── InventoryTab.tsx
│   │   ├── NotificationsTab.tsx
│   │   ├── OcopStatusTab.tsx
│   │   ├── OrderManagementTab.tsx
│   │   ├── ProductImagesManager.tsx
│   │   ├── ProductManagementTab.tsx
│   │   ├── ReportsTab.tsx
│   │   ├── SettingsTab.tsx
│   │   └── WalletTab.tsx
│   ├── home/                     # Components trang chủ
│   │   ├── FeaturedProducts.tsx
│   │   ├── HeroSlider.tsx
│   │   ├── ImageOptimizer.tsx
│   │   ├── MapSection.tsx
│   │   ├── Minimap.tsx
│   │   ├── NewsSection.tsx
│   │   └── ProductVus.tsx
│   ├── layout/                   # Components layout
│   │   ├── AuthLayout.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── Navbar.tsx
│   ├── map/                      # Components bản đồ
│   │   ├── EnterpriseDetailCard.tsx
│   │   ├── InteractiveMap.tsx
│   │   └── MapCanvas.tsx
│   ├── upload/                   # Components upload
│   │   └── ImageUploader.tsx
│   ├── AuthCard.tsx
│   ├── AuthGuard.tsx
│   ├── AutoLogoutProvider.tsx
│   ├── BackendStatus.tsx
│   ├── FacebookLoginButton.tsx
│   ├── ForgotPasswordForm.tsx
│   ├── GoogleLoginButton.tsx
│   ├── LoginForm.tsx
│   ├── OCOPForm.tsx
│   ├── OTPLoginForm.tsx
│   ├── ProductReviews.tsx
│   ├── ProfileAvatarUpload.tsx
│   ├── RegisterForm.tsx
│   ├── ShippingAddressesManager.tsx
│   ├── SocialLogin.tsx
│   ├── Toast.tsx
│   └── UserDropdown.tsx
│
├── lib/                          # Utilities & Services
│   ├── hooks/                    # Custom hooks
│   │   ├── useAutoLogout.ts
│   │   └── useOrderProducts.ts
│   ├── api.ts                    # API client
│   ├── auth-config.ts            # Auth configuration
│   ├── auth.ts                   # Auth utilities
│   ├── cart-context.tsx          # Cart context
│   ├── cart.ts                   # Cart utilities
│   ├── errorHandler.ts           # Error handling
│   ├── geolocation.ts            # Geolocation utilities
│   ├── imageUtils.ts             # Image utilities
│   ├── mock-data.ts              # Mock data
│   ├── shipping-addresses.ts     # Shipping address utilities
│   ├── status.ts                 # Status utilities
│   ├── types.ts                  # TypeScript types
│   ├── upload.ts                 # Upload utilities
│   └── utils.ts                  # General utilities
│
└── types/                        # Type definitions
    └── react-facebook-login.d.ts
```

---

## 📁 CẤU TRÚC BACKEND

```
GiaLai-OCOP-BE/
├── Controllers/                  # API Controllers
│   ├── AddressController.cs
│   ├── AdminImagesController.cs
│   ├── AuthController.cs
│   ├── BankAccountController.cs
│   ├── CategoriesController.cs
│   ├── EnterpriseApplicationsController.cs
│   ├── EnterpriseBankInfoController.cs
│   ├── EnterprisesController.cs
│   ├── FileUploadController.cs
│   ├── HomeController.cs
│   ├── InventoryController.cs
│   ├── LocationsController.cs
│   ├── MapController.cs
│   ├── NotificationsController.cs
│   ├── OrderItemsController.cs
│   ├── OrdersController.cs
│   ├── PaymentsController.cs
│   ├── ProducersController.cs
│   ├── ProductImagesController.cs
│   ├── ProductsController.cs
│   ├── ProfileController.cs
│   ├── ReportsController.cs
│   ├── ReviewsController.cs
│   ├── ShippersController.cs
│   ├── ShippingAddressesController.cs
│   ├── TransactionHistoryController.cs
│   ├── TransactionsController.cs
│   ├── UsersController.cs
│   ├── WalletController.cs
│   └── WalletRequestController.cs
│
├── Data/                         # Database
│   ├── AppDbContext.cs           # EF Core DbContext
│   ├── MapSeedData.cs            # Seed data
│   └── Migrations/               # EF Migrations
│
├── Dtos/                         # Data Transfer Objects
│
├── Middleware/                   # Middleware
│   └── GlobalExceptionHandlerMiddleware.cs
│
├── Models/                       # Entity Models
│   ├── BankAccount.cs
│   ├── Category.cs
│   ├── District.cs
│   ├── EmailVerification.cs
│   ├── Enterprise.cs
│   ├── EnterpriseApplication.cs
│   ├── EnterpriseBankInfo.cs
│   ├── EnterpriseSettings.cs
│   ├── Image.cs
│   ├── InventoryHistory.cs
│   ├── Location.cs
│   ├── Notification.cs
│   ├── Order.cs
│   ├── OrderEnterpriseStatus.cs
│   ├── OrderItem.cs
│   ├── Payment.cs
│   ├── Producer.cs
│   ├── Product.cs
│   ├── Province.cs
│   ├── Review.cs
│   ├── ShippingAddress.cs
│   ├── Transaction.cs
│   ├── User.cs
│   ├── Wallet.cs
│   ├── WalletRequest.cs
│   ├── WalletTransaction.cs
│   └── Ward.cs
│
├── Options/                      # Configuration Options
│   ├── BankTransferSettings.cs
│   └── CloudinarySettings.cs
│
├── Services/                     # Business Services
│   ├── BankAccountService.cs
│   ├── CloudinaryService.cs
│   ├── EmailService.cs
│   ├── GpsAddressService.cs
│   ├── RatingService.cs
│   ├── SocialAuthService.cs
│   ├── TokenService.cs
│   ├── VietQRPaymentService.cs
│   ├── VietQrService.cs
│   ├── WalletRequestService.cs
│   ├── WalletService.cs
│   └── Interfaces/
│       ├── IBankAccountService.cs
│       ├── ICloudinaryService.cs
│       ├── IGpsAddressService.cs
│       ├── ISocialAuthService.cs
│       ├── ITokenService.cs
│       ├── IVietQRPaymentService.cs
│       ├── IVietQrService.cs
│       ├── IWalletRequestService.cs
│       └── IWalletService.cs
│
├── Tests/                        # Unit & Integration Tests
│
├── uploads/                      # Local file uploads
│   ├── documents/
│   └── images/
│
├── wwwroot/                      # Static files
│
├── Program.cs                    # Application entry point
├── appsettings.json              # Configuration
├── appsettings.Development.json
├── appsettings.Production.json
├── Dockerfile                    # Docker configuration
└── GiaLaiOCOP.Api.csproj         # Project file
```

---

## 🔐 XÁC THỰC & BẢO MẬT

### Authentication Flow
1. **Đăng ký**: Email + Password → Gửi OTP → Xác thực email → Tạo tài khoản
2. **Đăng nhập**: Email + Password → Validate → Generate JWT Token
3. **Social Login**: Google/Facebook OAuth → Validate token → Create/Link account → Generate JWT
4. **Quên mật khẩu**: Email → Gửi OTP → Xác thực OTP → Đặt mật khẩu mới

### JWT Token
- **Algorithm**: HS256
- **Expiration**: Configurable (default 7 days)
- **Claims**: UserId, Email, Role, EnterpriseId (if applicable)
- **Refresh**: Token mới khi đổi mật khẩu (PasswordUpdatedAt)

### Password Security
- **Hashing**: BCrypt.Net-Next
- **Minimum length**: 6 characters

---

## 💳 THANH TOÁN

### Phương thức thanh toán
1. **COD (Cash on Delivery)**: Thanh toán khi nhận hàng
2. **BankTransfer**: Chuyển khoản ngân hàng qua VietQR
3. **Wallet**: Thanh toán bằng ví điện tử trong hệ thống

### VietQR Integration
- Tạo mã QR thanh toán động
- Hỗ trợ các ngân hàng Việt Nam
- Tự động xác nhận thanh toán (manual confirm)

### Wallet System
- Mỗi user có 1 ví điện tử
- Nạp tiền qua VietQR
- Thanh toán đơn hàng từ ví
- Hoàn tiền khi hủy đơn
- Rút tiền về tài khoản ngân hàng

---

## 📦 QUẢN LÝ ĐƠN HÀNG

### Order Status Flow
```
Pending → Processing → Shipped → Completed
                    ↘ PendingCompletion → Completed
                                       ↘ Rejected (back to Shipped)
         ↘ Cancelled
```

### Payment Status Flow
```
Pending → AwaitingTransfer → BankTransferConfirmed → Paid
                          ↘ BankTransferRejected
       → Paid (COD/Wallet)
       → Cancelled
```

---

## 🗺️ BẢN ĐỒ

### Leaflet Integration
- Hiển thị các doanh nghiệp OCOP trên bản đồ
- Marker với thông tin doanh nghiệp
- Popup chi tiết khi click
- Tìm kiếm theo vị trí

### Geocoding
- Chuyển đổi địa chỉ → tọa độ GPS
- Hỗ trợ chọn vị trí trên bản đồ khi thêm địa chỉ

---

## 📧 EMAIL SERVICE

### SendGrid Integration
- Gửi OTP xác thực email
- Gửi thông báo đơn hàng
- Gửi email khôi phục mật khẩu

---

## 🖼️ FILE UPLOAD

### Cloudinary Integration
- Upload ảnh sản phẩm
- Upload ảnh doanh nghiệp
- Upload avatar người dùng
- Tự động resize và optimize

### Local Storage (Fallback)
- Lưu file trong thư mục `uploads/`
- Hỗ trợ images và documents

---

## 🚀 DEPLOYMENT

### Frontend (Vercel/Render)
- Build: `next build`
- Start: `next start`
- Environment variables:
  - `NEXT_PUBLIC_API_BASE`
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
  - `NEXT_PUBLIC_FACEBOOK_APP_ID`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`

### Backend (Render/Docker)
- Build: `dotnet publish -c Release`
- Environment variables:
  - `ConnectionStrings__DefaultConnection`
  - `Jwt__Key`
  - `Jwt__Issuer`
  - `Cloudinary__*`
  - `SendGrid__*`
  - `VietQR__*`

---

## 📊 TÍNH NĂNG CHÍNH

### Cho Khách hàng (Customer)
- ✅ Xem danh sách sản phẩm OCOP
- ✅ Tìm kiếm và lọc sản phẩm
- ✅ Xem chi tiết sản phẩm
- ✅ Thêm vào giỏ hàng
- ✅ Đặt hàng và thanh toán
- ✅ Quản lý địa chỉ giao hàng
- ✅ Theo dõi đơn hàng
- ✅ Đánh giá sản phẩm
- ✅ Quản lý ví điện tử
- ✅ Xem bản đồ doanh nghiệp

### Cho Doanh nghiệp (EnterpriseAdmin)
- ✅ Quản lý thông tin doanh nghiệp
- ✅ Quản lý sản phẩm
- ✅ Quản lý đơn hàng
- ✅ Quản lý kho hàng
- ✅ Xem báo cáo doanh thu
- ✅ Quản lý ví điện tử
- ✅ Nhận thông báo

### Cho Quản trị viên (SystemAdmin)
- ✅ Quản lý người dùng
- ✅ Duyệt doanh nghiệp
- ✅ Duyệt sản phẩm OCOP
- ✅ Quản lý danh mục
- ✅ Quản lý tin tức
- ✅ Quản lý hình ảnh
- ✅ Quản lý ví hệ thống
- ✅ Xem báo cáo tổng hợp
- ✅ Quản lý đơn hàng toàn hệ thống

---

## 📝 GHI CHÚ PHÁT TRIỂN

### Conventions
- **Naming**: PascalCase cho C#, camelCase cho TypeScript
- **API**: RESTful với JSON
- **Date/Time**: UTC everywhere, convert to local on display
- **Currency**: VND, stored as decimal(18,2)

### Best Practices
- Sử dụng DTOs để transfer data
- Validate input ở cả frontend và backend
- Logging với ILogger
- Error handling với GlobalExceptionHandler
- Soft delete cho dữ liệu quan trọng

---

*Tài liệu được tạo tự động - Cập nhật: Tháng 12/2024*

