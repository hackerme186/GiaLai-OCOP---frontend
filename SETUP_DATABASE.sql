-- ========================================
-- SETUP DATABASE FOR GIALAI OCOP PROJECT
-- ========================================
-- Run this in Supabase SQL Editor
-- Link: https://supabase.com/dashboard/project/obafbtrimbjllrsonszz

-- ========================================
-- 1. UPDATE PRODUCT STATUS
-- ========================================
-- Fix: Tất cả products có Status = NULL
-- Solution: Set Status = 'Approved' để hiển thị trên frontend

UPDATE "Products"
SET "Status" = 'Approved'
WHERE "Status" IS NULL;

-- ========================================
-- 2. VERIFY PRODUCTS
-- ========================================
SELECT 
  "Id",
  "Name",
  "Status",
  "Price",
  "EnterpriseId",
  "CategoryId",
  "OCOPRating",
  "StockStatus"
FROM "Products"
ORDER BY "Id";

-- ========================================
-- 3. CHECK CATEGORIES (Optional)
-- ========================================
SELECT * FROM "Categories";

-- ========================================
-- 4. CHECK ENTERPRISES (Optional)
-- ========================================
SELECT 
  "Id",
  "Name",
  "Email",
  "Phone"
FROM "Enterprises"
ORDER BY "Id";

-- ========================================
-- EXPECTED RESULTS AFTER UPDATE:
-- ========================================
-- All products should have Status = 'Approved'
-- Frontend will display all 10 products from database
-- No more mock data fallback

-- ========================================
-- TROUBLESHOOTING
-- ========================================
-- If products still not showing:
-- 1. Check backend is online: https://gialai-ocop-be.onrender.com/api/products
-- 2. Restart frontend: npm run dev
-- 3. Hard refresh browser: Ctrl+Shift+R
-- 4. Check console for errors

