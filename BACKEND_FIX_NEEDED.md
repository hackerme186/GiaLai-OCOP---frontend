# 🔧 Backend Fix Needed: Product API Missing enterpriseId

## 📋 Vấn đề

Khi frontend gọi API `/products/{id}` hoặc `/products`, response không có hoặc thiếu `enterpriseId` trong ProductDto, dẫn đến:
- Trang giỏ hàng hiển thị "Doanh nghiệp không xác định"
- Không thể nhóm sản phẩm theo doanh nghiệp
- Không thể hiển thị logo/tên doanh nghiệp

## 🔍 Nguyên nhân

Backend ProductDto hoặc Product entity không include `EnterpriseId` field khi serialize response.

## ✅ Giải pháp Backend cần làm

### 1. Kiểm tra ProductDto.cs

Đảm bảo ProductDto có field `EnterpriseId`:

```csharp
public class ProductDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }
    public int? EnterpriseId { get; set; } // ✅ Cần có field này
    public string? ImageUrl { get; set; }
    // ... các field khác
}
```

### 2. Kiểm tra ProductController.cs

Đảm bảo khi map Product -> ProductDto, có include EnterpriseId:

```csharp
[HttpGet("{id}")]
public async Task<ActionResult<ProductDto>> GetProduct(int id)
{
    var product = await _context.Products
        .Include(p => p.Enterprise) // ✅ Include Enterprise nếu cần
        .FirstOrDefaultAsync(p => p.Id == id);
    
    if (product == null) return NotFound();
    
    var productDto = new ProductDto
    {
        Id = product.Id,
        Name = product.Name,
        Description = product.Description,
        Price = product.Price,
        EnterpriseId = product.EnterpriseId, // ✅ Map EnterpriseId
        ImageUrl = product.ImageUrl,
        // ... map các field khác
    };
    
    return Ok(productDto);
}
```

### 3. Kiểm tra AutoMapper (nếu có)

Nếu dùng AutoMapper, đảm bảo mapping profile có map EnterpriseId:

```csharp
CreateMap<Product, ProductDto>()
    .ForMember(dest => dest.EnterpriseId, opt => opt.MapFrom(src => src.EnterpriseId))
    // ... các mapping khác
```

## 🎯 Frontend đã làm gì

Frontend đã được cập nhật để:
1. ✅ Fetch lại product nếu thiếu enterpriseId khi load cart
2. ✅ Fetch enterprise info từ API để hiển thị tên và logo
3. ✅ Fallback về "Doanh nghiệp không xác định" nếu không có thông tin

Tuy nhiên, giải pháp tốt nhất là backend luôn trả về `enterpriseId` trong ProductDto để tránh phải fetch lại nhiều lần.

## 📝 Checklist Backend

- [ ] ProductDto có field `EnterpriseId`
- [ ] ProductController map `EnterpriseId` vào ProductDto
- [ ] Test API `/products/{id}` trả về có `enterpriseId`
- [ ] Test API `/products` trả về có `enterpriseId` trong mỗi product
- [ ] Verify response JSON có field `enterpriseId` (không phải `enterpriseId` null)

## 🔗 Related Files

- Frontend: `src/app/cart/page.tsx` - Cart page với enterprise grouping
- Frontend: `src/lib/api.ts` - Product interface và API calls
- Backend: `ProductDto.cs` - Cần kiểm tra và sửa
- Backend: `ProductController.cs` - Cần kiểm tra mapping

