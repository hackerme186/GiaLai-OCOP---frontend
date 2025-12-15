# Test Product API để kiểm tra Enterprise Info

## Kiểm tra API Response

Sau khi restart backend, hãy test các API sau để đảm bảo có enterpriseId và enterprise info:

### 1. Test GET /api/products/{id}

```bash
# Thay {id} bằng ID của một sản phẩm trong cart
curl http://localhost:5000/api/products/1
```

**Expected Response:**
```json
{
  "id": 1,
  "name": "Tên sản phẩm",
  "enterpriseId": 5,  // ✅ Phải có
  "enterprise": {      // ✅ Phải có
    "id": 5,
    "name": "Tên doanh nghiệp",
    "imageUrl": "https://..."
  }
}
```

### 2. Test GET /api/products

```bash
curl http://localhost:5000/api/products
```

**Expected:** Mỗi product trong array phải có `enterpriseId` và `enterprise` object.

## Nếu vẫn không có enterpriseId

1. **Kiểm tra Database:**
   - Đảm bảo Products table có EnterpriseId column
   - Đảm bảo Products có giá trị EnterpriseId (không null)

2. **Kiểm tra Backend:**
   - Restart backend sau khi sửa code
   - Kiểm tra console logs khi gọi API
   - Verify MapProductToDto có map Enterprise

3. **Clear Browser Cache:**
   - Clear localStorage: `localStorage.clear()` trong browser console
   - Refresh page và thêm lại sản phẩm vào cart

