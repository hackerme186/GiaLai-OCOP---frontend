"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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

export default function NewsDetailPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const newsId = useMemo(() => {
    if (Array.isArray(idParam)) return Number(idParam[0]);
    return Number(idParam);
  }, [idParam]);

  const [newsItem, setNewsItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const loadNews = () => {
      try {
        const stored =
          typeof window !== "undefined"
            ? localStorage.getItem(STORAGE_KEY)
            : null;
        const list: NewsItem[] =
          stored && Array.isArray(JSON.parse(stored))
            ? (JSON.parse(stored) as NewsItem[])
            : defaultNews;

        const found = list.find((n) => n.id === newsId);
        setNewsItem(found || null);
      } catch {
        setNewsItem(null);
      } finally {
        setLoading(false);
      }
    };

    if (!Number.isNaN(newsId)) {
      loadNews();
    } else {
      setLoading(false);
    }
  }, [newsId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải tin tức...</p>
        </div>
      </div>
    );
  }

  if (!newsItem) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-xl font-semibold text-gray-900">
            Không tìm thấy tin tức
          </p>
          <button
            onClick={() => router.replace("/news")}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Quay lại trang tin tức
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="mb-6 text-sm text-gray-600 flex items-center gap-2">
          <Link href="/" className="hover:text-indigo-600">
            Trang chủ
          </Link>
          <span>/</span>
          <Link href="/news" className="hover:text-indigo-600">
            Tin tức
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium line-clamp-1">
            {newsItem.title}
          </span>
        </nav>

        <article className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{newsItem.title}</h1>
          <p className="text-sm text-gray-500">{newsItem.date}</p>

          <div className="relative w-full h-80 rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={newsItem.image || "/hero.jpg"}
              alt={newsItem.title}
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("hero.jpg")) {
                  target.src = "/hero.jpg";
                }
              }}
            />
          </div>

          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {newsItem.description}
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
