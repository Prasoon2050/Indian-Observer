import Link from 'next/link';
import { Merriweather, Inter } from 'next/font/google';
import NavBar from './Navbar';
import './globals.css';

// Professional Serif for the Brand and Headlines
const merriweather = Merriweather({ 
  subsets: ['latin'], 
  weight: ['300', '400', '700', '900'],
  variable: '--font-serif'
});

// Clean Sans-Serif for UI and Meta data
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans'
});

export const metadata = {
  title: 'Bharat News Narratives',
  description: 'Independent journalism. Editorial clarity.',
};



// BNN Logo as an inline SVG — replicates the circular blue logo
function BNNLogo({ size = 52 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="BNN Logo"
    >
      {/* Blue circle */}
      <circle cx="50" cy="50" r="50" fill="#1A56C4" />

      {/* "BNN" text */}
      <text
        x="50"
        y="52"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="30"
        fontWeight="900"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="1"
      >
        BNN
      </text>

      {/* Thin rule under BNN */}
      <line x1="18" y1="60" x2="82" y2="60" stroke="white" strokeWidth="1.2" />

      {/* "Bharat News Narratives" sub-text */}
      <text
        x="50"
        y="72"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="7.2"
        fontWeight="400"
        fontFamily="Georgia, 'Times New Roman', serif"
        letterSpacing="0.5"
      >
        Bharat News Narratives
      </text>

      {/* Small India map silhouette (simplified triangle-ish shape) */}
      <path
        d="M50 80 L47 85 L50 90 L53 85 Z"
        fill="white"
        opacity="0.85"
      />
    </svg>
  );
}

export default function RootLayout({ children }) {
  const formattedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <html lang="en" className={`${merriweather.variable} ${inter.variable}`}>
      <body className="antialiased bg-[#fdfdfd] font-sans text-gray-900">

        <header className="w-full">

          {/* ================= TOP BRANDING BAR (DEEP BLUE — matches logo) ================= */}
          <div className="bg-[#1A56C4] text-white py-3 shadow-md">
            <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between">

              {/* LOGO + WORDMARK */}
              <Link
                href="/"
                className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                {/* Circular SVG logo */}
                <BNNLogo size={54} />

                {/* Text wordmark next to the logo */}
                <div className="flex flex-col leading-tight">
                  <span
                    className="text-2xl md:text-3xl font-black tracking-tight text-white italic"
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    Bharat News Narratives
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-[0.22em] text-blue-200 font-semibold"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    Independent · Insightful · Indian
                  </span>
                </div>
              </Link>

              {/* ACTIONS: SEARCH & SIGN IN */}
              <div className="hidden md:flex items-center gap-4">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search news..."
                    className="h-10 w-64 pl-4 pr-10 rounded-full bg-[#1248A8] border border-blue-400 border-opacity-40 text-sm text-white placeholder-blue-300 focus:ring-2 focus:ring-white transition-all outline-none"
                  />
                  <svg className="h-4 w-4 absolute right-4 top-3 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" />
                  </svg>
                </div>

                <Link
                  href="/admin/login"
                  className="h-10 px-6 rounded-md bg-white text-[#1A56C4] text-xs font-black uppercase tracking-widest hover:bg-blue-50 transition flex items-center justify-center shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* ================= MASTHEAD (DATE & LOCATION) ================= */}
          <div className="border-b border-blue-100 bg-[#EEF4FF]">
            <div className="max-w-[1440px] mx-auto px-6 h-10 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-[#1A56C4]">
              <div className="flex items-center gap-4">
                <span>{formattedDate}</span>
                <span className="text-blue-300">|</span>
                <span>New Delhi, India</span>
              </div>
              <div className="flex gap-4">
                <span className="text-red-600 animate-pulse">● Live Updates</span>
              </div>
            </div>
          </div>

          {/* ================= CATEGORY NAVIGATION ================= */}
          <NavBar />

        </header>

        {/* ================= PAGE CONTENT ================= */}
        <main>
          {children}
        </main>

      </body>
    </html>
  );
}