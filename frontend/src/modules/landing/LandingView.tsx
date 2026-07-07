import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../stores/cartStore';
import { HeroPrincipal } from './HeroPrincipal';
import { AnalyticsSection } from './AnalyticsSection';
import { HeroSearch } from './HeroSearch';
import { UnlockSection } from './UnlockSection';
import { StreamingSection } from './StreamingSection';
import { LandingContact } from './LandingContact';
import { LandingFooter } from './LandingFooter';
import { CartDrawer } from './CartDrawer';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

interface Props {
  onRequestLogin: () => void;
}

export function LandingView({ onRequestLogin }: Props) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const navItems = [
    { id: 'buscar-repuestos', label: t('landing.navRepuestos', 'Repuestos') },
    { id: 'desbloqueo', label: t('landing.navDesbloqueo', 'Desbloqueo') },
    { id: 'streaming', label: t('landing.navStreaming', 'Streaming') },
    { id: 'contacto', label: t('landing.navContact') },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#111318', color: 'rgba(255,255,255,0.85)' }}>
      {/* ─── Navbar ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'shadow-[0_1px_3px_rgba(0,0,0,0.2)]' : ''
        }`}
        style={{
          backgroundColor: scrolled ? 'rgba(17,19,24,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
        }}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: '#00D9FF', color: '#0F1115' }}
              >
                ∞
              </div>
              <div className="tracking-tight text-xs uppercase flex items-baseline gap-1">
                <span className="font-bold" style={{ color: 'rgba(255,255,255,0.9)' }}>INFINITY</span>
                <span className="font-normal" style={{ color: 'rgba(255,255,255,0.35)' }}>TECHNOLOGY</span>
              </div>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  {label}
                </button>
              ))}
              {/* Cart */}
              <div className="w-px h-5 mx-2" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-lg transition-all duration-150 cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#00D9FF'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
              >
                <MaterialIcon icon="shopping_cart" size={18} wght={400} />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[8px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: '#00D9FF', color: '#0F1115' }}
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
            </nav>

            {/* Mobile controls */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-lg transition-all duration-150 cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <MaterialIcon icon="shopping_cart" size={18} wght={400} />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[8px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: '#00D9FF', color: '#0F1115' }}
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg transition-all duration-150 cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <MaterialIcon icon={menuOpen ? 'close' : 'menu'} size={20} wght={400} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <div
            className="md:hidden border-t"
            style={{
              borderColor: 'rgba(255,255,255,0.04)',
              backgroundColor: 'rgba(17,19,24,0.95)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ─── Spacer for fixed navbar ─── */}
      <div className="h-16" />

      {/* ─── Main content ─── */}
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-20 pb-24">
        <HeroPrincipal
          onSearch={() => scrollTo('buscar-repuestos')}
        />

        <AnalyticsSection />

        <div id="buscar-repuestos">
          <HeroSearch />
        </div>

        <div id="desbloqueo">
          <UnlockSection />
        </div>

        <div id="streaming">
          <StreamingSection />
        </div>

        <div id="contacto">
          <LandingContact />
        </div>
      </main>

      <LandingFooter onRequestLogin={onRequestLogin} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </div>
  );
}
