# 🔧 Backend Requirements - Bỏ qua OTP trong Đăng ký và Đăng nhập

## 📋 Yêu cầu Frontend hiện tại:

Frontend đã được cập nhật để gửi request **KHÔNG CÓ OTP**. Backend cần được cập nhật để hỗ trợ:

---

## 1. Đăng ký (POST /api/auth/register)

### Request từ Frontend:
```json
{
  "name": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "Password123!"
}
```

**KHÔNG GỬI:**
- ❌ `skipOtp`
- ❌ `isEmailVerified`
- ❌ `otp`
- ❌ Bất kỳ tham số OTP nào

### Response mong đợi từ Backend:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2024-01-01T00:00:00Z"
}
```

**YÊU CẦU:**
- ✅ Tự động tạo user trong database
- ✅ Tự động tạo JWT token
- ✅ Trả về token NGAY LẬP TỨC (không cần OTP)
- ✅ KHÔNG yêu cầu verify email trước khi đăng ký

---

## 2. Đăng nhập (POST /api/auth/login)

### Request từ Frontend:
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Response mong đợi từ Backend:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2024-01-01T00:00:00Z"
}
```

**YÊU CẦU:**
- ✅ Kiểm tra email và password
- ✅ Tự động tạo JWT token
- ✅ Trả về token NGAY LẬP TỨC
- ✅ **KHÔNG kiểm tra `IsEmailVerified`** (cho phép login dù chưa verify email)
- ✅ KHÔNG yêu cầu OTP

---

## 🔍 Các thay đổi cần thực hiện ở Backend:

### Controller: `AuthController.cs` (hoặc tương đương)

#### 1. Register Endpoint:
```csharp
[HttpPost("register")]
public async Task<IActionResult> Register([FromBody] RegisterDto dto)
{
    // ✅ BỎ QUA: Không gửi OTP
    // ✅ BỎ QUA: Không kiểm tra IsEmailVerified
    
    // Tạo user mới
    var user = new User
    {
        Name = dto.Name,
        Email = dto.Email,
        Password = BCrypt.HashPassword(dto.Password),
        Role = "Customer",
        IsEmailVerified = false, // Có thể set false, không cần verify ngay
        CreatedAt = DateTime.UtcNow
    };
    
    // Lưu vào database
    _context.Users.Add(user);
    await _context.SaveChangesAsync();
    
    // Tạo JWT token ngay lập tức
    var token = GenerateJwtToken(user);
    
    // Trả về token
    return Ok(new { 
        token = token,
        expires = DateTime.UtcNow.AddDays(7) // hoặc theo config
    });
}
```

#### 2. Login Endpoint:
```csharp
[HttpPost("login")]
public async Task<IActionResult> Login([FromBody] LoginDto dto)
{
    var user = await _context.Users
        .FirstOrDefaultAsync(u => u.Email == dto.Email);
    
    if (user == null || !BCrypt.Verify(dto.Password, user.Password))
    {
        return Unauthorized(new { message = "Email hoặc mật khẩu không đúng" });
    }
    
    // ✅ BỎ QUA: Không kiểm tra IsEmailVerified
    // if (!user.IsEmailVerified) {
    //     return BadRequest(new { message = "Email chưa được xác thực" });
    // }
    
    // Tạo JWT token ngay lập tức
    var token = GenerateJwtToken(user);
    
    return Ok(new { 
        token = token,
        expires = DateTime.UtcNow.AddDays(7)
    });
}
```

---

## 📝 DTO Classes:

### RegisterDto.cs
```csharp
public class RegisterDto
{
    [Required]
    public string Name { get; set; }
    
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    [MinLength(8)]
    public string Password { get; set; }
    
    // ❌ KHÔNG CẦN các field sau:
    // - skipOtp
    // - isEmailVerified
    // - otp
}
```

### LoginDto.cs
```csharp
public class LoginDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
    
    [Required]
    public string Password { get; set; }
}
```

---

## ✅ Checklist trước khi Deploy:

- [ ] Register endpoint chỉ nhận `name`, `email`, `password`
- [ ] Register endpoint trả về JWT token ngay (không yêu cầu OTP)
- [ ] Login endpoint không kiểm tra `IsEmailVerified`
- [ ] Login endpoint trả về JWT token ngay (không yêu cầu OTP)
- [ ] Test với Postman/curl để đảm bảo response đúng format
- [ ] Deploy backend lên Render (hoặc server của bạn)

---

## 🧪 Test với cURL:

### Test Register:
```bash
curl -X POST https://gialai-ocop-be.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2024-01-01T00:00:00Z"
}
```

### Test Login:
```bash
curl -X POST https://gialai-ocop-be.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2024-01-01T00:00:00Z"
}
```

---

## 📌 Lưu ý:

1. **OTP sẽ được làm sau**: Frontend và backend đều không cần xử lý OTP ngay bây giờ. Chức năng verify email/OTP có thể được thêm vào sau.

2. **IsEmailVerified**: Có thể set `false` khi đăng ký, nhưng **không block** login nếu chưa verify.

3. **Security**: Vẫn cần đảm bảo:
   - Hash password bằng BCrypt (hoặc tương đương)
   - Validate input (email format, password strength)
   - Rate limiting để tránh spam

4. **JWT Token**: Cần đảm bảo token có:
   - User ID
   - Email
   - Role
   - Expiry time

---

## 🚀 Sau khi cập nhật Backend:

1. Test local với Postman/curl
2. Commit và push code
3. Deploy lên Render (hoặc server của bạn)
4. Test lại với Frontend
5. Xác nhận đăng ký/đăng nhập hoạt động không cần OTP

---

**Ngày tạo:** $(date)
**Frontend đã sẵn sàng:** ✅
**Backend cần cập nhật:** ⏳

