'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getNewsById, getPublishedNews } from '@/lib/api';

/* ---------- HELPERS ---------- */

const cleanTitle = (text = '') => text.replace(/^Trending:\s*/i, '');

const formatDate = (value) => {
  if (!value) return 'Just now';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Just now';
  }
};

const CATEGORY_COLORS = {
  Business:   'text-[#1A56C4] bg-blue-50',
  Tech:       'text-[#1A56C4] bg-blue-50',
  Technology: 'text-[#1A56C4] bg-blue-50',
  Politics:   'text-amber-700 bg-amber-50',
  Sports:     'text-emerald-700 bg-emerald-50',
  World:      'text-violet-700 bg-violet-50',
};

const CategoryPill = ({ category }) => {
  if (!category) return null;
  const colors = CATEGORY_COLORS[category] ?? 'text-[#1A56C4] bg-blue-50';
  return (
    <span className={`inline-block text-[10px] font-black uppercase tracking-widest px-3 py-1 ${colors}`}>
      {category}
    </span>
  );
};

/* ---------- LEGAL CONTENT (shared with home page) ---------- */

const LEGAL = {
  disclaimer: {
    title: 'Disclaimer',
    body: `The content published on this website is generated and/or assisted entirely by artificial intelligence and is provided for informational purposes only. While we make reasonable efforts to ensure the correctness, accuracy, and timeliness of the information presented, we do not guarantee the completeness, reliability, or current validity of any content.

The information provided on this website should not be considered professional, legal, financial, or investment advice. Users are strongly encouraged to independently verify information before making any decisions based on the content available here.

All images displayed on this website are selected from publicly available sources on the internet. We do not claim ownership or copyright over any third-party images unless explicitly stated. All rights belong to their respective owners. If you believe any image infringes upon your copyright, please contact us for prompt review and appropriate action.

All content on this platform is AI-generated and is not intended to harm, defame, misrepresent, or offend any individual, organization, community, or group within society. Any resemblance to real events, persons, or entities is purely coincidental and unintentional.

We shall not be held responsible for any losses, damages, or actions taken based on the information provided on this website.`,
  },
  privacy: {
    title: 'Privacy Policy',
    body: `Effective Date: 17/02/2026 | Last Updated: 17/02/2026

1. Introduction
Welcome to Bharat News Narratives ("Company", "we", "our", "us"). We respect your privacy and are committed to protecting your personal data in accordance with applicable laws in India, including the Digital Personal Data Protection Act, 2023 (DPDP Act). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit or use our website.

2. Information We Collect
A. Information You Provide Voluntarily
If you choose to create an account or contact us, we may collect: Name, Email address, Username and password, and any information submitted through contact forms. Account creation is optional. You may browse most content without registering.

B. Automatically Collected Information
When you access our website, we may automatically collect: IP address, browser type and device information, operating system, pages visited, date and time of visit, and referring website. This information is used for analytics, performance improvement, and security monitoring.

3. Purpose of Data Collection
We collect and process personal data to: create and manage user accounts, provide access to website features, respond to inquiries or support requests, improve website functionality and user experience, ensure security and prevent misuse, and send newsletters or updates (if you subscribe).

4. Legal Basis for Processing
Under applicable Indian data protection law, we process personal data based on your consent, legitimate use for website functionality, and compliance with legal obligations.

5. AI-Generated Content
Our platform publishes content generated and/or assisted by artificial intelligence. We do not sell personal data to third parties or use personal information to train external AI models without consent.

6. Cookies and Tracking Technologies
We may use cookies and similar technologies to enhance user experience, analyze website traffic, maintain login sessions, and improve content personalization.

7. Data Sharing and Disclosure
We do not sell personal data. We may share limited data with hosting providers, analytics providers, and legal authorities if required by law.

8. Data Retention
We retain personal data only as long as necessary to provide services, fulfill legal obligations, and resolve disputes.

9. Your Rights Under Indian Law
Under the DPDP Act, you may have the right to: access your personal data, request correction of inaccurate data, request erasure, withdraw consent, and nominate another person to exercise your rights. Contact: bharatnewsnarratives@gmail.com

10. Data Security
We implement reasonable technical and organizational safeguards to protect personal data. However, no online transmission method is completely secure.

11. Children's Privacy
Our website is not intended for individuals under 18 years of age.

12. Updates to This Policy
We may update this Privacy Policy from time to time. Changes will be posted with a revised "Last Updated" date.`,
  },
  terms: {
    title: 'Terms of Service',
    body: `1. Acceptance of Terms
Welcome to Bharat News Narratives. By accessing or using this website, you agree to be bound by these Terms of Service. These Terms are governed by the laws of India.

2. Description of Service
Bharat News Narratives is an AI-powered news and information platform. All content is provided for informational purposes only. We reserve the right to modify, suspend, or discontinue any part of the Platform at any time without prior notice.

3. Eligibility
By using this Platform, you confirm that you are at least 18 years of age or accessing under parental supervision, and that you are legally capable of entering into a binding agreement under Indian law.

4. User Accounts
Account creation is optional. If you create an account, you are responsible for maintaining confidentiality of your login credentials and all activities under your account.

5. Acceptable Use
You agree not to: use the Platform for any unlawful purpose, attempt to hack or damage the website, upload malicious code, copy or scrape content at scale without written permission, or post defamatory or misleading content.

6. AI-Generated Content
The Platform publishes AI-assisted content. We do not guarantee that content is error-free or up to date. Content should not be considered professional, legal, financial, or investment advice.

7. Intellectual Property
All original text content, branding, logos, and website design elements are owned by the Platform. Unauthorized reproduction or commercial use is prohibited.

8. Third-Party Links
The Platform may contain links to third-party websites. We are not responsible for the content or policies of external sites.

9. Limitation of Liability
Bharat News Narratives shall not be liable for any direct, indirect, incidental, or consequential damages arising from use of this Platform.

10. Indemnification
You agree to indemnify and hold harmless Bharat News Narratives from any claims arising from your use of the Platform or violation of these Terms.

11. Termination
We reserve the right to suspend or terminate access without notice if these Terms are violated.

12. Governing Law and Jurisdiction
These Terms are governed by the laws of India. Disputes are subject to the exclusive jurisdiction of courts in Warangal, India.

13. Changes to Terms
Continued use of the Platform after updates constitutes acceptance of the revised Terms.`,
  },
};

/* ---------- LEGAL MODAL ---------- */

const LegalModal = ({ doc, onClose }) => {
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="relative bg-white w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border-t-4 border-[#1A56C4]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-[#f8faff]">
          <h2 className="text-lg font-black uppercase tracking-tight text-[#1A56C4]" style={{ fontFamily: 'Georgia, serif' }}>
            {doc.title}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 hover:bg-[#1A56C4] hover:text-white text-gray-500 transition-colors text-lg font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-6 text-sm text-gray-700 leading-relaxed space-y-4">
          {doc.body.split('\n\n').map((para, i) => (
            <p key={i} className={para.match(/^\d+\./) ? 'font-bold text-[#121212] mt-4' : ''}>
              {para}
            </p>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-blue-100 bg-[#f8faff] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#1A56C4] text-white text-xs font-black uppercase tracking-widest hover:bg-[#1248A8] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- SHARED FOOTER ---------- */

const SiteFooter = ({ onOpenModal }) => (
  <footer className="mt-20 pt-12 border-t-4 border-[#1A56C4] text-center bg-[#f8faff]">
    <div className="flex items-center justify-center gap-3 mb-2">
      <svg width="36" height="36" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#1A56C4" />
        <text x="50" y="54" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="30" fontWeight="900" fontFamily="Georgia,serif" letterSpacing="1">BNN</text>
        <line x1="18" y1="62" x2="82" y2="62" stroke="white" strokeWidth="1.2" />
        <text x="50" y="74" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="7" fontFamily="Georgia,serif">Bharat News Narratives</text>
      </svg>
      <h2 className="text-2xl font-black italic text-[#1A56C4]" style={{ fontFamily: 'Georgia, serif' }}>
        Bharat News Narratives
      </h2>
    </div>
    <p className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-8">
      Established 2026 • Independent · Insightful · Indian
    </p>
    <div className="flex justify-center flex-wrap gap-6 text-[10px] font-bold uppercase text-gray-400 mb-4">
      <button onClick={() => onOpenModal('disclaimer')} className="hover:text-[#1A56C4] transition-colors cursor-pointer">Disclaimer</button>
      <button onClick={() => onOpenModal('privacy')} className="hover:text-[#1A56C4] transition-colors cursor-pointer">Privacy Policy</button>
      <button onClick={() => onOpenModal('terms')} className="hover:text-[#1A56C4] transition-colors cursor-pointer">Terms of Service</button>
      <a href="mailto:bharatnewsnarratives@gmail.com" className="hover:text-[#1A56C4] transition-colors">Contact</a>
    </div>
    <p className="mt-6 text-[10px] text-gray-400 pb-12">
      © {new Date().getFullYear()} Bharat News Narratives. All content is AI-generated for informational purposes only.
    </p>
  </footer>
);

/* ---------- MAIN STORY PAGE ---------- */

export default function StoryDetailPage() {
  const params = useParams();
  const router = useRouter();

  const [story, setStory] = useState(null);
  const [allNews, setAllNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeModal, setActiveModal] = useState(null);

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
      } catch {
        if (!cancelled) setError('Unable to load story.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [storyId]);

  const relatedNews = useMemo(() => {
    if (!story) return [];
    const category = story.category || story.tags?.[0] || '';
    return allNews
      .filter(n => n._id !== story._id && (n.category || n.tags?.[0] || '').toLowerCase() === category.toLowerCase())
      .slice(0, 5);
  }, [story, allNews]);

  const heroImage = story?.imageUrl || story?.sourceOptions?.[0]?.imageUrl || null;

  /* --- LOADING --- */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#f0f5ff]">
        <div className="w-10 h-10 border-4 border-[#1A56C4] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-[#1A56C4]">Loading Story…</p>
      </div>
    );
  }

  /* --- ERROR --- */
  if (error || !story) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-6 bg-[#f8faff] px-6">
        <div className="w-1 h-16 bg-[#1A56C4]" />
        <p className="text-lg font-bold text-gray-700">{error || 'Story not found.'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-[#1A56C4] text-white text-xs font-black uppercase tracking-widest hover:bg-[#1248A8] transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    );
  }

  /* --- STORY --- */
  return (
    <div className="bg-[#f8faff] min-h-screen text-[#121212]">

      {/* Legal Modal */}
      {activeModal && (
        <LegalModal doc={LEGAL[activeModal]} onClose={() => setActiveModal(null)} />
      )}

      {/* ── Breadcrumb bar ── */}
      <div className="bg-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          <Link href="/" className="hover:text-[#1A56C4] transition-colors">Home</Link>
          <span className="text-blue-200">›</span>
          {story.category && (
            <>
              <span className="text-[#1A56C4]">{story.category}</span>
              <span className="text-blue-200">›</span>
            </>
          )}
          <span className="text-gray-400 truncate max-w-xs">{cleanTitle(story.title || story.topic)}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10">

        {/* ── ARTICLE HEADER ── */}
        <header className="max-w-3xl mb-8">
          <CategoryPill category={story.category || 'Latest'} />

          <h1
            className="text-3xl md:text-5xl font-black leading-[1.1] mt-4 mb-4 tracking-tight"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            {cleanTitle(story?.title || story?.topic)}
          </h1>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-1 bg-[#1A56C4] rounded-full" />
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {formatDate(story.publishedAt || story.generatedAt)}
            </p>
          </div>
        </header>

        {/* ── HERO IMAGE ── */}
        {heroImage && (
          <div className="relative w-full max-h-[480px] overflow-hidden mb-10 shadow-md">
            <img
              src={heroImage}
              alt={story.title || story.topic}
              className="w-full max-h-[480px] object-cover"
            />
            {/* Blue gradient at bottom of hero */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#1A56C4] opacity-20 pointer-events-none" />
          </div>
        )}

        {/* ── CONTENT GRID ── */}
        <section className="grid grid-cols-12 gap-10">

          {/* MAIN ARTICLE */}
          <article className="col-span-12 md:col-span-8">

            {/* Summary block */}
            <div className="border-l-4 border-[#1A56C4] pl-5 mb-8 bg-white py-4 pr-4 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#1A56C4] mb-2">BNN Summary</p>
              <p className="text-lg leading-relaxed text-gray-800 font-medium">
                {story.summary}
              </p>
            </div>

            {/* Full content */}
            {story.content && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1.5 h-6 bg-[#1A56C4] rounded-full" />
                  <h2 className="text-lg font-black uppercase tracking-tight text-[#121212]">
                    In-Depth Analysis
                  </h2>
                </div>
                <div className="space-y-5 text-base leading-[1.85] text-gray-700">
                  {story.content
                    .split(/\n{2,}/)
                    .map((p) => p.trim())
                    .filter(Boolean)
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
              </div>
            )}
          </article>

          {/* SIDEBAR */}
          <aside className="col-span-12 md:col-span-4">

            {/* Related News */}
            <div className="bg-white border border-blue-100 shadow-sm mb-6">
              <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-[#1A56C4] bg-[#f8faff]">
                <div className="w-1 h-5 bg-[#1A56C4] rounded-full" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1A56C4]">
                  Related Stories
                </h3>
              </div>

              <div className="divide-y divide-blue-50">
                {relatedNews.length > 0 ? relatedNews.map((item) => (
                  <Link
                    key={item._id}
                    href={`/story/${item._id}`}
                    className="flex gap-3 items-start p-4 group hover:bg-blue-50 transition-colors"
                  >
                    {item.imageUrl && (
                      <div className="w-16 h-12 flex-shrink-0 overflow-hidden">
                        <img
                          src={item.imageUrl}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          alt=""
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#1A56C4] mb-1">
                        {item.category || 'Latest'}
                      </p>
                      <p className="text-sm font-bold leading-snug group-hover:text-[#1A56C4] transition-colors line-clamp-2">
                        {cleanTitle(item?.title || item?.topic)}
                      </p>
                    </div>
                  </Link>
                )) : (
                  <p className="text-sm text-gray-400 p-4">No related stories found.</p>
                )}
              </div>
            </div>

            {/* Back to Home CTA */}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3 bg-[#1A56C4] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#1248A8] transition-colors"
            >
              ← Back to Home
            </Link>
          </aside>
        </section>
      </main>

      {/* ── SITE FOOTER ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <SiteFooter onOpenModal={setActiveModal} />
      </div>
    </div>
  );
}



