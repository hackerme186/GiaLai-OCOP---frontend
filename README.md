# 🌾 GiaLai OCOP E-Commerce Platform

**Sàn thương mại điện tử sản phẩm OCOP (One Commune One Product) tỉnh Gia Lai**

Modern e-commerce platform built with **Next.js 15**, **React 19**, and **TypeScript**, integrated with a production-ready **.NET Core** backend.

---

## ✨ Features

- 🛍️ **E-Commerce** - Browse, search, and purchase OCOP products
- ⭐ **OCOP Rating System** - 3-5 star certification system
- 📝 **Enterprise Registration** - Complete OCOP application workflow
- 👥 **Multi-Role System** - Customer, EnterpriseAdmin, SystemAdmin
- 💳 **Payment Integration** - COD & Bank Transfer with QR codes
- 🗺️ **Map Integration** - Location-based enterprise search
- 📊 **Admin Dashboard** - Comprehensive management tools
- 🔐 **JWT Authentication** - Secure user authentication
- 📱 **Responsive Design** - Mobile-first UI with Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd frontend

# Install dependencies
npm install

# Setup environment variables (QUAN TRỌNG!)
# Windows:
.\setup-env.ps1
# Linux/Mac:
chmod +x setup-env.sh && ./setup-env.sh

# Run development server
npm run dev
```

**That's it!** 🎉 Open [http://localhost:3000](http://localhost:3000)

### Environment Variables Setup

**⚠️ QUAN TRỌNG:** Bạn cần setup environment variables trước khi chạy!

**Cách nhanh nhất:**
- Windows: `.\setup-env.ps1`
- Linux/Mac: `chmod +x setup-env.sh && ./setup-env.sh`

**Hoặc tạo thủ công:**
- Xem [README_ENV.md](./README_ENV.md) để biết cách setup
- Xem [SETUP_ENV.md](./SETUP_ENV.md) để biết chi tiết đầy đủ

**Logic hoạt động:**
- **Local Development**: Tự động dùng `.env.local` → API: `http://localhost:5003/api`
- **Production**: Tự động dùng `.env.production` → API: `https://gialai-ocop-be.onrender.com/api`
- **Không cần chỉnh code**: Chỉ cần tạo file `.env` tương ứng

> ⚠️ **Note:** Backend trên Render free tier có thể sleep sau 15 phút không hoạt động. Lần đầu truy cập sẽ mất 30-60 giây để wake up.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [**PRODUCTION_READY.md**](PRODUCTION_READY.md) | 👈 **START HERE!** Quick overview & status |
| [**QUICK_START.md**](QUICK_START.md) | Getting started guide |
| [**API_INTEGRATION_COMPLETE.md**](API_INTEGRATION_COMPLETE.md) | Complete API documentation |
| [**ENV_CONFIGURATION.md**](ENV_CONFIGURATION.md) | Environment variables setup |
| [**HUONG_DAN_GOOGLE_LOGIN.md**](HUONG_DAN_GOOGLE_LOGIN.md) | 🔐 Hướng dẫn thiết lập đăng nhập Google |
| [**TROUBLESHOOTING.md**](TROUBLESHOOTING.md) | Common issues & solutions |
| [**PRODUCTION_DEPLOYMENT.md**](PRODUCTION_DEPLOYMENT.md) | Deploy to production |

---

## 🎯 Key Technologies

### Frontend
- **Framework:** Next.js 15.5.4 (App Router)
- **UI Library:** React 19.1.0
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Authentication:** NextAuth.js 4
- **State Management:** React Context + Hooks

### Backend (Production)
- **Framework:** .NET Core 9
- **Database:** PostgreSQL
- **Hosting:** Render
- **API Docs:** Swagger/OpenAPI
- **URL:** https://gialai-ocop-be.onrender.com

---

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Homepage
│   │   ├── products/     # Products pages
│   │   ├── cart/         # Shopping cart
│   │   ├── admin/        # Admin dashboard
│   │   └── ...
│   ├── components/       # React components
│   │   ├── home/         # Homepage sections
│   │   ├── layout/       # Header, Footer, Navbar
│   │   └── admin/        # Admin components
│   └── lib/              # Utilities & API client
│       ├── api.ts        # API integration (42 endpoints)
│       ├── auth.ts       # Authentication utilities
│       ├── cart.ts       # Shopping cart logic
│       └── mock-data.ts  # Fallback mock data
├── public/               # Static assets
└── docs/                 # Documentation files
```

---

## 🎨 Features Showcase

### 🏠 Homepage
- Hero slider with featured products
- OCOP product showcase with ratings
- Interactive map section
- Latest news & updates

### 🛒 Shopping Experience
- Product grid with filters
- Category-based browsing
- Search functionality
- OCOP rating badges (⭐ 3-5 stars)
- Shopping cart management
- Checkout process

### 📝 OCOP Registration
- 3-step registration wizard
- 66 form fields with validation
- File upload support
- Enterprise application tracking

### 👨‍💼 Admin Dashboard
- Enterprise application approval
- Product approval workflow
- Category management
- Reports & analytics
- User management

---

## 🔐 User Roles

### Customer
- Browse and purchase products
- Submit OCOP enterprise applications
- Manage orders and cart

### EnterpriseAdmin
- Manage products (CRUD)
- View and process orders
- Confirm payments
- Track sales

### SystemAdmin
- Approve enterprise applications
- Approve/reject products
- Manage categories
- View system reports
- Full system access

---

## 📡 API Integration

Frontend integrates with **42 backend API endpoints**:

### Core Modules
- ✅ Authentication (2 endpoints)
- ✅ Products (6 endpoints) 
- ✅ Categories (5 endpoints)
- ✅ Enterprise Applications (4 endpoints)
- ✅ Enterprises (4 endpoints)
- ✅ Orders (5 endpoints)
- ✅ Payments (4 endpoints)
- ✅ Map API (6 endpoints)
- ✅ Reports (3 endpoints)
- ✅ Users (3 endpoints)

**API Documentation:** https://gialai-ocop-be.onrender.com/swagger

---

## 🚀 Deployment

### Deploy Frontend

**Vercel (Recommended):**
```bash
# Push to GitHub
git push origin main

# Deploy on Vercel
# Visit: https://vercel.com
# Import repository
# Deploy!
```

**Netlify:**
```bash
npm run build
# Deploy .next/ folder
```

**Self-Hosted:**
```bash
npm run build
npm start
# or with PM2:
pm2 start npm --name "ocop-frontend" -- start
```

### Backend (Already Deployed!)
```
Production: https://gialai-ocop-be.onrender.com
Status: ✅ Live
```

---

## 🔧 Development

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Environment Variables

Create `.env.local`:

```bash
# Backend API (default: production)
NEXT_PUBLIC_API_BASE=https://gialai-ocop-be.onrender.com/api

# For local backend:
# NEXT_PUBLIC_API_BASE=https://localhost:5001/api

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
```

---

## 🧪 Testing

### Test Backend Connection
```bash
# Check if backend is online
curl https://gialai-ocop-be.onrender.com/api/products
```

### Test Features
1. Homepage - http://localhost:3000
2. Products - http://localhost:3000/products
3. Register - http://localhost:3000/register
4. Login - http://localhost:3000/login
5. Admin - http://localhost:3000/admin

---

## 📱 Responsive Design

- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768+)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667+)

---

## 🎯 Roadmap

- [ ] Payment gateway integration (VNPay, Momo)
- [ ] Real-time order tracking
- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile app (React Native)
- [ ] Seller dashboard enhancements
- [ ] Product reviews system
- [ ] Multi-language support

---

## 🐛 Known Issues

### Backend Cold Start (Render Free Tier)
- Backend may sleep after 15 min inactivity
- First request takes ~30s to wake up
- **Solution:** Frontend auto-fallbacks to mock data
- **Fix:** Use keep-alive service or upgrade tier

### Solutions Implemented
- ✅ Automatic backend status detection
- ✅ Mock data fallback
- ✅ User-friendly status banner
- ✅ Helpful error messages

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is proprietary software for GiaLai Province.

---

## 👥 Team

Developed for **GiaLai Province** OCOP Initiative

---

## 📞 Support

- 📖 Documentation: See docs folder
- 🐛 Issues: Create GitHub issue
- 💬 Questions: Check TROUBLESHOOTING.md

---

## 🙏 Acknowledgments

- Next.js Team for the amazing framework
- .NET Core for robust backend
- Render for hosting backend
- Tailwind CSS for beautiful styling
- Open source community

---

## 📊 Project Stats

- **Lines of Code:** 10,000+
- **API Endpoints:** 42
- **Components:** 50+
- **Pages:** 15+
- **Documentation:** 6 comprehensive guides
- **Status:** ✅ Production Ready

---

## 🎉 Quick Links

| Resource | URL |
|----------|-----|
| **Frontend Dev** | http://localhost:3000 |
| **Backend API** | https://gialai-ocop-be.onrender.com |
| **API Docs** | https://gialai-ocop-be.onrender.com/swagger |
| **Documentation** | See docs in root folder |

---

**Built with ❤️ for GiaLai OCOP Initiative**

🌾 Empowering local communities through digital commerce 🌾
