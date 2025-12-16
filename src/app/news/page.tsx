"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NewsSection from "@/components/home/NewsSection";

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <NewsSection />
      </main>
      <Footer />
    </div>
  );
}
