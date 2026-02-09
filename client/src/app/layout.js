import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'The Indian Observer',
  description: 'Independent journalism. Editorial clarity.',
};

const categories = [
  { label: 'Home', href: '/' },
  { label: 'World', href: '/#world' },
  { label: 'Politics', href: '/#politics' },
  { label: 'Business', href: '/#business' },
  { label: 'Tech', href: '/#tech' },
  { label: 'Sports', href: '/#sports' },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* ================= TOP BLACK BAR ================= */}
        <header className="border-b border-gray-200">
          <div className="bg-black text-white">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
              {/* LOGO */}
              <Link
                href="/"
                className="text-3xl font-semibold tracking-tight"
                style={{ fontFamily: 'Merriweather, serif' }}
              >
                The Indian Observer
              </Link>

              {/* ACTIONS */}
              <div className="flex items-center gap-6">
                {/* SEARCH */}
                <button
                  type="button"
                  className="h-12 px-6 min-w-[260px] rounded-full bg-neutral-800 text-sm text-gray-300 hover:bg-neutral-700 transition flex items-center justify-between"
                >
                  <span>Search</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>

                {/* SIGN IN */}
                <Link
                  href="/admin/login"
                  className="h-12 px-6 min-w-[110px] rounded-md bg-white text-black text-sm font-semibold hover:bg-gray-100 transition flex items-center justify-center"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>

          {/* ================= CATEGORY NAV ================= */}
          <nav className="bg-white border-t">
            <div className="max-w-7xl mx-auto px-6 h-12 flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-gray-800">
              {categories.map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="hover:underline"
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </nav>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <main className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}



