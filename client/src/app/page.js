'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getPublishedNews } from '@/lib/api';

/* ---------- HELPERS ---------- */

const cleanTitle = (text = '') => text.replace(/^Trending:\s*/i, '');

const CATEGORY_COLORS = {
  Business:   'text-[#1A56C4]',
  Tech:       'text-[#1A56C4]',
  Technology: 'text-[#1A56C4]',
  Politics:   'text-amber-600',
  Sports:     'text-emerald-600',
  World:      'text-violet-600',
};

const CategoryBadge = ({ category }) => {
  if (!category) return null;
  const color = CATEGORY_COLORS[category] ?? 'text-[#1A56C4]';
  return (
    <span className={`inline-block mb-1.5 text-[10px] font-black uppercase tracking-widest ${color}`}>
      {category}
    </span>
  );
};

/* ---------- LEGAL CONTENT ---------- */

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
We collect and process personal data to: create and manage user accounts, provide access to website features, respond to inquiries or support requests, improve website functionality and user experience, ensure security and prevent misuse, and send newsletters or updates (if you subscribe). We process personal data only for lawful purposes.

4. Legal Basis for Processing
Under applicable Indian data protection law, we process personal data based on your consent, legitimate use for website functionality, and compliance with legal obligations. By using our website or creating an account, you consent to the collection and use of your information as described in this policy.

5. AI-Generated Content
Our platform publishes content generated and/or assisted by artificial intelligence. User interaction data may be used internally to improve platform functionality and relevance. We do not sell personal data to third parties or use personal information to train external AI models without consent.

6. Cookies and Tracking Technologies
We may use cookies and similar technologies to enhance user experience, analyze website traffic, maintain login sessions, and improve content personalization. You may disable cookies through your browser settings; however, some features may not function properly.

7. Data Sharing and Disclosure
We do not sell personal data. We may share limited data with hosting providers (e.g., Cloudflare, Google Cloud), analytics providers, and legal authorities if required by law. All third-party service providers are expected to maintain reasonable data protection standards.

8. Data Retention
We retain personal data only as long as necessary to provide services, fulfill legal obligations, and resolve disputes. Users may request deletion of their accounts at any time.

9. Your Rights Under Indian Law
Under the DPDP Act, you may have the right to: access your personal data, request correction of inaccurate data, request erasure of your personal data, withdraw consent, and nominate another person to exercise your rights in case of incapacity or death. To exercise these rights, contact us at: bharatnewsnarratives@gmail.com

10. Data Security
We implement reasonable technical and organizational safeguards to protect personal data. However, no online transmission method is completely secure.

11. Children's Privacy
Our website is not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors.

12. Updates to This Policy
We may update this Privacy Policy from time to time. Changes will be posted with a revised "Last Updated" date.`,
  },

  terms: {
    title: 'Terms of Service',
    body: `1. Acceptance of Terms
Welcome to Bharat News Narratives ("Platform", "we", "our", "us"). By accessing or using this website, you agree to be bound by these Terms of Service ("Terms"). If you do not agree with these Terms, please discontinue use of the Platform immediately. These Terms are governed by the laws of India.

2. Description of Service
Bharat News Narratives is an AI-powered news and information platform that publishes content generated and/or assisted by artificial intelligence. All content is provided for informational purposes only. While we strive to ensure correctness and recency, we do not guarantee the completeness, reliability, or accuracy of any information published. We reserve the right to modify, suspend, or discontinue any part of the Platform at any time without prior notice.

3. Eligibility
By using this Platform, you confirm that you are at least 18 years of age, or accessing the Platform under parental or guardian supervision, and that you are legally capable of entering into a binding agreement under Indian law.

4. User Accounts
Account creation is optional. If you create an account, you are responsible for maintaining the confidentiality of your login credentials, you agree to provide accurate and up-to-date information, and you are responsible for all activities under your account. We reserve the right to suspend or terminate accounts that violate these Terms.

5. Acceptable Use
You agree not to: use the Platform for any unlawful purpose, attempt to hack, disrupt, or damage the website, upload malicious code or harmful material, copy, scrape, reproduce, or redistribute content at scale without written permission, or post defamatory, abusive, or misleading content. Violation may result in suspension, termination, or legal action.

6. AI-Generated Content
The Platform publishes content generated and/or assisted by artificial intelligence. While efforts are made to ensure factual correctness and timeliness, we do not guarantee that the content is error-free or up to date. Content should not be considered professional, legal, financial, or investment advice. All content is intended for informational purposes only.

7. Intellectual Property
Unless otherwise stated, all original text content, branding, logos, and website design elements of Bharat News Narratives are owned by the Platform. Unauthorized reproduction, redistribution, or commercial use is prohibited. Images displayed may belong to their respective copyright owners. If you believe any content infringes your rights, please contact us for prompt review.

8. Third-Party Links
The Platform may contain links to third-party websites. We are not responsible for the content, policies, or practices of external sites. Accessing third-party websites is at your own risk.

9. Limitation of Liability
To the fullest extent permitted under Indian law, Bharat News Narratives shall not be liable for any direct, indirect, incidental, consequential, or special damages arising from the use of this Platform or reliance on its content. Use of the Platform is at your own risk.

10. Indemnification
You agree to indemnify and hold harmless Bharat News Narratives and its operators from any claims, damages, losses, or liabilities arising from your use of the Platform, violation of these Terms, or infringement of any third-party rights.

11. Termination
We reserve the right to suspend or terminate access to the Platform without notice if these Terms are violated.

12. Governing Law and Jurisdiction
These Terms shall be governed by and interpreted in accordance with the laws of India. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Warangal, India.

13. Changes to Terms
We may update these Terms from time to time. Continued use of the Platform after updates constitutes acceptance of the revised Terms.`,
  },
};

/* ---------- MODAL ---------- */

const LegalModal = ({ doc, onClose }) => {
  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm px-4"
      onClick={handleBackdrop}
    >
      <div className="relative bg-white w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border-t-4 border-[#1A56C4]">
        {/* Header */}
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

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-6 text-sm text-gray-700 leading-relaxed space-y-4">
          {doc.body.split('\n\n').map((para, i) => (
            <p key={i} className={para.match(/^\d+\./) ? 'font-bold text-[#121212] mt-4' : ''}>
              {para}
            </p>
          ))}
        </div>

        {/* Footer */}
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

/* ---------- TICKER ---------- */

const LatestTicker = ({ items = [] }) => {
  if (!items.length) return null;
  const feed = [...items, ...items];

  return (
    <div className="w-full overflow-hidden bg-[#1A56C4] border-b border-blue-700">
      <style jsx global>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          display: inline-flex;
          gap: 3rem;
          align-items: center;
          padding: 0.45rem 1rem;
          animation: ticker 32s linear infinite;
          white-space: nowrap;
        }
        .animate-ticker:hover { animation-play-state: paused; }
      `}</style>
      <div className="flex items-center">
        <span className="flex-shrink-0 bg-white text-[#1A56C4] text-[9px] font-black uppercase tracking-widest px-3 py-2 z-10">
          Latest
        </span>
        <div className="relative overflow-hidden flex-1">
          <div className="animate-ticker">
            {feed.map((item, idx) => (
              <Link
                key={`${item?._id}-${idx}`}
                href={`/story/${item?._id}`}
                className="text-[11px] font-bold text-blue-100 hover:text-white transition-colors uppercase tracking-tight"
              >
                ◆ {cleanTitle(item?.title || item?.topic)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- SECTION HEADER ---------- */

const SectionHeader = ({ title, id }) => (
  <div id={id} className="flex items-center gap-4 mb-6 pt-2 scroll-mt-14">
    <div className="w-1.5 h-7 bg-[#1A56C4] rounded-full flex-shrink-0" />
    <h2 className="text-xl font-black uppercase tracking-tighter italic text-[#121212]">
      {title}
    </h2>
    <div className="flex-1 h-px bg-gray-200" />
  </div>
);

/* ---------- CATEGORY SECTION ---------- */

const CategorySection = ({ title, items }) => {
  if (!items?.length) return null;
  const lead = items[0];
  const side = items.slice(1, 5);

  return (
    <section className="mt-16">
      <SectionHeader title={title} id={title.toLowerCase()} />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 md:col-span-7 group">
          {lead?.imageUrl && (
            <div className="overflow-hidden mb-4">
              <img
                src={lead.imageUrl}
                className="w-full h-80 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                alt=""
              />
            </div>
          )}
          <CategoryBadge category={lead?.category} />
          <Link href={`/story/${lead?._id}`} className="block text-2xl font-bold hover:text-[#1A56C4] leading-tight transition-colors">
            {cleanTitle(lead?.title)}
          </Link>
          <p className="text-sm text-gray-500 mt-2 line-clamp-3 leading-relaxed">{lead?.summary}</p>
          <Link href={`/story/${lead?._id}`} className="inline-flex items-center gap-1 mt-3 text-[11px] font-black uppercase tracking-widest text-[#1A56C4] border-b-2 border-[#1A56C4] pb-0.5 hover:opacity-70 transition-opacity">
            Read More →
          </Link>
        </div>
        <div className="col-span-12 md:col-span-5 space-y-5">
          {side.map((item) => (
            <div key={item._id} className="flex gap-4 border-b border-gray-100 pb-4 last:border-0 items-start group">
              {item.imageUrl && (
                <div className="w-24 h-16 flex-shrink-0 overflow-hidden">
                  <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt="" />
                </div>
              )}
              <div className="flex-1">
                <CategoryBadge category={item.category} />
                <Link href={`/story/${item._id}`} className="text-sm font-bold hover:text-[#1A56C4] leading-snug block line-clamp-2 transition-colors">
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
  const [activeModal, setActiveModal] = useState(null); // 'disclaimer' | 'privacy' | 'terms' | null

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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-[#f0f5ff]">
        <div className="w-10 h-10 border-4 border-[#1A56C4] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-[#1A56C4]">Loading BNN…</p>
      </div>
    );
  }

  const leadStory    = latest[0];
  const leftSidebar  = latest.slice(6, 12);   // ← was rightSidebar (Latest Updates)
  const rightSidebar = latest.slice(1, 6);    // ← was leftSidebar  (Top Stories)
  const subHero      = latest.slice(12, 14);

  return (
    <div className="bg-[#f8faff] min-h-screen text-[#121212]">

      {/* Legal Modal */}
      {activeModal && (
        <LegalModal doc={LEGAL[activeModal]} onClose={() => setActiveModal(null)} />
      )}

      <LatestTicker items={latest.slice(0, 10)} />

      <main className="max-w-[1440px] mx-auto px-4 md:px-8 py-8">

        {/* ===== TOP TRIPLE-COLUMN GRID ===== */}
        <div className="grid grid-cols-12 gap-8 mb-12">

          {/* LEFT: LATEST UPDATES (swapped) */}
          <aside className="col-span-12 md:col-span-2 space-y-5 border-r pr-6 border-blue-100">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1A56C4] border-b-2 border-[#1A56C4] pb-1 mb-4">
              Latest Updates
            </h3>
            {leftSidebar.map((item) => (
              <article key={item._id} className="group pb-4 border-b last:border-0 border-blue-50">
                <Link href={`/story/${item._id}`} className="block">
                  <p className="text-sm font-bold leading-snug group-hover:text-[#1A56C4] transition-colors">
                    {cleanTitle(item.title)}
                  </p>
                  <span className="text-[10px] text-[#1A56C4] font-bold uppercase tracking-widest mt-1 inline-block opacity-70">
                    {item.category}
                  </span>
                </Link>
              </article>
            ))}
          </aside>

          {/* CENTER: MAIN FEATURE */}
          <section className="col-span-12 md:col-span-7 px-2">
            {leadStory && (
              <article className="mb-10 border-b border-blue-100 pb-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-1 bg-[#1A56C4] rounded-full" />
                  <CategoryBadge category={leadStory.category} />
                </div>
                <Link href={`/story/${leadStory._id}`}>
                  <h1
                    className="text-4xl md:text-5xl font-black leading-[1.1] mb-6 hover:text-[#1A56C4] transition-colors tracking-tight"
                    style={{ fontFamily: 'Georgia, serif' }}
                  >
                    {cleanTitle(leadStory.title)}
                  </h1>
                </Link>
                <div className="relative aspect-[16/9] overflow-hidden bg-blue-50 mb-6 shadow-sm">
                  {leadStory.imageUrl && (
                    <img src={leadStory.imageUrl} className="w-full h-full object-cover" alt="" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1A56C4] opacity-20 pointer-events-none" />
                </div>
                <p className="text-lg leading-relaxed text-gray-700 font-medium">{leadStory.summary}</p>
                <Link
                  href={`/story/${leadStory._id}`}
                  className="inline-flex items-center gap-2 mt-4 text-[11px] font-black uppercase tracking-widest text-white bg-[#1A56C4] px-4 py-2 hover:bg-[#1248A8] transition-colors"
                >
                  Read Full Story →
                </Link>
              </article>
            )}

            <div className="grid grid-cols-2 gap-8">
              {subHero.map((item) => (
                <div key={item._id} className="group">
                  <div className="w-full h-40 overflow-hidden mb-3 relative">
                    <img
                      src={item.imageUrl}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      alt=""
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-[#1A56C4] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </div>
                  <CategoryBadge category={item.category} />
                  <Link href={`/story/${item._id}`} className="text-base font-bold leading-tight hover:text-[#1A56C4] transition-colors">
                    {cleanTitle(item.title)}
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* RIGHT: TOP STORIES (swapped) */}
          <aside className="col-span-12 md:col-span-3 border-l pl-6 border-blue-100">
            <h3 className="text-[11px] font-black uppercase tracking-widest text-[#1A56C4] border-b-2 border-[#1A56C4] pb-1 mb-4">
              Top Stories
            </h3>
            <div className="space-y-6">
              {rightSidebar.map((item) => (
                <article key={item._id} className="group pb-4 border-b last:border-0 border-blue-50">
                  <CategoryBadge category={item.category} />
                  <Link
                    href={`/story/${item._id}`}
                    className="block text-sm font-bold leading-snug group-hover:text-[#1A56C4] transition-colors"
                  >
                    {cleanTitle(item.title)}
                  </Link>
                </article>
              ))}
            </div>
          </aside>
        </div>

        {/* ===== CATEGORY SECTIONS ===== */}
        <CategorySection title="Politics"   items={latest.filter(n => n.category === 'Politics')} />
        <CategorySection title="World"      items={latest.filter(n => n.category === 'World')} />
        <CategorySection title="Business"   items={latest.filter(n => n.category === 'Business')} />
        <CategorySection title="Technology" items={latest.filter(n => n.category === 'Tech' || n.category === 'Technology')} />
        <CategorySection title="Sports"     items={latest.filter(n => n.category === 'Sports')} />

        {/* ===== FOOTER ===== */}
        <footer className="mt-20 pt-12 border-t-4 border-[#1A56C4] text-center">
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

          {/* Legal links — open modals */}
          <div className="flex justify-center flex-wrap gap-6 text-[10px] font-bold uppercase text-gray-400 mb-4">
            <button
              onClick={() => setActiveModal('disclaimer')}
              className="hover:text-[#1A56C4] transition-colors cursor-pointer"
            >
              Disclaimer
            </button>
            <button
              onClick={() => setActiveModal('privacy')}
              className="hover:text-[#1A56C4] transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveModal('terms')}
              className="hover:text-[#1A56C4] transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
            <a href="mailto:bharatnewsnarratives@gmail.com" className="hover:text-[#1A56C4] transition-colors">
              Contact
            </a>
          </div>

          <p className="mt-6 text-[10px] text-gray-400 pb-12">
            © {new Date().getFullYear()} Bharat News Narratives. All content is AI-generated for informational purposes only.
          </p>
        </footer>
      </main>
    </div>
  );
}