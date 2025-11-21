# Hướng Dẫn Implement Backend Change Password API

## Vấn Đề Hiện Tại

Frontend đang gọi endpoint `/api/auth/change-password` nhưng backend trả về **404 Not Found**, nghĩa là endpoint này chưa được implement.

## Yêu Cầu Backend

### Endpoint: `POST /api/auth/change-password`

**Authentication:** Required (Bearer Token)

**Request Body:**
```json
{
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Response (200 OK):**
```json
{
  "message": "Đổi mật khẩu thành công"
}
```

**Response (400 Bad Request):**
```json
{
  "message": "Mật khẩu hiện tại không đúng"
}
```

**Response (401 Unauthorized):**
```json
{
  "message": "Phiên đăng nhập đã hết hạn hoặc không hợp lệ"
}
```

---

## Implementation Guide (C# ASP.NET Core)

### 1. **Create DTO**

```csharp
// DTOs/ChangePasswordDto.cs
public class ChangePasswordDto
{
    [Required(ErrorMessage = "Mật khẩu hiện tại là bắt buộc")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mật khẩu mới là bắt buộc")]
    [MinLength(6, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự")]
    public string NewPassword { get; set; } = string.Empty;
}
```

### 2. **Create Controller**

```csharp
// Controllers/AuthController.cs
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        try
        {
            // Lấy userId từ token
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "Invalid token: User ID not found" });
            }

            // Gọi service để đổi mật khẩu
            await _authService.ChangePasswordAsync(userId, dto.CurrentPassword, dto.NewPassword);

            return Ok(new { message = "Đổi mật khẩu thành công" });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error changing password for user");
            return StatusCode(500, new { message = "Internal server error" });
        }
    }
}
```

### 3. **Create Service Interface**

```csharp
// Services/IAuthService.cs
public interface IAuthService
{
    Task ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    // ... other methods
}
```

### 4. **Implement Service**

```csharp
// Services/AuthService.cs
public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task ChangePasswordAsync(int userId, string currentPassword, string newPassword)
    {
        // 1. Tìm user
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {userId} not found");
        }

        // 2. Verify current password
        var isCurrentPasswordValid = _passwordHasher.VerifyPassword(user.PasswordHash, currentPassword);
        if (!isCurrentPasswordValid)
        {
            throw new UnauthorizedAccessException("Mật khẩu hiện tại không đúng");
        }

        // 3. Validate new password
        if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
        {
            throw new ArgumentException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        // 4. Check if new password is different
        if (_passwordHasher.VerifyPassword(user.PasswordHash, newPassword))
        {
            throw new ArgumentException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        // 5. Hash new password
        var newPasswordHash = _passwordHasher.HashPassword(newPassword);

        // 6. Update password
        user.PasswordHash = newPasswordHash;
        user.UpdatedAt = DateTime.UtcNow;

        // 7. Save changes
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        _logger.LogInformation($"Password changed successfully for user {userId}");
    }
}
```

### 5. **Register Service (Startup.cs / Program.cs)**

```csharp
// Register service
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IPasswordHasher, BCryptPasswordHasher>(); // Or your password hasher
```

### 6. **Password Hasher Interface**

```csharp
// Services/IPasswordHasher.cs
public interface IPasswordHasher
{
    string HashPassword(string password);
    bool VerifyPassword(string hashedPassword, string providedPassword);
}
```

### 7. **Password Hasher Implementation (BCrypt)**

```csharp
// Services/BCryptPasswordHasher.cs
public class BCryptPasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public bool VerifyPassword(string hashedPassword, string providedPassword)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword);
        }
        catch
        {
            return false;
        }
    }
}
```

---

## Alternative: Update Password via User Profile Endpoint

Nếu không muốn tạo endpoint riêng, có thể mở rộng endpoint `PUT /api/users/me`:

### Update `UpdateUserDto`

```csharp
public class UpdateUserDto
{
    public string? Name { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? ShippingAddress { get; set; }
    
    // Thêm các trường để đổi mật khẩu
    public string? CurrentPassword { get; set; }
    public string? NewPassword { get; set; }
}
```

### Update Service

```csharp
public async Task<UserDto> UpdateUserAsync(int userId, UpdateUserDto dto)
{
    var user = await _userRepository.GetByIdAsync(userId);
    
    // ... existing update logic ...
    
    // Nếu có CurrentPassword và NewPassword, đổi mật khẩu
    if (!string.IsNullOrWhiteSpace(dto.CurrentPassword) && 
        !string.IsNullOrWhiteSpace(dto.NewPassword))
    {
        // Verify current password
        if (!_passwordHasher.VerifyPassword(user.PasswordHash, dto.CurrentPassword))
        {
            throw new UnauthorizedAccessException("Mật khẩu hiện tại không đúng");
        }
        
        // Hash and update new password
        user.PasswordHash = _passwordHasher.HashPassword(dto.NewPassword);
    }
    
    // ... save changes ...
}
```

---

## Testing

### Test với Postman/Thunder Client

```
POST https://gialai-ocop-be.onrender.com/api/auth/change-password
Headers:
  Authorization: Bearer {your_token}
  Content-Type: application/json

Body:
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}

Expected Response (200 OK):
{
  "message": "Đổi mật khẩu thành công"
}
```

### Test với Frontend

1. Đăng nhập vào frontend
2. Vào trang Account → Đổi Mật Khẩu
3. Nhập mật khẩu hiện tại và mật khẩu mới
4. Nhấn "Đổi Mật Khẩu"
5. Kiểm tra kết quả

---

## Security Best Practices

1. ✅ **Luôn hash password** - Không bao giờ lưu plain text password
2. ✅ **Verify current password** - Phải xác minh mật khẩu hiện tại trước khi đổi
3. ✅ **Password strength** - Yêu cầu mật khẩu mới có độ dài tối thiểu (6-8 ký tự)
4. ✅ **Rate limiting** - Giới hạn số lần thử đổi mật khẩu để tránh brute force
5. ✅ **Logging** - Log các thay đổi mật khẩu để audit
6. ✅ **Token validation** - Đảm bảo user được authenticate trước khi đổi mật khẩu

---

## Notes

- Endpoint `/auth/change-password` là convention phổ biến, nhưng có thể dùng endpoint khác tùy backend design
- Nếu backend đã có endpoint khác để đổi mật khẩu, chỉ cần update frontend API call
- Đảm bảo password hashing algorithm nhất quán với logic đăng nhập (cùng library và settings)
