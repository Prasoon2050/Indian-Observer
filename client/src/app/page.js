'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPublishedNews } from '@/lib/api';

/* ---------- HELPERS ---------- */

const cleanTitle = (text = '') => {
  return text.replace(/^Trending:\s*/i, '');
};

const CategoryBadge = ({ category }) => {
  const blueCategories = ['Business', 'Tech', 'Politics', 'Sports', 'World'];
  if (!category) return null;

  return (
    <span className={`inline-block mb-2 text-[10px] font-bold uppercase tracking-widest ${
      blueCategories.includes(category) ? 'text-sky-600' : 'text-red-600'
    }`}>
      {category}
    </span>
  );
};

/* ---------- COMPONENTS ---------- */

const LatestTicker = ({ items = [] }) => {
  if (!items || items.length === 0) return null;
  const feed = items.concat(items);

  return (
    <div className="w-full overflow-hidden border-b bg-white">
      <style jsx global>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: inline-flex;
          gap: 3rem;
          align-items: center;
          padding: 0.6rem 1rem;
          animation: ticker 30s linear infinite;
          white-space: nowrap;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="relative">
        <div className="animate-ticker">
          {feed.map((item, idx) => (
            <Link
              key={`${item?._id}-${idx}`}
              href={`/story/${item?._id}`}
              className="text-xs font-bold text-gray-800 hover:text-blue-600 transition-colors uppercase tracking-tight"
            >
              • {cleanTitle(item?.title || item?.topic)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const CategorySection = ({ title, items }) => {
  if (!items || items.length === 0) return null;
  const lead = items[0];
  const side = items.slice(1, 5); // Taking up to 4 side stories

  return (
    <section className="mt-16 border-t pt-8">
      <h2 className="text-xl font-black uppercase mb-6 tracking-tighter italic border-b-4 border-black inline-block">
        {title}
      </h2>
      <div className="grid grid-cols-12 gap-8">
        {/* Main story on the left */}
        <div className="col-span-12 md:col-span-7 group">
          {lead?.imageUrl && (
            <img src={lead.imageUrl} className="w-full h-96 object-cover rounded-sm mb-4" alt="" />
          )}
          <CategoryBadge category={lead?.category} />
          <Link href={`/story/${lead?._id}`} className="block text-2xl font-bold hover:text-blue-600 leading-tight">
            {cleanTitle(lead?.title)}
          </Link>
          <p className="text-sm text-gray-600 mt-2 line-clamp-3">{lead?.summary}</p>
        </div>

        {/* Side stories with images on the right */}
        <div className="col-span-12 md:col-span-5 space-y-6">
          {side.map(item => (
            <div key={item._id} className="flex gap-4 border-b pb-4 last:border-0 items-start group">
              {item.imageUrl && (
                <div className="w-24 h-16 flex-shrink-0 overflow-hidden rounded-sm">
                  <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt="" />
                </div>
              )}
              <div className="flex-1">
                <CategoryBadge category={item.category} />
                <Link href={`/story/${item._id}`} className="text-sm font-bold hover:text-blue-700 leading-snug block line-clamp-2">
                  {cleanTitle(item.title)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ---------- MAIN PAGE ---------- */

export default function Home() {
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getPublishedNews();
        setLatest(data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold uppercase tracking-widest">Loading The Observer...</p>
      </div>
    );
  }

  // Data Distribution for Hero Section
  const leadStory = latest[0];
  const leftSidebar = latest.slice(1, 6);
  const rightSidebar = latest.slice(6, 12);
  const subHero = latest.slice(12, 14);

  return (
    <div className="bg-[#fcfcfc] min-h-screen text-[#121212]">
      <LatestTicker items={latest.slice(0, 10)} />

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8">
        
        {/* TOP TRIPLE-COLUMN GRID */}
        <div className="grid grid-cols-12 gap-8 mb-12">
          
          {/* 1. LEFT COLUMN: TOP STORIES */}
          <aside className="col-span-12 md:col-span-2 space-y-8 border-r pr-6 border-gray-200">
            <h3 className="text-[11px] font-black uppercase border-b-2 border-black pb-1 mb-4">Top Stories</h3>
            {leftSidebar.map((item) => (
              <article key={item._id} className="group pb-4 border-b last:border-0 border-gray-100">
                <CategoryBadge category={item.category} />
                <Link href={`/story/${item._id}`} className="block text-sm font-bold leading-snug group-hover:text-red-600 transition-colors">
                  {cleanTitle(item.title)}
                </Link>
              </article>
            ))}
          </aside>

          {/* 2. CENTER COLUMN: MAIN FEATURE */}
          <section className="col-span-12 md:col-span-7 px-2">
            {leadStory && (
              <article className="mb-12 border-b border-gray-200 pb-10">
                <Link href={`/story/${leadStory._id}`}>
                  <h1 className="text-4xl md:text-5xl font-black leading-[1.1] mb-6 hover:text-gray-800 transition-colors tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                    {cleanTitle(leadStory.title)}
                  </h1>
                </Link>

                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100 mb-6 shadow-sm">
                  {leadStory.imageUrl && (
                    <img src={leadStory.imageUrl} className="w-full h-full object-cover" alt="" />
                  )}
                </div>

                <div className="flex gap-8">
                  <div className="flex-1">
                    <p className="text-lg leading-relaxed text-gray-800 font-medium">
                      {leadStory.summary}
                    </p>
                    <Link href={`/story/${leadStory._id}`} className="inline-block mt-4 text-sm font-bold border-b-2 border-red-600 pb-0.5 hover:text-red-600">
                      Read Full Story
                    </Link>
                  </div>
                </div>
              </article>
            )}

            {/* SUB-HERO HORIZONTAL LIST */}
            <div className="grid grid-cols-2 gap-8">
              {subHero.map(item => (
                <div key={item._id} className="group">
                  <div className="w-full h-40 overflow-hidden mb-3">
                    <img src={item.imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="" />
                  </div>
                  <Link href={`/story/${item._id}`} className="text-lg font-bold leading-tight hover:underline">
                    {cleanTitle(item.title)}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* 3. RIGHT COLUMN: LATEST UPDATES ONLY */}
          <aside className="col-span-12 md:col-span-3 space-y-10 border-l pl-6 border-gray-200">
            <section>
              <h3 className="text-[11px] font-black uppercase border-b-2 border-black pb-1 mb-4">Latest Updates</h3>
              <div className="space-y-6">
                {rightSidebar.map((item) => (
                  <article key={item._id} className="group border-b border-gray-100 pb-4 last:border-0">
                    <Link href={`/story/${item._id}`} className="block">
                      <p className="text-sm font-bold leading-tight group-hover:text-blue-700">
                        {cleanTitle(item.title)}
                      </p>
                      <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 inline-block">{item.category}</span>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          </aside>
        </div>

        {/* CATEGORY SUBSECTIONS */}
        <CategorySection title="Politics" items={latest.filter(n => n.category === 'Politics')} />
        <CategorySection title="World" items={latest.filter(n => n.category === 'World')} />
        <CategorySection title="Business" items={latest.filter(n => n.category === 'Business')} />
        <CategorySection title="Tech" items={latest.filter(n => n.category === 'Tech')} />
        <CategorySection title="Sports" items={latest.filter(n => n.category === 'Sports')} />

        <footer className="mt-20 pt-12 border-t border-black text-center">
          <h2 className="text-3xl font-black mb-2 italic" style={{ fontFamily: 'Georgia, serif' }}>The Indian Observer</h2>
          <p className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-8">Established 2026 • Quality Journalism</p>
          <div className="flex justify-center gap-6 text-[10px] font-bold uppercase text-gray-400">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Advertising</a>
            <a href="#">Contact</a>
          </div>
          <p className="mt-8 text-[10px] text-gray-400 pb-12">© {new Date().getFullYear()} The Indian Observer</p>
        </footer>
      </main>
    </div>
  );
}