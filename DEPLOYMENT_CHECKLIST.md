# ✅ Deployment Checklist - GiaLai OCOP Frontend

## 🎯 Pre-Deployment Checklist

### 1. Build & TypeScript Errors
- [x] ✅ Build thành công (`npm run build`)
- [x] ✅ Không có TypeScript errors
- [x] ✅ Không có linter errors
- [x] ✅ Tất cả pages được generate thành công

### 2. Environment Variables (QUAN TRỌNG!)

**Bắt buộc phải set trên hosting platform:**

#### Production Environment Variables:
```bash
# Backend API (BẮT BUỘC)
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api

# NextAuth (BẮT BUỘC nếu dùng Google Login)
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here (generate random string)

# Google OAuth (Tùy chọn - nếu dùng Google Login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth (Tùy chọn - nếu dùng Facebook Login)
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id

# Backend URL cho API routes (Tùy chọn - có fallback)
BACKEND_URL=https://gialai-ocop-be.onrender.com

# Supabase (Tùy chọn - nếu dùng Supabase)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Bank Account Info (Tùy chọn - có default values)
NEXT_PUBLIC_ADMIN_BANK_ACCOUNT=0858153779
NEXT_PUBLIC_ADMIN_BANK_CODE=970422
NEXT_PUBLIC_ADMIN_ACCOUNT_NAME=NGUYEN BA QUYET
NEXT_PUBLIC_ADMIN_QR_URL=your-qr-code-url
```

**⚠️ LƯU Ý:**
- `NEXT_PUBLIC_*` variables được expose ra client-side
- `NEXTAUTH_SECRET` phải là random string (dùng: `openssl rand -base64 32`)
- `NEXTAUTH_URL` phải match với domain production

### 3. Code Quality
- [x] ✅ Không có hardcoded localhost URLs trong production code
- [x] ✅ Tất cả API calls sử dụng environment variables
- [x] ✅ Error handling đầy đủ
- [x] ✅ Fallback values cho optional environment variables

### 4. Dependencies
- [x] ✅ `package.json` có đầy đủ dependencies
- [x] ✅ `package-lock.json` được commit
- [x] ✅ Không có security vulnerabilities (chạy `npm audit`)

### 5. Configuration Files
- [x] ✅ `next.config.ts` đã cấu hình đúng
- [x] ✅ `tsconfig.json` hợp lệ
- [x] ✅ `.gitignore` loại trừ `.env*` files

### 6. Security
- [x] ✅ Không có secrets trong code
- [x] ✅ `.env*` files không được commit
- [x] ✅ API keys sử dụng environment variables

---

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

1. **Push code lên GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy trên Vercel:**
   - Vào https://vercel.com
   - Import repository từ GitHub
   - Set environment variables (xem mục 2 ở trên)
   - Deploy!

3. **Verify:**
   - [ ] Homepage load được
   - [ ] API calls hoạt động
   - [ ] Login/Register hoạt động
   - [ ] Không có console errors

### Option 2: Netlify

1. **Build command:**
   ```bash
   npm run build
   ```

2. **Publish directory:**
   ```
   .next
   ```

3. **Set environment variables** trong Netlify dashboard

4. **Deploy!**

### Option 3: Self-Hosted (VPS/Server)

1. **Build trên server:**
   ```bash
   npm install
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   # hoặc với PM2:
   pm2 start npm --name "ocop-frontend" -- start
   ```

3. **Set environment variables** trong `.env.production` hoặc system environment

4. **Setup reverse proxy** (nginx/Apache) nếu cần

---

## 🔍 Post-Deployment Verification

### Functional Tests
- [ ] ✅ Homepage loads correctly
- [ ] ✅ Products page displays products
- [ ] ✅ Search functionality works
- [ ] ✅ Login/Register works
- [ ] ✅ Cart functionality works
- [ ] ✅ Checkout process works
- [ ] ✅ Admin dashboard accessible (nếu có quyền)
- [ ] ✅ Enterprise admin dashboard works (nếu có quyền)
- [ ] ✅ Map page loads and displays enterprises
- [ ] ✅ Payment pages work

### Performance Tests
- [ ] ✅ Page load time < 3s
- [ ] ✅ Images load correctly
- [ ] ✅ No console errors
- [ ] ✅ No network errors
- [ ] ✅ API responses are fast

### Security Tests
- [ ] ✅ HTTPS enabled
- [ ] ✅ No sensitive data in client-side code
- [ ] ✅ Authentication works correctly
- [ ] ✅ CORS configured properly

### Browser Compatibility
- [ ] ✅ Chrome/Edge
- [ ] ✅ Firefox
- [ ] ✅ Safari
- [ ] ✅ Mobile browsers

---

## 🐛 Common Issues & Solutions

### Issue 1: API calls fail
**Solution:**
- Check `NEXT_PUBLIC_API_BASE` environment variable
- Verify backend is running: https://gialai-ocop-be.onrender.com
- Check CORS settings on backend

### Issue 2: NextAuth errors
**Solution:**
- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set
- Verify Google/Facebook OAuth credentials if used

### Issue 3: Images not loading
**Solution:**
- Check `next.config.ts` remotePatterns configuration
- Verify image URLs are accessible
- Check Cloudinary configuration if used

### Issue 4: Build fails
**Solution:**
- Run `npm install` to ensure dependencies are installed
- Check for TypeScript errors: `npx tsc --noEmit`
- Verify Node.js version (18+)

### Issue 5: Environment variables not working
**Solution:**
- Restart deployment after setting variables
- Verify variable names match exactly (case-sensitive)
- Check if variables are prefixed with `NEXT_PUBLIC_` for client-side

---

## 📋 Environment Variables Reference

### Required (Production)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE` | Backend API URL | `https://gialai-ocop-be.onrender.com/api` |
| `NEXTAUTH_URL` | Your production domain | `https://your-domain.com` |
| `NEXTAUTH_SECRET` | Random secret key | `openssl rand -base64 32` |

### Optional (OAuth)
| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | `xxx` |
| `NEXT_PUBLIC_FACEBOOK_APP_ID` | Facebook App ID | `123456789` |

### Optional (Backend)
| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_URL` | Backend base URL | `https://gialai-ocop-be.onrender.com` |

### Optional (Supabase)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `xxx` |

### Optional (Payment)
| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ADMIN_BANK_ACCOUNT` | Admin bank account | `0858153779` |
| `NEXT_PUBLIC_ADMIN_BANK_CODE` | Bank code | `970422` |
| `NEXT_PUBLIC_ADMIN_ACCOUNT_NAME` | Account name | `NGUYEN BA QUYET` |
| `NEXT_PUBLIC_ADMIN_QR_URL` | QR code URL | (empty) |

---

## ✅ Final Checklist Before Go-Live

- [ ] ✅ All environment variables set
- [ ] ✅ Build successful
- [ ] ✅ All pages accessible
- [ ] ✅ API integration working
- [ ] ✅ Authentication working
- [ ] ✅ No console errors
- [ ] ✅ Mobile responsive
- [ ] ✅ HTTPS enabled
- [ ] ✅ Performance acceptable
- [ ] ✅ Error handling tested
- [ ] ✅ Backup strategy in place

---

## 📞 Support

Nếu gặp vấn đề khi deploy:
1. Check console logs
2. Check network tab trong DevTools
3. Verify environment variables
4. Check backend status: https://gialai-ocop-be.onrender.com
5. Review error messages carefully

**Good luck with deployment! 🚀**

