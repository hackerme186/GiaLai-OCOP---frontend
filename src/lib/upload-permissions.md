# Phân quyền Upload Ảnh

## Tổng quan

Hệ thống upload ảnh có phân quyền theo role của user để đảm bảo bảo mật và quản lý tài nguyên.

## Các Role và Quyền Upload

### 1. Customer (Khách hàng)
**Quyền upload:**
- ✅ `GiaLaiOCOP/Users` - Upload avatar (ảnh đại diện)
- ✅ `GiaLaiOCOP/Images` - Folder mặc định/chung (cho mọi role)
- ❌ `GiaLaiOCOP/Products` - Không được phép
- ❌ `GiaLaiOCOP/Enterprises` - Không được phép

### 2. EnterpriseAdmin (Quản lý doanh nghiệp)
**Quyền upload:**
- ✅ `GiaLaiOCOP/Products` - Upload ảnh sản phẩm
- ✅ `GiaLaiOCOP/Users` - Upload avatar
- ✅ `GiaLaiOCOP/Enterprises` - Upload logo doanh nghiệp
- ✅ `GiaLaiOCOP/Images` - Folder mặc định/chung

### 3. SystemAdmin (Quản trị viên hệ thống)
**Quyền upload:**
- ✅ **Tất cả folders** - Có quyền upload vào mọi folder

## Cách sử dụng

### Trong Component
```tsx
import ImageUploader from "@/components/upload/ImageUploader"

<ImageUploader
  folder="GiaLaiOCOP/Products"  // Folder sẽ được check permission tự động
  onUploaded={(url) => console.log(url)}
/>
```

### Kiểm tra Permission thủ công
```ts
import { checkUploadPermission } from "@/lib/upload"

const permission = checkUploadPermission("GiaLaiOCOP/Products")
if (!permission.allowed) {
  console.error(permission.error)
}
```

## Validation

Hệ thống tự động:
1. ✅ Kiểm tra role của user
2. ✅ Validate permission trước khi upload
3. ✅ Hiển thị thông báo lỗi nếu không có quyền
4. ✅ Disable button upload nếu không có quyền

## Lưu ý

- Permission được check ở cả frontend (ImageUploader) và trong upload functions
- Backend cũng cần validate permission - đây chỉ là validation ở frontend
- Nếu user không có quyền, sẽ thấy thông báo lỗi rõ ràng thay vì upload thất bại sau đó

