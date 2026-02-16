import Link from 'next/link';
import { Merriweather, Inter } from 'next/font/google';
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
  title: 'The Indian Observer',
  description: 'Independent journalism. Editorial clarity.',
};

const categories = [
  { label: 'Home', href: '/' },
  { label: 'World', href: '/#world' },
  { label: 'Politics', href: '/#politics' },
  { label: 'Business', href: '/#business' },
  { label: 'Technology', href: '/#tech' },
  { label: 'Sports', href: '/#sports' },
];

export default function RootLayout({ children }) {
  // Get current date for the newspaper masthead
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
          {/* ================= TOP BRANDING BAR (BLACK) ================= */}
          <div className="bg-black text-white py-4 shadow-md">
            <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between">
              
              {/* LOGO */}
              <Link
                href="/"
                className="text-3xl md:text-4xl font-black tracking-tighter hover:text-gray-200 transition-colors italic"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                The Indian Observer
              </Link>

              {/* ACTIONS: SEARCH & SIGN IN */}
              <div className="hidden md:flex items-center gap-4">
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Search news..." 
                    className="h-10 w-64 pl-4 pr-10 rounded-full bg-neutral-800 border-none text-sm text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  />
                  <svg className="h-4 w-4 absolute right-4 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" />
                  </svg>
                </div>

                <Link
                  href="/admin/login"
                  className="h-10 px-6 rounded-md bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition flex items-center justify-center shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* ================= MASTHEAD (DATE & LOCATION) ================= */}
          <div className="border-b border-gray-200 bg-white">
            <div className="max-w-[1440px] mx-auto px-6 h-10 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-gray-500">
              <div className="flex items-center gap-4">
                <span>{formattedDate}</span>
                <span className="text-gray-300">|</span>
                <span>New Delhi, India</span>
              </div>
              <div className="flex gap-4">
                <span className="text-red-600 animate-pulse">● Live Updates</span>
              </div>
            </div>
          </div>

          {/* ================= CATEGORY NAVIGATION ================= */}
          <nav className="bg-white border-b-4 border-black sticky top-0 z-50">
            <div className="max-w-[1440px] mx-auto px-6 h-12 flex items-center justify-center gap-8 md:gap-12">
              {categories.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="text-[11px] font-black uppercase tracking-widest text-gray-800 hover:text-blue-700 transition-colors relative group"
                >
                  {cat.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-700 transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </div>
          </nav>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <main>
          {children}
        </main>

      </body>
    </html>
  );
}



