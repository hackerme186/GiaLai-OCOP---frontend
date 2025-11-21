# Hướng Dẫn Kiểm Tra Backend Update Profile

## Vấn đề
Khi cập nhật thông tin profile và nhấn lưu, API trả về thành công nhưng dữ liệu không được lưu vào database. Sau khi logout và login lại, tất cả thông tin đã chỉnh sửa đều biến mất.

## Các Điểm Cần Kiểm Tra

### 1. **Controller - UsersController.cs**

#### Kiểm tra endpoint `/api/users/me` (PUT)

```csharp
[HttpPut("me")]
[Authorize]
public async Task<ActionResult<UserDto>> UpdateCurrentUser(UpdateUserDto dto)
{
    // ✅ KIỂM TRA: Có lấy đúng userId từ token không?
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    // Hoặc
    var userId = User.FindFirst("id")?.Value;
    // Hoặc
    var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
    
    if (userId == null || userId == 0)
    {
        return Unauthorized("Không tìm thấy userId trong token");
    }
    
    // ✅ KIỂM TRA: Có gọi service method không?
    var updatedUser = await _userService.UpdateUserAsync(userId, dto);
    
    // ✅ KIỂM TRA: Có return đúng dữ liệu không?
    return Ok(updatedUser);
}
```

**Các vấn đề thường gặp:**
- ❌ Không lấy được `userId` từ token
- ❌ Sử dụng `userId` sai format (string vs int)
- ❌ Không map `UpdateUserDto` sang `User` entity đúng cách
- ❌ Return dữ liệu cũ thay vì dữ liệu mới từ database

---

### 2. **Service - UserService.cs**

#### Kiểm tra method `UpdateUserAsync`

```csharp
public async Task<UserDto> UpdateUserAsync(int userId, UpdateUserDto dto)
{
    // ✅ KIỂM TRA: Có tìm được user không?
    var user = await _userRepository.GetByIdAsync(userId);
    if (user == null)
    {
        throw new NotFoundException($"User với ID {userId} không tồn tại");
    }
    
    // ✅ KIỂM TRA: Có map dữ liệu từ DTO sang Entity không?
    if (!string.IsNullOrWhiteSpace(dto.Name))
    {
        user.Name = dto.Name;
    }
    
    if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
    {
        user.PhoneNumber = dto.PhoneNumber;
    }
    
    if (!string.IsNullOrWhiteSpace(dto.Gender))
    {
        user.Gender = dto.Gender;
    }
    
    if (dto.DateOfBirth.HasValue)
    {
        user.DateOfBirth = dto.DateOfBirth.Value;
    }
    
    if (!string.IsNullOrWhiteSpace(dto.ShippingAddress))
    {
        user.ShippingAddress = dto.ShippingAddress;
    }
    
    // ✅ KIỂM TRA: Có gọi repository update không?
    await _userRepository.UpdateAsync(user);
    
    // ✅ KIỂM TRA QUAN TRỌNG NHẤT: Có gọi SaveChangesAsync() không?
    await _userRepository.SaveChangesAsync();
    
    // ✅ KIỂM TRA: Có reload user từ database sau khi save không?
    // Nên reload để đảm bảo trả về dữ liệu mới nhất từ DB
    await _dbContext.Entry(user).ReloadAsync();
    // Hoặc
    var updatedUser = await _userRepository.GetByIdAsync(userId);
    
    // ✅ KIỂM TRA: Có map Entity sang DTO để return không?
    return _mapper.Map<UserDto>(updatedUser);
}
```

**Các vấn đề thường gặp:**
- ❌ **QUAN TRỌNG NHẤT**: Quên gọi `SaveChangesAsync()` - dữ liệu không được lưu vào DB
- ❌ Update entity nhưng không mark nó là `Modified`
- ❌ Không reload entity sau khi save, trả về entity cũ trong memory
- ❌ Mapping DTO → Entity sai, bỏ sót trường
- ❌ Kiểm tra điều kiện sai (ví dụ: `if (dto.Name)` thay vì `if (!string.IsNullOrWhiteSpace(dto.Name))`)

---

### 3. **Repository - UserRepository.cs**

#### Kiểm tra method `UpdateAsync` và `SaveChangesAsync`

```csharp
public async Task UpdateAsync(User user)
{
    // ✅ KIỂM TRA: Có mark entity là Modified không?
    _context.Users.Update(user);
    // Hoặc
    _context.Entry(user).State = EntityState.Modified;
}

public async Task SaveChangesAsync()
{
    // ✅ KIỂM TRA: Có thực sự gọi SaveChangesAsync() không?
    await _context.SaveChangesAsync();
}
```

**Các vấn đề thường gặp:**
- ❌ Không mark entity là `Modified`
- ❌ Entity không được track bởi DbContext
- ❌ SaveChangesAsync() không được gọi

---

### 4. **DbContext - ApplicationDbContext.cs**

#### Kiểm tra cấu hình

```csharp
public class ApplicationDbContext : DbContext
{
    public DbSet<User> Users { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // ✅ KIỂM TRA: Entity có được cấu hình đúng không?
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PhoneNumber).HasMaxLength(20);
            entity.Property(e => e.Gender).HasMaxLength(10);
            entity.Property(e => e.DateOfBirth).HasColumnType("datetime");
            entity.Property(e => e.ShippingAddress).HasMaxLength(500);
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
        });
    }
}
```

**Các vấn đề thường gặp:**
- ❌ Property không được map đúng tên column trong DB
- ❌ Constraint validation fail (ví dụ: Name required nhưng gửi null)
- ❌ Database migration chưa chạy (thiếu column trong DB)

---

### 5. **UpdateUserDto - Mapping**

#### Kiểm tra DTO có đầy đủ trường không

```csharp
public class UpdateUserDto
{
    public string? Name { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? ShippingAddress { get; set; }
    public string? AvatarUrl { get; set; }
}
```

**Các vấn đề thường gặp:**
- ❌ DTO thiếu trường mà frontend đang gửi
- ❌ Data type không khớp (string vs DateTime)

---

### 6. **JWT Token - Claims**

#### Kiểm tra token có chứa đúng claims không

```csharp
// Khi tạo token (Login/Register)
var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), // ✅ Có claim này không?
    new Claim(ClaimTypes.Name, user.Name),
    new Claim(ClaimTypes.Email, user.Email),
    new Claim("role", user.Role)
};

// Khi verify token trong Controller
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value; // ✅ Lấy được không?
```

**Các vấn đề thường gặp:**
- ❌ Token không chứa `NameIdentifier` claim
- ❌ Claim name không khớp (ví dụ: dùng "id" thay vì `ClaimTypes.NameIdentifier`)
- ❌ Token expire nhưng không refresh

---

## Checklist Debugging

### Bước 1: Kiểm tra Request từ Frontend
- [ ] Mở Developer Tools (F12) → Network tab
- [ ] Cập nhật profile và nhấn "Lưu"
- [ ] Tìm request `PUT /api/users/me`
- [ ] Kiểm tra **Request Payload** có đúng dữ liệu không
- [ ] Kiểm tra **Request Headers** có Authorization token không

### Bước 2: Kiểm tra Response từ Backend
- [ ] Kiểm tra **Status Code** (phải là 200 OK)
- [ ] Kiểm tra **Response Body** có chứa dữ liệu mới không
- [ ] So sánh Response với Request Payload xem có giống không

### Bước 3: Kiểm tra Backend Logs
- [ ] Xem Console logs của backend
- [ ] Kiểm tra có exception nào không
- [ ] Kiểm tra SQL query có được thực thi không

### Bước 4: Kiểm tra Database
- [ ] Query trực tiếp database: `SELECT * FROM Users WHERE Id = {userId}`
- [ ] So sánh dữ liệu trong DB với Request Payload
- [ ] Kiểm tra có transaction nào rollback không

---

## Code Mẫu Backend Hoàn Chỉnh

### Controller

```csharp
[HttpPut("me")]
[Authorize]
public async Task<ActionResult<UserDto>> UpdateCurrentUser(UpdateUserDto dto)
{
    try
    {
        // Lấy userId từ token
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized("Invalid token: User ID not found");
        }

        // Log để debug
        _logger.LogInformation($"Updating user {userId} with data: {JsonSerializer.Serialize(dto)}");

        // Gọi service
        var updatedUser = await _userService.UpdateUserAsync(userId, dto);

        // Log response
        _logger.LogInformation($"Updated user {userId}: {JsonSerializer.Serialize(updatedUser)}");

        return Ok(updatedUser);
    }
    catch (NotFoundException ex)
    {
        return NotFound(ex.Message);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, $"Error updating user profile");
        return StatusCode(500, "Internal server error");
    }
}
```

### Service

```csharp
public async Task<UserDto> UpdateUserAsync(int userId, UpdateUserDto dto)
{
    // Tìm user
    var user = await _userRepository.GetByIdAsync(userId);
    if (user == null)
    {
        throw new NotFoundException($"User with ID {userId} not found");
    }

    // Map dữ liệu (chỉ update các trường có giá trị)
    if (!string.IsNullOrWhiteSpace(dto.Name))
    {
        user.Name = dto.Name.Trim();
    }

    if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
    {
        user.PhoneNumber = dto.PhoneNumber.Trim();
    }

    if (!string.IsNullOrWhiteSpace(dto.Gender))
    {
        user.Gender = dto.Gender.Trim();
    }

    if (dto.DateOfBirth.HasValue)
    {
        user.DateOfBirth = dto.DateOfBirth.Value;
    }

    if (!string.IsNullOrWhiteSpace(dto.ShippingAddress))
    {
        user.ShippingAddress = dto.ShippingAddress.Trim();
    }

    if (!string.IsNullOrWhiteSpace(dto.AvatarUrl))
    {
        user.AvatarUrl = dto.AvatarUrl;
    }

    // Update và save
    _userRepository.Update(user);
    await _userRepository.SaveChangesAsync(); // ✅ QUAN TRỌNG: Phải có dòng này!

    // Reload từ database để đảm bảo dữ liệu mới nhất
    await _dbContext.Entry(user).ReloadAsync();

    // Map sang DTO để return
    return _mapper.Map<UserDto>(user);
}
```

### Repository

```csharp
public void Update(User user)
{
    _context.Entry(user).State = EntityState.Modified;
}

public async Task<int> SaveChangesAsync()
{
    return await _context.SaveChangesAsync(); // ✅ Phải return số lượng records affected
}
```

---

## Các Lỗi Thường Gặp Và Cách Fix

### ❌ Lỗi 1: Quên SaveChangesAsync()
**Triệu chứng:** API trả về 200 OK nhưng dữ liệu không lưu vào DB

**Nguyên nhân:**
```csharp
// ❌ SAI: Chỉ update entity trong memory
user.Name = dto.Name;
// Không có SaveChangesAsync() → Dữ liệu không lưu vào DB
```

**Cách fix:**
```csharp
// ✅ ĐÚNG: Phải gọi SaveChangesAsync()
user.Name = dto.Name;
_context.SaveChangesAsync(); // ← Phải có dòng này
```

---

### ❌ Lỗi 2: Entity không được track bởi DbContext
**Triệu chứng:** SaveChangesAsync() không có effect

**Nguyên nhân:**
```csharp
// ❌ SAI: Entity được tạo từ nơi khác, không được track
var user = new User { Id = userId, Name = dto.Name };
_context.Users.Update(user); // Có thể không hoạt động nếu user.Id đã tồn tại
```

**Cách fix:**
```csharp
// ✅ ĐÚNG: Load entity từ DB trước, rồi mới update
var user = await _context.Users.FindAsync(userId);
user.Name = dto.Name;
await _context.SaveChangesAsync();
```

---

### ❌ Lỗi 3: Return entity cũ từ memory
**Triệu chứng:** Response chứa dữ liệu cũ

**Nguyên nhân:**
```csharp
// ❌ SAI: Return entity từ memory trước khi reload
user.Name = dto.Name;
await _context.SaveChangesAsync();
return user; // ← Entity trong memory có thể không sync với DB
```

**Cách fix:**
```csharp
// ✅ ĐÚNG: Reload từ DB sau khi save
user.Name = dto.Name;
await _context.SaveChangesAsync();
await _context.Entry(user).ReloadAsync(); // ← Reload từ DB
return user;
```

---

### ❌ Lỗi 4: Không lấy được userId từ token
**Triệu chứng:** Unauthorized hoặc update sai user

**Nguyên nhân:**
```csharp
// ❌ SAI: Claim name không đúng
var userId = User.FindFirst("userId")?.Value; // ← "userId" không tồn tại
```

**Cách fix:**
```csharp
// ✅ ĐÚNG: Dùng ClaimTypes.NameIdentifier
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
// Hoặc check tất cả claims để debug
foreach (var claim in User.Claims)
{
    _logger.LogInformation($"Claim: {claim.Type} = {claim.Value}");
}
```

---

## Testing

### Test với Postman/Thunder Client

```
PUT https://gialai-ocop-be.onrender.com/api/users/me
Headers:
  Authorization: Bearer {your_token}
  Content-Type: application/json

Body:
{
  "name": "Test User Updated",
  "phoneNumber": "0123456789",
  "gender": "male",
  "dateOfBirth": "1990-01-01T00:00:00Z",
  "shippingAddress": "123 Test Street"
}

Expected Response (200 OK):
{
  "id": 1,
  "name": "Test User Updated",
  "phoneNumber": "0123456789",
  "gender": "male",
  "dateOfBirth": "1990-01-01T00:00:00Z",
  "shippingAddress": "123 Test Street",
  ...
}
```

### Sau khi test:
1. ✅ Kiểm tra response có chứa dữ liệu mới không
2. ✅ Logout và Login lại
3. ✅ Gọi `GET /api/users/me` xem dữ liệu có còn không
4. ✅ Query database trực tiếp xem dữ liệu có được lưu không

---

## Kết Luận

**Nguyên nhân phổ biến nhất:**
1. ❌ **Quên gọi `SaveChangesAsync()`** - 90% các trường hợp
2. ❌ **Entity không được track** - 5%
3. ❌ **Return entity cũ từ memory** - 3%
4. ❌ **Lỗi mapping hoặc validation** - 2%

**Hãy đảm bảo:**
- ✅ Luôn gọi `SaveChangesAsync()` sau khi update entity
- ✅ Reload entity từ DB sau khi save để trả về dữ liệu mới nhất
- ✅ Log đầy đủ request/response để debug
- ✅ Kiểm tra userId trong token có đúng không

---

## Vấn Đề Đặc Biệt: Backend Không Trả Về Các Trường Trong Response

### ❌ Vấn Đề Hiện Tại

Từ logs của frontend, backend **KHÔNG TRẢ VỀ** các trường `gender` và `dateOfBirth` trong response:

**Request gửi đi:**
```json
{
  "name": "quyết đẹp trai",
  "gender": "female",
  "dateOfBirth": "2010-10-20T17:00:00.000Z"
}
```

**Response nhận về:**
```json
{
  "id": 35,
  "name": "quyết đẹp trai",
  "email": "nguyenbaquyet9a4cpr@gmail.com",
  "role": "Customer",
  "enterpriseId": null,
  "enterprise": null,
  "isEmailVerified": true
  // ❌ THIẾU: gender, dateOfBirth
}
```

### ✅ Cách Fix

#### 1. **Kiểm tra UserDto có đầy đủ trường không**

```csharp
// ❌ SAI: UserDto thiếu các trường
public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }
    // ❌ THIẾU: PhoneNumber, Gender, DateOfBirth
}

// ✅ ĐÚNG: UserDto có đầy đủ các trường
public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Role { get; set; }
    public string? PhoneNumber { get; set; }        // ✅ THÊM
    public string? Gender { get; set; }             // ✅ THÊM
    public DateTime? DateOfBirth { get; set; }      // ✅ THÊM
    public string? ShippingAddress { get; set; }    // ✅ THÊM
    public string? AvatarUrl { get; set; }          // ✅ THÊM
    public DateTime? CreatedAt { get; set; }        // ✅ THÊM
}
```

#### 2. **Kiểm tra AutoMapper Profile**

```csharp
// ❌ SAI: AutoMapper không map các trường
CreateMap<User, UserDto>()
    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
    .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
    .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
    // ❌ THIẾU: PhoneNumber, Gender, DateOfBirth

// ✅ ĐÚNG: AutoMapper map đầy đủ các trường
CreateMap<User, UserDto>()
    .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
    .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
    .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.Email))
    .ForMember(dest => dest.PhoneNumber, opt => opt.MapFrom(src => src.PhoneNumber))      // ✅ THÊM
    .ForMember(dest => dest.Gender, opt => opt.MapFrom(src => src.Gender))                // ✅ THÊM
    .ForMember(dest => dest.DateOfBirth, opt => opt.MapFrom(src => src.DateOfBirth))      // ✅ THÊM
    .ForMember(dest => dest.ShippingAddress, opt => opt.MapFrom(src => src.ShippingAddress)) // ✅ THÊM
    .ForMember(dest => dest.AvatarUrl, opt => opt.MapFrom(src => src.AvatarUrl))          // ✅ THÊM
    .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt));         // ✅ THÊM
```

#### 3. **Kiểm tra UpdateUserDto có đầy đủ trường không**

```csharp
// ✅ ĐÚNG: UpdateUserDto có đầy đủ các trường
public class UpdateUserDto
{
    public string? Name { get; set; }
    public string? PhoneNumber { get; set; }        // ✅
    public string? Gender { get; set; }             // ✅
    public DateTime? DateOfBirth { get; set; }      // ✅
    public string? ShippingAddress { get; set; }    // ✅
    public string? AvatarUrl { get; set; }          // ✅
}
```

#### 4. **Kiểm tra Service có map đầy đủ không**

```csharp
public async Task<UserDto> UpdateUserAsync(int userId, UpdateUserDto dto)
{
    var user = await _userRepository.GetByIdAsync(userId);
    
    // ✅ Map đầy đủ các trường
    if (!string.IsNullOrWhiteSpace(dto.Name))
        user.Name = dto.Name;
    
    if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
        user.PhoneNumber = dto.PhoneNumber;      // ✅
    
    if (!string.IsNullOrWhiteSpace(dto.Gender))
        user.Gender = dto.Gender;                // ✅
    
    if (dto.DateOfBirth.HasValue)
        user.DateOfBirth = dto.DateOfBirth.Value; // ✅
    
    if (!string.IsNullOrWhiteSpace(dto.ShippingAddress))
        user.ShippingAddress = dto.ShippingAddress; // ✅
    
    if (!string.IsNullOrWhiteSpace(dto.AvatarUrl))
        user.AvatarUrl = dto.AvatarUrl;          // ✅
    
    _userRepository.Update(user);
    await _userRepository.SaveChangesAsync();
    
    // ✅ Reload từ DB và map sang DTO đầy đủ
    await _context.Entry(user).ReloadAsync();
    return _mapper.Map<UserDto>(user);  // ← AutoMapper phải map đầy đủ!
}
```

#### 5. **Kiểm tra Database Schema**

Đảm bảo các column tồn tại trong database:

```sql
-- Kiểm tra schema
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Users'
AND COLUMN_NAME IN ('PhoneNumber', 'Gender', 'DateOfBirth', 'ShippingAddress', 'AvatarUrl');

-- Nếu thiếu, thêm migration
ALTER TABLE Users ADD PhoneNumber NVARCHAR(20) NULL;
ALTER TABLE Users ADD Gender NVARCHAR(10) NULL;
ALTER TABLE Users ADD DateOfBirth DATETIME2 NULL;
ALTER TABLE Users ADD ShippingAddress NVARCHAR(500) NULL;
ALTER TABLE Users ADD AvatarUrl NVARCHAR(500) NULL;
```

---

## Frontend Đã Xử Lý Tạm Thời

Frontend đã được cập nhật để:
- ✅ **Preserve giá trị đã gửi** nếu backend không trả về
- ✅ **Hiển thị warning rõ ràng** trong console khi backend không trả về các trường
- ✅ **Giữ nguyên giá trị trong form** để không bị mất dữ liệu

Tuy nhiên, **vấn đề thực sự là ở backend** - cần fix backend để trả về đầy đủ dữ liệu trong response.
