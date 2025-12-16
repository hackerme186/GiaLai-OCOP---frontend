# 🚀 Hướng Dẫn Deploy Lên Render

## ⚠️ Vấn Đề Đã Fix

Lỗi `Cannot find module '../lightningcss.linux-x64-gnu.node'` đã được fix bằng cách:
1. Thêm `lightningcss-linux-x64-gnu` vào `devDependencies`
2. Tạo file `.npmrc` để đảm bảo optional dependencies được install
3. Thêm `postinstall` script để rebuild native modules

---

## 📋 Cấu Hình Render

### 1. Environment Variables

**BẮT BUỘC phải set trên Render Dashboard:**

```bash
NODE_ENV=production
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
NEXTAUTH_URL=https://your-app-name.onrender.com
NEXTAUTH_SECRET=<generate-random-string>
```

**Tùy chọn:**
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
BACKEND_URL=https://gialai-ocop-be.onrender.com
```

### 2. Build Settings

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Node Version:**
- Chọn Node.js 20.x (hoặc 18.x)

### 3. Auto-Deploy

- ✅ Enable "Auto-Deploy" nếu muốn tự động deploy khi push code
- ✅ Branch: `main` hoặc `master`

---

## 🔧 Các Bước Deploy

### Bước 1: Push Code Lên GitHub
```bash
git add .
git commit -m "Fix lightningcss native bindings for Render"
git push origin main
```

### Bước 2: Tạo Web Service Trên Render

1. Vào https://render.com
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Chọn repository của bạn

### Bước 3: Cấu Hình

**Name:** `gialai-ocop-frontend` (hoặc tên bạn muốn)

**Environment:** `Node`

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm start
```

**Node Version:** `20` (hoặc `18`)

### Bước 4: Set Environment Variables

Trong phần "Environment Variables", thêm:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_BASE` | `https://gialai-ocop-be.onrender.com/api` |
| `NEXTAUTH_URL` | `https://your-app-name.onrender.com` |
| `NEXTAUTH_SECRET` | Generate với: `openssl rand -base64 32` |

### Bước 5: Deploy!

Click "Create Web Service" và đợi build hoàn tất.

---

## ✅ Verify Deployment

Sau khi deploy thành công:

1. **Check homepage:** https://your-app-name.onrender.com
2. **Check products page:** https://your-app-name.onrender.com/products
3. **Check console:** Không có errors
4. **Test API calls:** Verify backend connection

---

## 🐛 Troubleshooting

### Lỗi: "Cannot find module '../lightningcss.linux-x64-gnu.node'"

**Đã fix!** Nếu vẫn gặp lỗi:

1. **Clear build cache trên Render:**
   - Vào Settings → Clear Build Cache
   - Redeploy

2. **Verify dependencies:**
   - Check `package.json` có `lightningcss-linux-x64-gnu` trong `devDependencies`
   - Check `.npmrc` file có trong repo

3. **Manual rebuild:**
   - Thử thêm vào build command: `npm install && npm rebuild lightningcss && npm run build`

### Lỗi: "Build timeout"

**Giải pháp:**
- Render free tier có timeout 15 phút
- Nếu build quá lâu, có thể cần upgrade plan
- Hoặc optimize build (remove unused dependencies)

### Lỗi: "Environment variables not found"

**Giải pháp:**
- Verify tất cả env vars đã được set trên Render dashboard
- Check variable names (case-sensitive)
- Restart service sau khi set env vars

### Lỗi: "Module not found"

**Giải pháp:**
- Check `package.json` có đầy đủ dependencies
- Run `npm install` local để verify
- Check `package-lock.json` được commit

---

## 📊 Build Time

- **Expected:** 2-5 phút
- **First build:** Có thể lâu hơn (5-10 phút)
- **Subsequent builds:** Nhanh hơn nhờ cache

---

## 🔄 Auto-Deploy Setup

1. **Enable Auto-Deploy:**
   - Settings → Auto-Deploy
   - Chọn branch: `main` hoặc `master`

2. **Webhook:**
   - Render tự động tạo webhook
   - Mỗi khi push code, sẽ tự động deploy

---

## 💡 Tips

1. **Monitor Build Logs:**
   - Xem real-time logs trong Render dashboard
   - Check errors ngay khi build

2. **Environment Variables:**
   - Set tất cả env vars TRƯỚC KHI deploy lần đầu
   - Có thể update sau, nhưng cần restart service

3. **Custom Domain:**
   - Có thể add custom domain trong Settings
   - Cần verify DNS

4. **Health Check:**
   - Render tự động check `/` endpoint
   - Đảm bảo homepage load được

---

## ✅ Checklist

- [ ] Code đã push lên GitHub
- [ ] `package.json` có `lightningcss-linux-x64-gnu` trong devDependencies
- [ ] `.npmrc` file có trong repo
- [ ] Environment variables đã set trên Render
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Node version: 20 (hoặc 18)
- [ ] Deploy thành công
- [ ] Homepage load được
- [ ] API calls hoạt động

---

## 📞 Support

Nếu vẫn gặp vấn đề:
1. Check build logs trên Render
2. Verify tất cả files đã được commit
3. Check environment variables
4. Review error messages

**Good luck! 🚀**

