'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getNewsById, getPublishedNews } from '@/lib/api';
const cleanTitle = (text = '') => {
  return text.replace(/^Trending:\s*/i, '');
};

const formatDate = (value) => {
  if (!value) return 'Just now';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'Just now';
  }
};

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [story, setStory] = useState(null);
  const [allNews, setAllNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const storyId = useMemo(() => params?.id, [params]);

  useEffect(() => {
    if (!storyId) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [storyRes, newsRes] = await Promise.all([
          getNewsById(storyId),
          getPublishedNews(),
        ]);
        if (!cancelled) {
          setStory(storyRes.data);
          setAllNews(newsRes.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to load story.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => (cancelled = true);
  }, [storyId]);

  const relatedNews = useMemo(() => {
    if (!story) return [];
    const category = story.category || story.tags?.[0] || '';
    return allNews
      .filter(
        (n) =>
          n._id !== story._id &&
          (n.category || n.tags?.[0] || '').toLowerCase() ===
            category.toLowerCase()
      )
      .slice(0, 4);
  }, [story, allNews]);

  const heroImage =
    story?.imageUrl || story?.sourceOptions?.[0]?.imageUrl || null;

  if (loading) {
    return <p className="px-6 py-10">Loading story…</p>;
  }

  if (error || !story) {
    return (
      <div className="px-6 py-10">
        <p className="mb-4">{error || 'Story not found.'}</p>
        <button
          onClick={() => router.push('/')}
          className="border px-4 py-2 text-sm"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-6">
      {/* ARTICLE HEADER */}
      <header className="max-w-3xl mb-6">
        <p className="text-xs uppercase text-gray-500">
          {story.category || 'Latest'}
        </p>
        <h1 className="text-3xl font-semibold leading-snug mt-2">
          {cleanTitle(story?.title || story?.topic)}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          {formatDate(story.publishedAt || story.generatedAt)}
        </p>
      </header>

      {/* HERO IMAGE */}
      {heroImage && (
        <img
          src={heroImage}
          alt={story.title || story.topic}
          className="w-full max-h-[420px] object-cover mb-8"
        />
      )}

      {/* CONTENT GRID */}
      <section className="grid grid-cols-12 gap-8">
        {/* MAIN STORY */}
        <article className="col-span-8">
          <h2 className="text-lg font-medium mb-3">Observer Summary</h2>

          <p className="text-lg leading-relaxed mb-6">
            {story.summary}
          </p>

          {story.content && (
            <>
              <h3 className="text-lg font-medium mb-3">
                In-depth Analysis
              </h3>
              <div className="space-y-4 text-base leading-relaxed">
                {story.content
                  .split(/\n{2,}/)
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>
            </>
          )}
        </article>

        {/* SIDEBAR */}
        <aside className="col-span-4">
          <h3 className="text-sm font-semibold mb-4 border-b pb-2">
            Related News
          </h3>

          <div className="space-y-4">
            {relatedNews.map((item) => (
              <Link
                key={item._id}
                href={`/story/${item._id}`}
                className="block hover:underline"
              >
                <p className="text-xs uppercase text-gray-500">
                  {item.category || 'Latest'}
                </p>
                <p className="font-medium">
                  {cleanTitle(item?.title || item?.topic)}
                </p>
              </Link>
            ))}

            {relatedNews.length === 0 && (
              <p className="text-sm text-gray-500">
                No related stories.
              </p>
            )}
          </div>
        </aside>
      </section>

      {/* FOOTER */}
      <footer className="mt-10">
        <Link
          href="/"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Back to Home
        </Link>
      </footer>
    </main>
  );
}



