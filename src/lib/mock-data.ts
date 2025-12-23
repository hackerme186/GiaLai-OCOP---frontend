import { Product } from "./api"

export const mockProducts: Product[] = [
  {
    id: 1,
    name: "Cà phê Robusta Gia Lai",
    description: "Cà phê Robusta chất lượng cao được trồng tại vùng đất bazan màu mỡ của Gia Lai. Hạt cà phê được chọn lọc kỹ càng, rang theo phương pháp truyền thống.",
    price: 150000,
    unit: "kg",
    imageUrl: "/hero.jpg",
    categoryName: "Nông sản",
    averageRating: 4.8,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 5
  },
  {
    id: 2,
    name: "Mật ong rừng Tây Nguyên",
    description: "Mật ong nguyên chất được thu hoạch từ rừng Tây Nguyên, không qua xử lý hóa học, giữ nguyên hương vị tự nhiên.",
    price: 200000,
    unit: "chai",
    imageUrl: "/hero.jpg",
    categoryName: "Nông sản",
    averageRating: 4.9,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 5
  },
  {
    id: 3,
    name: "Gốm sứ Bàu Trúc",
    description: "Sản phẩm gốm sứ thủ công được làm bởi nghệ nhân làng gốm Bàu Trúc, mang đậm bản sắc văn hóa Chăm.",
    price: 350000,
    unit: "cái",
    imageUrl: "/hero.jpg",
    categoryName: "Thủ công mỹ nghệ",
    averageRating: 4.7,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 4
  },
  {
    id: 4,
    name: "Trà atiso Đà Lạt",
    description: "Trà atiso được chế biến từ hoa atiso tươi, có tác dụng thanh nhiệt, giải độc, tốt cho sức khỏe.",
    price: 120000,
    unit: "gói",
    imageUrl: "/hero.jpg",
    categoryName: "Thực phẩm",
    averageRating: 4.6,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 4
  },
  {
    id: 5,
    name: "Tinh dầu sả chanh",
    description: "Tinh dầu sả chanh nguyên chất được chiết xuất từ cây sả chanh, có tác dụng thư giãn, kháng khuẩn.",
    price: 180000,
    unit: "chai",
    imageUrl: "/hero.jpg",
    categoryName: "Dược liệu",
    averageRating: 4.5,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 4
  },
  {
    id: 6,
    name: "Bánh tráng nướng Đà Lạt",
    description: "Bánh tráng nướng đặc sản Đà Lạt với nhiều topping phong phú, giòn tan, thơm ngon.",
    price: 25000,
    unit: "cái",
    imageUrl: "/hero.jpg",
    categoryName: "Thực phẩm",
    averageRating: 4.4,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 3
  },
  {
    id: 7,
    name: "Vải thổ cẩm Tây Nguyên",
    description: "Vải thổ cẩm được dệt thủ công bởi các nghệ nhân dân tộc, hoa văn độc đáo, màu sắc tươi sáng.",
    price: 450000,
    unit: "mét",
    imageUrl: "/hero.jpg",
    categoryName: "Thủ công mỹ nghệ",
    averageRating: 4.8,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 5
  },
  {
    id: 8,
    name: "Rượu cần Tây Nguyên",
    description: "Rượu cần truyền thống được ủ từ gạo nếp và men lá, hương vị đậm đà, độc đáo.",
    price: 300000,
    unit: "chai",
    imageUrl: "/hero.jpg",
    categoryName: "Thực phẩm",
    averageRating: 4.3,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 4
  },
  {
    id: 9,
    name: "Hạt điều Bình Phước",
    description: "Hạt điều rang muối giòn tan, béo ngậy, được chọn lọc từ những hạt điều chất lượng cao.",
    price: 280000,
    unit: "kg",
    imageUrl: "/hero.jpg",
    categoryName: "Nông sản",
    averageRating: 4.7,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 5
  },
  {
    id: 10,
    name: "Nấm linh chi Tây Nguyên",
    description: "Nấm linh chi được trồng trong môi trường tự nhiên, có tác dụng tăng cường sức khỏe, miễn dịch.",
    price: 500000,
    unit: "kg",
    imageUrl: "/hero.jpg",
    categoryName: "Dược liệu",
    averageRating: 4.9,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 5
  },
  {
    id: 11,
    name: "Đồng hồ gỗ thủ công",
    description: "Đồng hồ gỗ được chế tác thủ công từ gỗ quý, thiết kế độc đáo, mang tính nghệ thuật cao.",
    price: 800000,
    unit: "cái",
    imageUrl: "/hero.jpg",
    categoryName: "Thủ công mỹ nghệ",
    averageRating: 4.6,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 4
  },
  {
    id: 12,
    name: "Trái cây sấy khô",
    description: "Hỗn hợp trái cây sấy khô gồm mít, chuối, khoai lang, không chất bảo quản, giữ nguyên hương vị tự nhiên.",
    price: 95000,
    unit: "gói",
    imageUrl: "/hero.jpg",
    categoryName: "Thực phẩm",
    averageRating: 4.5,
    status: "Approved",
    stockStatus: "InStock",
    ocopRating: 4
  }
]

export function getMockProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
}) {
  let filteredProducts = [...mockProducts]
  
  // Filter by category
  if (params?.category) {
    filteredProducts = filteredProducts.filter(product => 
      product.categoryName?.toLowerCase().includes(params.category!.toLowerCase())
    )
  }
  
  // Filter by search
  if (params?.search) {
    const searchLower = params.search.toLowerCase()
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    )
  }
  
  // Pagination
  const page = params?.page || 1
  const limit = params?.limit || 12
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  
  const products = filteredProducts.slice(startIndex, endIndex)
  
  return {
    products,
    total: filteredProducts.length,
    page,
    limit
  }
}

export function getMockProductById(id: number): Product | null {
  return mockProducts.find(product => product.id === id) || null
}

export function getMockFeaturedProducts(): Product[] {
  return mockProducts.filter(product => product.averageRating && product.averageRating >= 4.7)
}
