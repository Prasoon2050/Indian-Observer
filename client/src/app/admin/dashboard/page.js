'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useAuth from '@/hooks/useAuth';
import {
  deleteNews,
  generateNews,
  getDrafts,
  publishNews,
  refreshTrending,
  refreshCategoryFeeds,
} from '@/lib/api';

const DashboardPage = () => {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [drafts, setDrafts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [generator, setGenerator] = useState({ topic: '', autoPublish: false });
  const [generateBusy, setGenerateBusy] = useState(false);
  const [generationNote, setGenerationNote] = useState('');

  const loadDrafts = async () => {
    const { data } = await getDrafts();
    setDrafts(data);
  };

  useEffect(() => {
    if (!loading) {
      if (!user) router.push('/admin/login');
      else if (user.role !== 'admin') router.push('/');
      else loadDrafts();
    }
  }, [user, loading]);

  const handleGenerateNews = async (e) => {
    e.preventDefault();
    if (!generator.topic.trim()) return;

    setGenerateBusy(true);
    setGenerationNote('Contacting sources and Gemini…');

    try {
      const { data } = await generateNews(generator);
      setGenerationNote(`Generated: ${data.article.title || data.article.topic}`);
      setGenerator({ topic: '', autoPublish: false });
      await loadDrafts();
    } catch (err) {
      setGenerationNote('Generation failed');
    } finally {
      setGenerateBusy(false);
    }
  };

  if (loading || !user || user.role !== 'admin') {
    return <p className="px-6 py-10">Validating admin session…</p>;
  }

  return (
    <main className="max-w-7xl mx-auto px-6 py-6">
      {/* HEADER */}
      <header className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-semibold">Admin Studio</h1>
        <p className="text-sm text-gray-600 mt-1">
          Generate, review, and publish newsroom content.
        </p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={async () => {
              setBusy(true);
              setStatus('Fetching trends…');
              await refreshTrending();
              await loadDrafts();
              setBusy(false);
            }}
            className="border px-3 py-1 text-sm hover:bg-gray-50"
            disabled={busy}
          >
            Fetch trends
          </button>

          <button
            onClick={async () => {
              setBusy(true);
              setStatus('Refreshing sections…');
              await refreshCategoryFeeds();
              await loadDrafts();
              setBusy(false);
            }}
            className="border px-3 py-1 text-sm hover:bg-gray-50"
            disabled={busy}
          >
            Refresh sections
          </button>

          <button
            onClick={logout}
            className="ml-auto border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Logout
          </button>
        </div>

        {status && <p className="text-xs text-gray-500 mt-2">{status}</p>}
      </header>

      {/* GENERATOR */}
      <section className="border-b pb-6 mb-6">
        <h2 className="text-lg font-medium mb-2">Generate story</h2>

        <form onSubmit={handleGenerateNews} className="flex gap-3 items-center">
          <input
            className="flex-1 border px-3 py-2 text-sm"
            placeholder="Topic or keyword (e.g. RBI interest rates)"
            value={generator.topic}
            onChange={(e) =>
              setGenerator((p) => ({ ...p, topic: e.target.value }))
            }
          />

          <label className="text-xs flex items-center gap-1">
            <input
              type="checkbox"
              checked={generator.autoPublish}
              onChange={(e) =>
                setGenerator((p) => ({ ...p, autoPublish: e.target.checked }))
              }
            />
            Auto-publish
          </label>

          <button
            disabled={generateBusy}
            className="border px-4 py-2 text-sm hover:bg-gray-50"
          >
            {generateBusy ? 'Generating…' : 'Generate'}
          </button>
        </form>

        {generationNote && (
          <p className="text-xs text-gray-500 mt-2">{generationNote}</p>
        )}
      </section>

      {/* DRAFT QUEUE */}
      <section>
        <h2 className="text-lg font-medium mb-4">Draft queue</h2>

        <div className="divide-y">
          {drafts.map((item) => (
            <div
              key={item._id}
              className="py-4 flex justify-between items-start"
            >
              <div>
                <p className="text-xs uppercase text-gray-500">
                  {item.category || 'General'}
                </p>
                <h3 className="font-medium">{item.title || item.topic}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {item.summary}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => publishNews(item._id).then(loadDrafts)}
                  className="border px-3 py-1 text-sm hover:bg-gray-50"
                  disabled={busy}
                >
                  Publish
                </button>
                <button
                  onClick={() => deleteNews(item._id).then(loadDrafts)}
                  className="border px-3 py-1 text-sm hover:bg-gray-50"
                  disabled={busy}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {drafts.length === 0 && (
          <p className="text-sm text-gray-500 mt-4">
            No drafts available.
          </p>
        )}
      </section>
    </main>
  );
};

export default DashboardPage;


