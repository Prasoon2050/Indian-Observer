'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getNewsById } from '@/lib/api';

const formatDate = (value) => {
  if (!value) return 'Just now';
  try {
    return new Date(value).toLocaleString();
  } catch {
    return 'Just now';
  }
};

const buildRelatedArticles = (options = []) =>
  options.map((option, index) => ({
    id: `${option.link || option.title || 'source'}-${index}`,
    title: option.title || option.source || 'Source coverage',
    snippet: option.snippet || 'Source snippet unavailable.',
    source: option.source || 'Unknown outlet',
    link: option.link || option.news_url || null,
    imageUrl: option.imageUrl || null,
    publishedAt: option.publishedAt || null,
  }));

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const storyId = useMemo(() => params?.id, [params]);

  useEffect(() => {
    if (!storyId) return;
    let cancelled = false;

    const fetchStory = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await getNewsById(storyId);
        if (!cancelled) {
          setStory(data);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err.response?.data?.message ||
            'We could not load this story. Please try again later.';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchStory();

    return () => {
      cancelled = true;
    };
  }, [storyId]);

  const relatedArticles = useMemo(
    () => buildRelatedArticles(story?.sourceOptions),
    [story?.sourceOptions]
  );

  const heroImage = story?.imageUrl || story?.sourceOptions?.[0]?.imageUrl || null;

  if (!storyId) {
    return (
      <section className="story-detail">
        <p>Missing story identifier.</p>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="story-detail">
        <p>Loading story...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="story-detail">
        <p className="story-detail__error">{error}</p>
        <button type="button" className="btn" onClick={() => router.push('/')}>
          Go back home
        </button>
      </section>
    );
  }

  if (!story) {
    return (
      <section className="story-detail">
        <p>Story not found.</p>
      </section>
    );
  }

  return (
    <section className="story-detail">
      <header className="story-detail__header">
        <div>
          <p className="story-detail__category">{story.category || 'Latest'}</p>
          <h1>{story.title || story.topic}</h1>
          <p className="story-detail__timestamp">{formatDate(story.publishedAt || story.generatedAt)}</p>
        </div>
        <div className="story-detail__tags">
          {(story.tags || []).map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </header>

      {heroImage && (
        <div
          className="story-detail__hero"
          style={{ backgroundImage: `url(${heroImage})` }}
          role="img"
          aria-label={story.title || story.topic}
        />
      )}

      <article className="story-detail__body">
        <h2>Observer Summary</h2>
        <p className="story-detail__summary">{story.summary}</p>

        {story.content && (
          <section className="story-detail__analysis">
            <h3>In-depth Analysis</h3>
            {story.content
              .split(/\n{2,}/)
              .map((block) => block.trim())
              .filter(Boolean)
              .map((block, index) => (
                <p key={index}>{block}</p>
              ))}
          </section>
        )}
      </article>

      <footer className="story-detail__footer">
        <Link href="/" className="btn secondary">
          ← Back to home
        </Link>
      </footer>
    </section>
  );
}


