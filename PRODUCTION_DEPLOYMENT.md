# 🚀 Production Deployment Guide

## 🎉 Backend đã Live!

Backend đã được deploy thành công lên **Render**:

```
🌐 URL: https://gialai-ocop-be.onrender.com
📡 API: https://gialai-ocop-be.onrender.com/api
📖 Docs: https://gialai-ocop-be.onrender.com/swagger
```

---

## ✅ Current Status

### Backend (Render)
- ✅ **Live & Running**
- ✅ **HTTPS Enabled**
- ✅ **Database Connected**
- ✅ **API Endpoints Working**
- ⚠️ **Free Tier** - May sleep after 15 min inactivity

### Frontend
- ✅ **Configured for Production Backend**
- ✅ **Automatic Fallback to Mock Data**
- ✅ **Backend Status Monitoring**
- 🔄 **Ready to Deploy**

---

## 🔧 Frontend Configuration

Frontend đã được cấu hình mặc định để connect với production backend:

```typescript
// src/lib/api.ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 
  "https://gialai-ocop-be.onrender.com/api";
```

**No configuration needed!** Chỉ cần chạy:
```bash
npm run dev
```

---

## 🌐 Deploy Frontend

### Option 1: Vercel (Khuyến nghị)

1. **Push code lên GitHub:**
```bash
git add .
git commit -m "Production ready"
git push origin main
```

2. **Deploy trên Vercel:**
- Truy cập: https://vercel.com
- Import GitHub repository
- Configure environment variables (optional):
  ```
  NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
  ```
- Deploy!

3. **CORS Configuration:**
Update backend `Program.cs`:
```csharp
policy.WithOrigins(
    "http://localhost:3000",
    "https://your-vercel-app.vercel.app"
)
```

### Option 2: Netlify

1. **Build app:**
```bash
npm run build
```

2. **Deploy trên Netlify:**
- Drag & drop folder `out/` hoặc `.next/`
- Hoặc connect GitHub repo

3. **Environment Variables:**
```
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api
```

### Option 3: Self-Hosted

1. **Build production:**
```bash
npm run build
npm start
```

2. **Or with PM2:**
```bash
npm install -g pm2
npm run build
pm2 start npm --name "ocop-frontend" -- start
pm2 save
pm2 startup
```

---

## ⚙️ Environment Variables for Production

### Required
```bash
# Backend API
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api

# NextAuth
NEXTAUTH_URL=https://your-frontend-domain.com
NEXTAUTH_SECRET=your-production-secret-min-32-chars
```

### Optional (OAuth)
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 🔐 Security Checklist

### Backend (Render)
- [x] HTTPS enabled
- [x] CORS configured
- [x] Environment variables secured
- [x] Database password encrypted
- [x] JWT secret configured

### Frontend
- [ ] Update NEXTAUTH_SECRET
- [ ] Configure production domain
- [ ] Setup OAuth credentials
- [ ] Enable HTTPS
- [ ] Update CORS in backend

---

## 📊 Performance Optimization

### Backend (Render Free Tier)

**Issue: Cold Start**
- Backend sleeps after 15 min inactivity
- First request takes ~30s to wake up

**Solutions:**

1. **Keep-Alive Service** (Recommended)
   - Use cron-job.org or UptimeRobot
   - Ping every 10 minutes: `https://gialai-ocop-be.onrender.com/api/products`

2. **Upgrade to Paid Tier**
   - No cold starts
   - Better performance
   - More resources

3. **Frontend Fallback**
   - ✅ Already implemented
   - Shows mock data during cold start
   - User experience not affected

### Frontend

**Optimizations:**
- ✅ Image optimization (Next.js)
- ✅ Code splitting
- ✅ API error handling
- ✅ Loading states
- ✅ Caching strategy

---

## 🧪 Testing Production

### 1. Test Backend API
```bash
# Test products endpoint
curl https://gialai-ocop-be.onrender.com/api/products

# Expected: Array of products or empty array
```

### 2. Test Frontend Connection
```bash
npm run dev

# Open browser
http://localhost:3000

# Check:
# ✅ Products load
# ✅ No backend status banner
# ✅ Console shows API calls
```

### 3. Test Features
- [ ] View products
- [ ] Register account
- [ ] Login
- [ ] Submit OCOP registration
- [ ] Admin dashboard (if admin user exists)

---

## 🔄 Continuous Deployment

### Vercel Auto-Deploy

```yaml
# vercel.json
{
  "env": {
    "NEXT_PUBLIC_API_BASE": "https://gialai-ocop-be.onrender.com/api"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_API_BASE": "https://gialai-ocop-be.onrender.com/api"
    }
  }
}
```

**Auto-deploy on:**
- ✅ Push to main branch
- ✅ Pull request preview
- ✅ Environment variables updated

### GitHub Actions (Optional)

```yaml
# .github/workflows/deploy.yml
name: Deploy Frontend

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run deploy
        env:
          NEXT_PUBLIC_API_BASE: ${{ secrets.API_BASE_URL }}
```

---

## 📱 Mobile App (Future)

Backend API ready for mobile apps:

```javascript
// React Native / Flutter
const API_BASE = 'https://gialai-ocop-be.onrender.com/api';

fetch(`${API_BASE}/products`)
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## 🔍 Monitoring

### Backend Monitoring

**Render Dashboard:**
- View logs: https://dashboard.render.com
- Monitor metrics
- Check deployment status

**Uptime Monitoring:**
- UptimeRobot: https://uptimerobot.com
- Pingdom
- StatusCake

### Frontend Monitoring

**Vercel Analytics:**
- Built-in analytics
- Performance insights
- Error tracking

**Third-party:**
- Google Analytics
- Sentry (error tracking)
- LogRocket (session replay)

---

## 🐛 Troubleshooting Production

### Issue: Backend Not Responding

**Symptoms:**
- Frontend shows "Backend offline" banner
- API calls timeout
- Mock data displayed

**Solutions:**
1. Check Render dashboard
2. Wake up backend: Visit https://gialai-ocop-be.onrender.com
3. Wait 30s for cold start
4. Check logs on Render

### Issue: CORS Error

**Symptoms:**
- Console error: "CORS policy..."
- API calls fail

**Solutions:**
1. Update backend CORS settings
2. Add your frontend domain
3. Redeploy backend

### Issue: Authentication Fails

**Symptoms:**
- Can't login
- 401 Unauthorized

**Solutions:**
1. Check JWT_SECRET matches
2. Verify database connection
3. Check user exists in database
4. Check token in localStorage

---

## 📊 Current Architecture

```
┌─────────────────┐
│   Frontend      │  http://localhost:3000
│   (Next.js)     │  or your-domain.com
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────┐
│   Backend API   │  https://gialai-ocop-be.onrender.com
│   (.NET Core)   │
└────────┬────────┘
         │
         │ PostgreSQL
         ▼
┌─────────────────┐
│   Database      │  Render PostgreSQL
│   (Postgres)    │
└─────────────────┘
```

---

## 🎯 Deployment Checklist

### Pre-Deployment
- [x] Backend deployed to Render
- [x] Database setup complete
- [x] API endpoints tested
- [x] CORS configured
- [x] Environment variables set

### Frontend Deployment
- [ ] Code pushed to GitHub
- [ ] Environment variables configured
- [ ] Build tested locally
- [ ] CORS updated with production domain
- [ ] Deploy to Vercel/Netlify
- [ ] Test production deployment
- [ ] Monitor for errors

### Post-Deployment
- [ ] Setup uptime monitoring
- [ ] Configure analytics
- [ ] Test all features
- [ ] Document any issues
- [ ] Setup backup strategy

---

## 🚀 Quick Deploy Commands

```bash
# Frontend
git add .
git commit -m "Deploy to production"
git push origin main

# Backend already deployed!
# ✅ https://gialai-ocop-be.onrender.com

# Test production
curl https://gialai-ocop-be.onrender.com/api/products
```

---

## 📞 Support

**Backend Issues:**
- Check Render dashboard
- View logs
- Contact Render support

**Frontend Issues:**
- Check Vercel/Netlify dashboard
- View build logs
- Check browser console

---

## 🎉 Summary

✅ **Backend:** Live on Render  
✅ **API:** https://gialai-ocop-be.onrender.com/api  
✅ **Frontend:** Configured for production  
✅ **Documentation:** Complete  
✅ **Monitoring:** Backend status indicator  
🚀 **Ready to Deploy!**

**Next Steps:**
1. Deploy frontend to Vercel
2. Setup keep-alive service
3. Configure production domain
4. Monitor and optimize

**🎊 Your app is production-ready!**

