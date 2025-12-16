"use client"

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-96 bg-gradient-to-r from-green-600 to-green-800 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Về Chúng Tôi</h1>
            <p className="text-xl md:text-2xl">Kết nối đặc sản địa phương với thị trường</p>
          </div>
        </section>

        {/* Giới thiệu về OCOP */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">OCOP Là Gì?</h2>
              <div className="w-24 h-1 bg-green-600 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                  <strong>OCOP (One Commune One Product)</strong> là chương trình phát triển kinh tế nông thôn 
                  thông qua việc phát triển sản phẩm đặc trưng của từng địa phương. Chương trình nhằm mục tiêu 
                  nâng cao giá trị sản phẩm, tăng thu nhập cho người dân và phát triển bền vững nông thôn.
                </p>
                <p className="text-lg text-gray-700 mb-4 leading-relaxed">
                  Tỉnh Gia Lai với địa hình cao nguyên, khí hậu mát mẻ, đã tạo nên những đặc sản nổi tiếng như 
                  cà phê, hạt điều, tiêu và nhiều sản phẩm nông nghiệp chất lượng cao.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Chương trình OCOP tại Gia Lai không chỉ quảng bá sản phẩm địa phương mà còn góp phần bảo tồn 
                  văn hóa, phát triển du lịch và nâng cao đời sống người dân.
                </p>
              </div>
              <div className="relative h-80 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src="/coffee-gia-lai.jpg"
                  alt="Cà phê Gia Lai"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Về Nền Tảng */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Về Nền Tảng</h2>
              <div className="w-24 h-1 bg-green-600 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Sàn Thương Mại Điện Tử</h3>
                <p className="text-gray-600">
                  Nền tảng trực tuyến kết nối doanh nghiệp địa phương với khách hàng trên toàn quốc
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Hỗ Trợ Doanh Nghiệp</h3>
                <p className="text-gray-600">
                  Giúp các doanh nghiệp địa phương quảng bá và bán sản phẩm OCOP một cách hiệu quả
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Chất Lượng Đảm Bảo</h3>
                <p className="text-gray-600">
                  Tất cả sản phẩm đều được đánh giá và chứng nhận OCOP với tiêu chuẩn chất lượng cao
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tính Năng Nổi Bật */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Tính Năng Nổi Bật</h2>
              <div className="w-24 h-1 bg-green-600 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start p-6 bg-white rounded-lg shadow-md">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Hệ Thống Xếp Hạng OCOP</h3>
                  <p className="text-gray-600">
                    Đánh giá sản phẩm theo tiêu chuẩn OCOP từ 3-5 sao, đảm bảo chất lượng và uy tín
                  </p>
                </div>
              </div>

              <div className="flex items-start p-6 bg-white rounded-lg shadow-md">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">📝</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Quy Trình Đăng Ký</h3>
                  <p className="text-gray-600">
                    Hệ thống đăng ký và duyệt doanh nghiệp minh bạch, nhanh chóng và dễ dàng
                  </p>
                </div>
              </div>

              <div className="flex items-start p-6 bg-white rounded-lg shadow-md">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🗺️</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Tích Hợp Bản Đồ</h3>
                  <p className="text-gray-600">
                    Tìm kiếm doanh nghiệp và sản phẩm theo vị trí địa lý, hỗ trợ chỉ đường
                  </p>
                </div>
              </div>

              <div className="flex items-start p-6 bg-white rounded-lg shadow-md">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">💳</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Thanh Toán Đa Dạng</h3>
                  <p className="text-gray-600">
                    Hỗ trợ thanh toán COD và chuyển khoản ngân hàng với QR code tiện lợi
                  </p>
                </div>
              </div>

              <div className="flex items-start p-6 bg-white rounded-lg shadow-md">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Quản Lý Đơn Hàng</h3>
                  <p className="text-gray-600">
                    Hệ thống quản lý đơn hàng thông minh, theo dõi trạng thái đơn hàng chi tiết
                  </p>
                </div>
              </div>

              <div className="flex items-start p-6 bg-white rounded-lg shadow-md">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Bảo Mật Thông Tin</h3>
                  <p className="text-gray-600">
                    Hệ thống bảo mật cao với JWT authentication, đảm bảo an toàn thông tin người dùng
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sản Phẩm & Dịch Vụ */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Sản Phẩm & Dịch Vụ</h2>
              <div className="w-24 h-1 bg-green-600 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="relative h-64 rounded-lg overflow-hidden shadow-lg mb-4">
                  <Image
                    src="/coffee-gia-lai.jpg"
                    alt="Cà phê Gia Lai"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Cà Phê Gia Lai</h3>
                <p className="text-gray-600">
                  Cà phê cao nguyên với hương vị đậm đà, thơm ngon đặc trưng
                </p>
              </div>

              <div className="text-center">
                <div className="relative h-64 rounded-lg overflow-hidden shadow-lg mb-4">
                  <Image
                    src="/hat-dieu-tieu.png"
                    alt="Hạt điều - Tiêu"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Hạt Điều & Tiêu</h3>
                <p className="text-gray-600">
                  Hạt điều và tiêu Gia Lai với chất lượng cao, được chứng nhận OCOP
                </p>
              </div>

              <div className="text-center">
                <div className="relative h-64 rounded-lg overflow-hidden shadow-lg mb-4">
                  <Image
                    src="/nem-chua-cho-huyen.png"
                    alt="Đặc sản Bình Định"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2">Đặc Sản Địa Phương</h3>
                <p className="text-gray-600">
                  Nem chợ Huyện, bánh tráng và nhiều đặc sản khác của vùng
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Quy Trình Hoạt Động */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Quy Trình Hoạt Động</h2>
              <div className="w-24 h-1 bg-green-600 mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  1
                </div>
                <h3 className="text-lg font-semibold mb-2">Đăng Ký</h3>
                <p className="text-gray-600 text-sm">
                  Doanh nghiệp đăng ký và nộp hồ sơ OCOP qua nền tảng
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  2
                </div>
                <h3 className="text-lg font-semibold mb-2">Duyệt Hồ Sơ</h3>
                <p className="text-gray-600 text-sm">
                  Hệ thống xem xét và phê duyệt hồ sơ doanh nghiệp
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  3
                </div>
                <h3 className="text-lg font-semibold mb-2">Đăng Sản Phẩm</h3>
                <p className="text-gray-600 text-sm">
                  Doanh nghiệp đăng sản phẩm và chờ duyệt từ hệ thống
                </p>
              </div>

              <div className="text-center p-6 bg-white rounded-lg shadow-md">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  4
                </div>
                <h3 className="text-lg font-semibold mb-2">Bán Hàng</h3>
                <p className="text-gray-600 text-sm">
                  Sản phẩm được duyệt và bắt đầu bán trên nền tảng
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tầm Nhìn & Sứ Mệnh */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Tầm Nhìn</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Trở thành nền tảng thương mại điện tử OCOP hàng đầu tại khu vực Tây Nguyên, 
                  kết nối hiệu quả giữa doanh nghiệp địa phương và người tiêu dùng trên toàn quốc, 
                  góp phần phát triển bền vững kinh tế nông thôn.
                </p>
              </div>

              <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Sứ Mệnh</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Hỗ trợ và phát triển các doanh nghiệp địa phương thông qua việc quảng bá sản phẩm OCOP, 
                  đảm bảo chất lượng và uy tín, tạo cơ hội tiếp cận thị trường rộng lớn, góp phần nâng cao 
                  đời sống người dân và phát triển kinh tế địa phương bền vững.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Liên Hệ */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Liên Hệ Với Chúng Tôi</h2>
            <div className="w-24 h-1 bg-green-600 mx-auto mb-8"></div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Địa Chỉ</h3>
                <p className="text-gray-600 text-sm">
                  123 Đường Trần Hưng Đại<br />
                  Phường Quy Nhơn, Gia Lai<br />
                  Việt Nam
                </p>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Điện Thoại</h3>
                <p className="text-gray-600 text-sm">
                  (123) 456-7890
                </p>
              </div>

              <div className="p-6 bg-white rounded-lg shadow-md">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold mb-2">Email</h3>
                <p className="text-gray-600 text-sm">
                  info@ocopgialai.vn
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

