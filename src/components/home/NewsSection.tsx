"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

interface NewsItem {
  id: number;
  title: string;
  date: string;
  description: string;
  image: string;
}

const STORAGE_KEY = "ocop_news_items";

const defaultNews: NewsItem[] = [
  {
    id: 1,
    title: "Cà phê Gia Lai được công nhận Top 10 sản phẩm OCOP tiêu biểu",
    date: "12/10/2023",
    description:
      "Sản phẩm cà phê Gia Lai đạt chứng nhận 4 sao trong chương trình OCOP quốc gia",
    image: "/coffee-gia-lai.jpg",
  },
  {
    id: 2,
    title: "Bánh tráng Bình Định - Hương vị truyền thống được bảo tồn",
    date: "11/10/2023",
    description:
      "Làng nghề bánh tráng An Thái được công nhận là di sản văn hóa phi vật thể",
    image: "/hero.jpg",
  },
  {
    id: 3,
    title: "Phát triển bền vững các sản phẩm OCOP tại Tây Nguyên",
    date: "10/10/2023",
    description:
      "Chiến lược phát triển và quảng bá sản phẩm OCOP vùng Tây Nguyên",
    image: "/hero.jpg",
  },
];

const NewsSection = () => {
  const [news, setNews] = useState<NewsItem[]>(defaultNews);

  useEffect(() => {
    // Load news from localStorage
    const loadNews = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as NewsItem[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setNews(parsed);
          }
        }
      } catch (err) {
        console.error("Failed to load news from storage:", err);
      }
    };

    loadNews();

    // Listen for news updates from admin
    const handleNewsUpdate = (event: CustomEvent) => {
      if (event.detail && Array.isArray(event.detail)) {
        setNews(event.detail);
      }
    };

    window.addEventListener(
      "newsUpdated" as any,
      handleNewsUpdate as EventListener
    );
    return () => {
      window.removeEventListener(
        "newsUpdated" as any,
        handleNewsUpdate as EventListener
      );
    };
  }, []);
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Tin tức mới nhất
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {news.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative h-56 bg-gray-200">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback to hero.jpg if image fails to load
                    const target = e.target as HTMLImageElement;
                    const currentSrc = target.src;
                    const fallbackSrc = "/hero.jpg";
                    if (!currentSrc.includes("hero.jpg")) {
                      target.src = fallbackSrc;
                    }
                  }}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">{item.date}</span>
                  <Link
                    href={`/news/${item.id}`}
                    className="text-green-600 font-medium hover:text-green-700 flex items-center"
                  >
                    Xem thêm
                    <svg
                      className="w-5 h-5 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
