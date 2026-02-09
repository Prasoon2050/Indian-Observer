'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPublishedNews } from '@/lib/api';

/* ---------- helper to remove "Trending:" prefix ---------- */
const cleanTitle = (text = '') => {
  return text.replace(/^Trending:\s*/i, '');
};

/* ---------- CATEGORY BADGE (rounded light-blue for specific categories) ---------- */
const CategoryBadge = ({ category }) => {
  const blueCategories = ['Business', 'Tech', 'Politics', 'Sports', 'World'];

  if (!category) return null;

  if (blueCategories.includes(category)) {
    return (
      <span className="inline-block mb-2 px-3 py-1 text-xs font-semibold rounded-full bg-sky-400 text-white">
        {category}
      </span>
    );
  }

  return (
    <p className="text-xs uppercase text-gray-500 tracking-wider mb-2">
      {category}
    </p>
  );
};

/* ---------- AUTO SCROLLING LATEST BAR (seamless loop, pause on hover) ---------- */
const LatestTicker = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  // duplicate items for seamless scroll
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
          padding: 0.5rem 1rem;
          animation: ticker 28s linear infinite;
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
              key={`${item?._id ?? 'x'}-${idx}`}
              href={`/story/${item?._id}`}
              className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors"
            >
              • {cleanTitle(item?.title || item?.topic || 'Untitled')}
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
  const side = items.slice(1, 6);

  return (
    <section id={title.toLowerCase()} className="mt-16 opacity-0 animate-fadeIn" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
      <div className="mb-6 bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 h-0.5" />

      <p className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-900">
        {title}
      </p>

      <div className="grid grid-cols-12 gap-8">
        {/* LEFT BIG STORY */}
        <div className={`${side.length > 0 ? 'col-span-7' : 'col-span-12'} group`}>
          {lead?.imageUrl && (
            <div className="overflow-hidden rounded-2xl mb-5 relative">
              <img
                src={lead.imageUrl}
                alt={lead.title}
                className="w-full h-96 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          )}

          <CategoryBadge category={lead?.category} />

          <Link
            href={`/story/${lead._id}`}
            className="block text-2xl font-bold leading-snug hover:text-blue-600 transition-colors duration-300"
          >
            {cleanTitle(lead?.title || lead?.topic)}
          </Link>

          {lead.summary && (
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              {lead.summary}
            </p>
          )}

          <Link
            href={`/story/${lead._id}`}
            className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-blue-600 hover:gap-3 transition-all duration-300"
          >
            Continue Reading
            <span className="inline-block transition-transform duration-300">→</span>
          </Link>
        </div>

        {/* RIGHT SIDE */}
        {side.length > 0 && (
          <div className="col-span-5 space-y-6">
            {side.map((item, idx) => (
              <div key={item._id} className="flex gap-4 group opacity-0 animate-fadeIn" style={{ animationDelay: `${0.1 * idx}s`, animationFillMode: 'forwards' }}>
                {item.imageUrl && (
                  <div className="overflow-hidden rounded-xl flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-40 h-28 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                )}

                <div>
                  <CategoryBadge category={item.category} />

                  <Link
                    href={`/story/${item._id}`}
                    className="block font-semibold text-base leading-snug hover:text-blue-600 transition-colors duration-300"
                  >
                    {cleanTitle(item?.title || item?.topic)}
                  </Link>

                  {item.summary && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                      {item.summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

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
      <div className="px-6 py-10 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 animate-pulse">Loading latest stories…</p>
        </div>
      </div>
    );
  }

  const lead = latest[0];
  const relatedTwo = latest.slice(1, 3);
  const latestList = latest.slice(3, 9);
  const bottomStories = latest.slice(9, 13);

  return (
    <>
      {/* Auto-scrolling ticker placed below the navbar */}
      <LatestTicker items={latest.slice(0, 8)} />

      <main className="max-w-7xl mx-auto px-6 py-10">
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
          }
          .animate-slideIn {
            animation: slideIn 0.8s ease-out;
          }
        `}</style>

        <div className="grid grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <section className="col-span-7">
            {lead && (
              <div className="mb-6 group animate-fadeIn">
                <div className="relative w-full aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100 shadow-lg hover:shadow-2xl transition-shadow duration-500">
                  {lead.imageUrl ? (
                    <img
                      src={lead.imageUrl}
                      alt={cleanTitle(lead.title || lead.topic)}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 mb-6 animate-slideIn">
              <CategoryBadge category={lead?.category} />

              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
                <Link href={`/story/${lead?._id}`} className="hover:text-blue-600 transition-colors duration-300">
                  {cleanTitle(lead?.title || lead?.topic)}
                </Link>
              </h1>

              <p className="text-gray-700 leading-relaxed">
                {lead?.summary || 'Summary not available.'}
              </p>

              <Link
                href={`/story/${lead?._id}`}
                className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-blue-600 hover:gap-3 transition-all duration-300"
              >
                Continue Reading
                <span className="inline-block transition-transform duration-300">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {relatedTwo.map((item, idx) => (
                <article key={item._id} className="group opacity-0 animate-fadeIn" style={{ animationDelay: `${0.2 + idx * 0.1}s`, animationFillMode: 'forwards' }}>
                  <div className="w-full h-44 overflow-hidden rounded-2xl bg-gray-100 shadow-md hover:shadow-xl transition-all duration-500">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={cleanTitle(item.title || item.topic)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                    )}
                  </div>

                  <CategoryBadge category={item.category} />

                  <Link
                    href={`/story/${item._id}`}
                    className="block font-semibold leading-snug hover:text-blue-600 transition-colors duration-300"
                  >
                    {cleanTitle(item.title || item.topic)}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          {/* RIGHT COLUMN — LATEST GRID */}
          <aside className="col-span-5">
            <div className="mb-4 animate-slideIn">
              <h2 className="text-sm font-semibold uppercase tracking-wider">Latest</h2>
              <p className="text-sm text-gray-500">All categories</p>
            </div>

            {/* TOP ROW */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {latest.slice(1, 3).map((item, idx) => (
                <article key={item._id} className="group opacity-0 animate-fadeIn" style={{ animationDelay: `${0.3 + idx * 0.1}s`, animationFillMode: 'forwards' }}>
                  <div className="h-44 overflow-hidden rounded-2xl bg-gray-100 mb-2 shadow-md hover:shadow-xl transition-all duration-500">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={cleanTitle(item.title || item.topic)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                    )}
                  </div>

                  <CategoryBadge category={item.category} />

                  <Link
                    href={`/story/${item._id}`}
                    className="block font-semibold leading-snug hover:text-blue-600 transition-colors duration-300"
                  >
                    {cleanTitle(item.title || item.topic)}
                  </Link>
                </article>
              ))}
            </div>

            {/* GRID AREA */}
            <div className="grid grid-cols-2 gap-6">
              {latestList.map((item, idx) => (
                <article key={item._id} className="group opacity-0 animate-fadeIn" style={{ animationDelay: `${0.4 + idx * 0.05}s`, animationFillMode: 'forwards' }}>
                  <div className="h-36 overflow-hidden rounded-2xl bg-gray-100 mb-2 shadow-md hover:shadow-xl transition-all duration-500">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={cleanTitle(item.title || item.topic)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                    )}
                  </div>

                  <CategoryBadge category={item.category} />

                  <Link
                    href={`/story/${item._id}`}
                    className="block font-medium leading-snug hover:text-blue-600 transition-colors duration-300"
                  >
                    {cleanTitle(item.title || item.topic)}
                  </Link>
                </article>
              ))}
            </div>
          </aside>
        </div>

        {bottomStories.length > 0 && (
          <section className="mt-16 border-t pt-10 opacity-0 animate-fadeIn" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <h2 className="text-lg font-bold mb-6">
              More news for you
            </h2>

            <div className="grid grid-cols-4 gap-6">
              {bottomStories.map((item, idx) => (
                <article key={item._id} className="group opacity-0 animate-fadeIn" style={{ animationDelay: `${0.6 + idx * 0.1}s`, animationFillMode: 'forwards' }}>
                  <div className="h-44 mb-3 overflow-hidden rounded-2xl bg-gray-100 shadow-md hover:shadow-xl transition-all duration-500">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                    )}
                  </div>

                  <CategoryBadge category={item.category} />

                  <Link
                    href={`/story/${item._id}`}
                    className="block font-semibold hover:text-blue-600 transition-colors duration-300"
                  >
                    {cleanTitle(item.title || item.topic)}
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        <CategorySection title="Politics" items={latest.filter(n => n.category === 'Politics')} />
        <CategorySection title="World" items={latest.filter(n => n.category === 'World')} />
        <CategorySection title="Business" items={latest.filter(n => n.category === 'Business')} />
        <CategorySection title="Tech" items={latest.filter(n => n.category === 'Tech')} />
        <CategorySection title="Sports" items={latest.filter(n => n.category === 'Sports')} />

        <footer className="mt-24 border-t bg-gradient-to-b from-white to-gray-50">
          <div className="max-w-7xl mx-auto px-6 py-12">
            {/* TOP ROW */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* BRAND */}
              <div>
                <p
                  className="text-lg font-semibold text-gray-900"
                  style={{ fontFamily: 'Merriweather, serif' }}
                >
                  The Indian Observer
                </p>
                <p className="mt-1 text-sm text-gray-500 max-w-md">
                  Independent journalism with editorial clarity and public interest at its core.
                </p>
              </div>

              {/* FOOTER LINKS */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <a href="#" className="hover:text-black transition-colors duration-300">About</a>
                <a href="#" className="hover:text-black transition-colors duration-300">Contact</a>
                <a href="#" className="hover:text-black transition-colors duration-300">Privacy Policy</a>
                <a href="#" className="hover:text-black transition-colors duration-300">Terms of Service</a>
              </div>
            </div>

            {/* DIVIDER */}
            <div className="mt-10 border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-400">
                © {new Date().getFullYear()} The Indian Observer. All rights reserved.
              </p>

              <p className="text-xs text-gray-400">
                Built with integrity • India
              </p>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}








