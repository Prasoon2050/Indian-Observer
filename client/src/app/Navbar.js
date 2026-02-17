'use client';

import { usePathname, useRouter } from 'next/navigation';

const categories = [
  { label: 'Home',       href: '/',           sectionId: null },
  { label: 'World',      href: '/#world',      sectionId: 'world' },
  { label: 'Politics',   href: '/#politics',   sectionId: 'politics' },
  { label: 'Business',   href: '/#business',   sectionId: 'business' },
  { label: 'Technology', href: '/#technology', sectionId: 'technology' },
  { label: 'Sports',     href: '/#sports',     sectionId: 'sports' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavClick = (e, cat) => {
    if (!cat.sectionId) return; // Home — let default link behaviour handle it

    e.preventDefault();

    const scrollToSection = () => {
      const el = document.getElementById(cat.sectionId);
      if (el) {
        // Offset accounts for the sticky nav bar height (48px)
        const top = el.getBoundingClientRect().top + window.scrollY - 56;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    };

    if (pathname === '/') {
      scrollToSection();
    } else {
      // Navigate home first, then scroll after the page renders
      router.push('/');
      setTimeout(scrollToSection, 450);
    }
  };

  return (
    <nav className="bg-[#1A56C4] sticky top-0 z-50 shadow-md border-t border-white border-opacity-10">
      <div className="max-w-[1440px] mx-auto px-6 h-12 flex items-center justify-center gap-2 md:gap-3">
        {categories.map((cat) => (
          <a
            key={cat.label}
            href={cat.href}
            onClick={(e) => handleNavClick(e, cat)}
            className={`
              cursor-pointer text-[11px] font-black uppercase tracking-widest
              px-4 py-1.5 rounded-full transition-all duration-200 select-none
              ${cat.label === 'Home' && pathname === '/'
                ? 'text-[#1A56C4] bg-white shadow-sm'
                : 'text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-20'
              }
            `}
          >
            {cat.label}
          </a>
        ))}
      </div>
    </nav>
  );
}