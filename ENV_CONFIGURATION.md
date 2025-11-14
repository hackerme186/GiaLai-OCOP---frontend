# 🔧 Environment Configuration

## 📝 Environment Variables

Tạo file `.env.local` trong thư mục root của frontend:

```bash
# ===================================
# PRODUCTION BACKEND (Render)
# ===================================
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api

# ===================================
# LOCAL DEVELOPMENT BACKEND
# ===================================
# Uncomment để sử dụng backend local:

# HTTPS (with SSL)
# NEXT_PUBLIC_API_BASE=https://localhost:5001/api

# HTTP (without SSL)
# NEXT_PUBLIC_API_BASE=http://localhost:5000/api

# ===================================
# NEXTAUTH CONFIGURATION
# ===================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-min-32-chars

# Production NextAuth (when deploying)
# NEXTAUTH_URL=https://your-frontend-domain.com

# ===================================
# GOOGLE OAUTH (Optional)
# ===================================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 🌐 Backend URLs

### Production Backend (Render)
```
URL: https://gialai-ocop-be.onrender.com
API: https://gialai-ocop-be.onrender.com/api
Swagger: https://gialai-ocop-be.onrender.com/swagger
```

### Local Backend
```
HTTPS: https://localhost:5001
API: https://localhost:5001/api
Swagger: https://localhost:5001/swagger

HTTP: http://localhost:5000
API: http://localhost:5000/api
Swagger: http://localhost:5000/swagger
```

---

## 🔄 Switch Between Backends

### Use Production Backend (Default)
```bash
# .env.local
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
```

Hoặc không cần file `.env.local` - frontend sẽ tự động dùng production.

### Use Local Backend
```bash
# .env.local
NEXT_PUBLIC_API_BASE=https://localhost:5001/api
```

Sau đó restart frontend:
```bash
npm run dev
```

---

## ✅ Verify Backend Connection

### Production Backend
```bash
# Test với curl
curl https://gialai-ocop-be.onrender.com/api/products

# Hoặc mở trong browser
https://gialai-ocop-be.onrender.com/swagger
```

### Local Backend
```bash
# Chạy backend local
cd E:\SE18\SEP\GiaLai-OCOP-BE
dotnet run

# Test
curl https://localhost:5001/api/products

# Swagger
https://localhost:5001/swagger
```

---

## 🚀 Deployment Scenarios

### Scenario 1: Local Development
```bash
# .env.local
NEXT_PUBLIC_API_BASE=https://localhost:5001/api
NEXTAUTH_URL=http://localhost:3000

# Run local backend
cd E:\SE18\SEP\GiaLai-OCOP-BE
dotnet run

# Run frontend
npm run dev
```

### Scenario 2: Frontend Local + Backend Production
```bash
# .env.local
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
NEXTAUTH_URL=http://localhost:3000

# Run frontend only
npm run dev
```

### Scenario 3: Full Production
```bash
# .env.production
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
NEXTAUTH_URL=https://your-frontend-domain.com

# Build and deploy
npm run build
npm start
```

---

## 🔐 CORS Configuration

Backend cần allow frontend domain trong CORS settings.

### For Local Development
Backend `Program.cs`:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "https://localhost:3000"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});
```

### For Production
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "http://localhost:3000",
            "https://localhost:3000",
            "https://your-frontend-domain.com"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});
```

---

## ⚠️ Important Notes

### Production Backend (Render)
- ✅ Always online
- ✅ HTTPS enabled
- ✅ No SSL certificate issues
- ⚠️ May sleep after 15 min inactivity (free tier)
- ⚠️ First request after sleep takes ~30s

### Local Backend
- ⚠️ Need to run manually
- ⚠️ Self-signed SSL certificate
- ⚠️ Need PostgreSQL running
- ✅ Faster response time
- ✅ Full control

---

## 🎯 Recommended Setup

### For Development
```bash
# Use production backend for convenience
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
```

**Pros:**
- ✅ No need to run backend locally
- ✅ No database setup needed
- ✅ Focus on frontend development

**Cons:**
- ⚠️ Slower response (network latency)
- ⚠️ Can't test backend changes

### For Full-Stack Development
```bash
# Use local backend
NEXT_PUBLIC_API_BASE=https://localhost:5001/api
```

**Pros:**
- ✅ Fast response time
- ✅ Test backend changes immediately
- ✅ Work offline

**Cons:**
- ⚠️ Need to run backend
- ⚠️ Need PostgreSQL
- ⚠️ SSL certificate issues

---

## 🔧 Troubleshooting

### Issue: Frontend can't connect to backend
1. Check backend is running
2. Verify API URL in console logs
3. Check CORS settings
4. Check firewall/antivirus

### Issue: Render backend is slow
- First request after sleep takes time
- Solution: Keep backend warm with scheduled pings
- Or upgrade to paid tier

### Issue: Local SSL certificate error
- Trust the certificate in browser
- Or use HTTP: `http://localhost:5000/api`

---

## 📊 Current Configuration

**Default (No .env.local):**
```
Backend: https://gialai-ocop-be.onrender.com/api
Mode: Production
Status: ✅ Ready to use
```

**With Local Backend:**
```bash
# Create .env.local:
NEXT_PUBLIC_API_BASE=https://localhost:5001/api

# Then restart:
npm run dev
```

---

## 🎉 Summary

✅ **Production backend is live at:** https://gialai-ocop-be.onrender.com  
✅ **Frontend default connects to production**  
✅ **Can switch to local backend anytime**  
✅ **No setup needed for basic development**  

**Just run `npm run dev` and start coding! 🚀**

