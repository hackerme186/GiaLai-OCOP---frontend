import { Product } from "./types"

export const mockProducts: Product[] = [
  {
    id: 1,
    name: "Cà phê Robusta Gia Lai",
    description: "Cà phê Robusta được trồng trên vùng đất đỏ bazan màu mỡ của Gia Lai, cho hương vị đậm đà, mạnh mẽ. Sản phẩm OCOP 4 sao của tỉnh.",
    price: 150000,
    image: "/products/cafe-gialai.jpg",
    category: "Nông sản",
    rating: 4.8,
    quantity: 50,
    originProvince: "Gia Lai",
    ocopLevel: 4
  },
  {
    id: 2,
    name: "Hồ tiêu Chư Sê",
    description: "Hồ tiêu nổi tiếng với vị cay nồng, thơm đậm, được trồng tại vùng đất đỏ bazan Chư Sê, Gia Lai. Sản phẩm OCOP 5 sao xuất khẩu.",
    price: 250000,
    image: "/products/ho-tieu-chuse.jpg",
    category: "Nông sản",
    rating: 4.9,
    quantity: 60,
    originProvince: "Gia Lai",
    ocopLevel: 5
  },
  {
    id: 3,
    name: "Bò một nắng Krông Pa",
    description: "Đặc sản nổi tiếng của Gia Lai, thịt bò được phơi một nắng, nướng than, dai ngon và đậm vị. Sản phẩm OCOP 4 sao.",
    price: 450000,
    image: "/products/bo-mot-nang.jpg",
    category: "Thực phẩm",
    rating: 4.8,
    quantity: 40,
    originProvince: "Gia Lai",
    ocopLevel: 4
  },
  {
    id: 4,
    name: "Muối kiến vàng Gia Lai",
    description: "Muối được làm từ kiến vàng rừng Gia Lai, có vị chua mặn đặc trưng, thường ăn kèm thịt nướng hoặc trái cây. Sản phẩm OCOP 3 sao.",
    price: 120000,
    image: "/products/muoi-kien-vang.jpg",
    category: "Gia vị",
    rating: 4.7,
    quantity: 100,
    originProvince: "Gia Lai",
    ocopLevel: 3
  },
  {
    id: 5,
    name: "Rượu cần Tây Nguyên",
    description: "Rượu cần truyền thống của đồng bào Ba Na – Gia Lai, ủ từ gạo nếp và men lá tự nhiên. Sản phẩm OCOP 4 sao.",
    price: 300000,
    image: "/products/ruou-can.jpg",
    category: "Đồ uống",
    rating: 4.6,
    quantity: 45,
    originProvince: "Gia Lai",
    ocopLevel: 4
  },
  {
    id: 6,
    name: "Mật ong rừng Gia Lai",
    description: "Mật ong rừng tự nhiên từ vùng Kon Chiêng – Gia Lai, thơm ngon, giàu dinh dưỡng. Sản phẩm OCOP 5 sao.",
    price: 320000,
    image: "/products/mat-ong-gialai.jpg",
    category: "Dược liệu",
    rating: 4.9,
    quantity: 35,
    originProvince: "Gia Lai",
    ocopLevel: 5
  },

  // ----------- BÌNH ĐỊNH -----------
  {
    id: 7,
    name: "Tré Bà Đệ Bình Định",
    description: "Món ăn truyền thống được làm từ thịt heo lên men, gói trong lá chuối, hương vị chua cay hấp dẫn. Sản phẩm OCOP 4 sao.",
    price: 95000,
    image: "/products/tre-bade.jpg",
    category: "Thực phẩm",
    rating: 4.8,
    quantity: 120,
    originProvince: "Bình Định",
    ocopLevel: 4
  },
  {
    id: 8,
    name: "Rượu Bàu Đá Bình Định",
    description: "Rượu gạo nấu bằng nước giếng Bàu Đá, hương thơm nồng nàn, êm dịu. Sản phẩm OCOP 5 sao quốc gia.",
    price: 350000,
    image: "/products/ruou-bau-da.jpg",
    category: "Đồ uống",
    rating: 4.9,
    quantity: 50,
    originProvince: "Bình Định",
    ocopLevel: 5
  },
  {
    id: 9,
    name: "Bánh ít lá gai Bình Định",
    description: "Bánh làm từ lá gai tươi, nhân đậu xanh và dừa nạo, dẻo thơm đặc trưng miền Trung. Sản phẩm OCOP 4 sao.",
    price: 40000,
    image: "/products/banh-it-la-gai.jpg",
    category: "Thực phẩm",
    rating: 4.7,
    quantity: 180,
    originProvince: "Bình Định",
    ocopLevel: 4
  },
  {
    id: 10,
    name: "Nước mắm Tam Quan",
    description: "Nước mắm nguyên chất từ cá cơm tươi vùng biển Tam Quan, Bình Định. Sản phẩm OCOP 4 sao.",
    price: 150000,
    image: "/products/nuoc-mam-tam-quan.jpg",
    category: "Gia vị",
    rating: 4.8,
    quantity: 70,
    originProvince: "Bình Định",
    ocopLevel: 4
  },
  {
    id: 11,
    name: "Bánh tráng nước dừa Tam Quan",
    description: "Bánh tráng được làm từ bột gạo pha nước dừa, phơi nắng tự nhiên, giòn rụm, thơm béo. Sản phẩm OCOP 3 sao.",
    price: 60000,
    image: "/products/banh-trang-nuoc-dua.jpg",
    category: "Thực phẩm",
    rating: 4.5,
    quantity: 90,
    originProvince: "Bình Định",
    ocopLevel: 3
  },
  {
    id: 12,
    name: "Gỗ mỹ nghệ Bình Định",
    description: "Các sản phẩm điêu khắc gỗ thủ công tinh xảo của nghệ nhân Bình Định. Sản phẩm OCOP 4 sao.",
    price: 800000,
    image: "/products/go-my-nghe.jpg",
    category: "Thủ công mỹ nghệ",
    rating: 4.7,
    quantity: 15,
    originProvince: "Bình Định",
    ocopLevel: 4
  }
]

// --- Filtering, Searching & Pagination ---
export function getMockProducts(params?: {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  province?: string;
  ocopLevel?: number;
}) {
  let filteredProducts = [...mockProducts]
  
  if (params?.category) {
    filteredProducts = filteredProducts.filter(product => 
      product.category?.toLowerCase().includes(params.category!.toLowerCase())
    )
  }

  if (params?.province) {
    filteredProducts = filteredProducts.filter(product =>
      product.originProvince?.toLowerCase().includes(params.province!.toLowerCase())
    )
  }

  if (params?.ocopLevel) {
    filteredProducts = filteredProducts.filter(product =>
      product.ocopLevel === params.ocopLevel
    )
  }
  
  if (params?.search) {
    const searchLower = params.search.toLowerCase()
    filteredProducts = filteredProducts.filter(product =>
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower)
    )
  }
  
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
  return mockProducts.filter(product => product.rating && product.rating >= 4.8)
}
