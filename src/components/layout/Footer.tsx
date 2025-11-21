"use client"
import Image from 'next/image'
import Link from 'next/link'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-green-500">
              Thông tin liên hệ
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 group">
                <svg className="w-5 h-5 text-green-400 mt-1 flex-shrink-0 group-hover:text-green-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-gray-300 leading-relaxed group-hover:text-white transition-colors">
                  123 Đường Trần Hưng Đại, Phường Quy Nhơn<br />
                  Gia Lai, Việt Nam
                </p>
              </div>
              <div className="flex items-center space-x-3 group">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 group-hover:text-green-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href="tel:+841234567890" className="text-gray-300 hover:text-white transition-colors">
                  (123) 456-7890
                </a>
              </div>
              <div className="flex items-center space-x-3 group">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 group-hover:text-green-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:info@ocopgialai.vn" className="text-gray-300 hover:text-white transition-colors">
                  info@ocopgialai.vn
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-green-500">
              Liên kết nhanh
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/about" 
                  className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-green-500 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Về chúng tôi</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/products" 
                  className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-green-500 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Sản phẩm</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/news" 
                  className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-green-500 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Tin tức</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/contact" 
                  className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-green-500 mr-0 group-hover:mr-2 transition-all duration-300"></span>
                  <span className="group-hover:translate-x-1 transition-transform duration-300">Liên hệ</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white relative pb-3 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-12 after:h-1 after:bg-green-500">
              Liên kết
            </h3>
            <div className="flex flex-col space-y-4">
              <Link 
                href="https://www.facebook.com/GIALAIOCOPPORTAL" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-1 group"
                title="Facebook OCOP Gia Lai"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-blue-500/50">
                  <svg 
                    width="22" 
                    height="22" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    className="text-white"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">Facebook</span>
              </Link>
              <Link 
                href="https://www.tiktok.com/@gialaiocop_portal?_r=1&_t=ZS-91a94nkkAwE" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 text-gray-300 hover:text-white transition-all duration-300 hover:translate-x-1 group"
                title="TikTok OCOP Gia Lai"
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-black group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-gray-900/50">
                  <svg 
                    width="22" 
                    height="22" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                    className="text-white"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium">TikTok</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 pt-8 border-t border-gray-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-gray-300 font-medium">OCOP Gia Lai</span>
            </div>
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} OCOP Gia Lai. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer

