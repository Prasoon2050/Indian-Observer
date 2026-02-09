'use client';

import Link from 'next/link';

const NewsCard = ({ item, children }) => {
  const storyHref = item._id ? `/story/${item._id}` : null;

  return (
    <article className="py-4 border-b last:border-b-0">
      {/* META */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span className="uppercase tracking-wider">
          {item.category || item.tags?.[0] || 'Latest'}
        </span>
        {item.publishedAt && (
          <time>{new Date(item.publishedAt).toLocaleDateString()}</time>
        )}
      </div>

      {/* HEADLINE */}
      {storyHref ? (
        <Link href={storyHref} className="hover:underline">
          <h3 className="text-lg font-medium leading-snug">
            {item.title || item.topic}
          </h3>
        </Link>
      ) : (
        <h3 className="text-lg font-medium leading-snug">
          {item.title || item.topic}
        </h3>
      )}

      {/* SNIPPET */}
      {item.summary && (
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
          {item.summary}
        </p>
      )}

      {/* CONTINUE READING */}
      {storyHref && (
        <Link
          href={storyHref}
          className="inline-block mt-2 text-sm font-medium text-blue-600 hover:underline"
        >
          Continue reading →
        </Link>
      )}

      {children && <div className="mt-3">{children}</div>}
    </article>
  );
};

export default NewsCard;



