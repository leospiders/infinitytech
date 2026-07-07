import { useState, useEffect } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { HeroPrincipal } from './HeroPrincipal';
import { MarqueeTicker } from './MarqueeTicker';
import { CategoriesSection } from './CategoriesSection';
import { InventorySection } from './InventorySection';
import { ServicesSection } from './ServicesSection';
import { StatsSection } from './StatsSection';
import { CTASection } from './CTASection';
import { LandingFooter } from './LandingFooter';
import { CartDrawer } from './CartDrawer';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

interface Props {
  onRequestLogin: () => void;
}

export function LandingView({ onRequestLogin }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const totalItems = useCartStore(s => s.totalItems());

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  const navItems = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'taller', label: 'Taller' },
    { id: 'nosotros', label: 'Nosotros' },
    { id: 'contacto', label: 'Contacto' },
  ];

  return (
    <div
      className="min-h-screen selection:bg-[var(--c-primary)]/30 selection:text-[var(--c-text)]"
      style={{
        backgroundColor: 'var(--c-bg)',
        color: 'var(--c-text)',
        fontFamily: '"Space Grotesk", sans-serif',
      }}
    >
      {/* ─── Navbar (Fixed height of 76px) ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b h-[76px] flex items-center ${
          scrolled ? 'border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'border-transparent'
        }`}
        style={{
          backgroundColor: scrolled ? 'var(--c-navbar-bg)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        }}
      >
        <div className="max-w-[1440px] w-full mx-auto px-6 sm:px-12 lg:px-16 flex items-center justify-between">
          {/* Logo - Reduced visual weight & width */}
          <button
            onClick={() => scrollTo('inicio')}
            className="flex items-center gap-2.5 cursor-pointer group h-10"
          >
            <div
              className="h-7 w-7 rounded-xl flex items-center justify-center text-sm font-black transition-all duration-300 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--color-cyan-accent) 100%)',
                color: 'var(--c-bg)',
              }}
            >
              ∞
            </div>
            <span
              className="text-[10px] font-bold tracking-[0.25em] uppercase transition-colors duration-300"
              style={{ color: 'var(--c-text-sec)' }}
            >
              INFINITY <span style={{ color: 'var(--c-text-sec)', opacity: 0.5, fontWeight: 300 }}>TECH</span>
            </span>
          </button>

          {/* Desktop Nav - Generous spacing (gap-6) and glowing underline hover */}
          <nav className="hidden lg:flex items-center gap-6 h-10">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="relative py-1.5 px-0.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-300 cursor-pointer group"
                style={{ color: 'var(--c-text-sec)' }}
              >
                <span className="group-hover:text-white transition-colors duration-300">{label}</span>
                <span
                  className="absolute bottom-0 left-0 w-0 h-[2px] bg-[var(--color-cyan-accent)] transition-all duration-300 group-hover:w-full rounded-full"
                  style={{ boxShadow: '0 0 8px var(--color-cyan-accent)' }}
                />
              </button>
            ))}
          </nav>

          {/* Right Actions - Balanced icon buttons with exact same dimensions and padding */}
          <div className="flex items-center gap-1.5 h-10">
            {/* Search Button */}
            <button
              onClick={() => scrollTo('inventario')}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer group"
              style={{ color: 'var(--c-text-sec)' }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--color-cyan-accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--c-text-sec)';
              }}
              aria-label="Buscar en inventario"
            >
              <MaterialIcon icon="search" size={16} wght={300} />
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer group"
              style={{ color: 'var(--c-text-sec)' }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--color-cyan-accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--c-text-sec)';
              }}
              aria-label="Ver carrito"
            >
              <MaterialIcon icon="shopping_cart" size={16} wght={300} />
              {totalItems > 0 && (
                <span
                  className="absolute top-1 right-1 h-3.5 min-w-[14px] px-0.5 rounded-full text-[8px] font-bold flex items-center justify-center border border-[var(--c-bg)]"
                  style={{
                    backgroundColor: 'var(--c-primary)',
                    color: 'var(--c-bg)',
                  }}
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Account Button */}
            <button
              onClick={onRequestLogin}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer group"
              style={{ color: 'var(--c-text-sec)' }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--color-cyan-accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--c-text-sec)';
              }}
              aria-label="Acceso personal"
            >
              <MaterialIcon icon="person" size={16} wght={300} />
            </button>

            <div className="w-px h-4 mx-0.5 bg-white/10 hidden sm:block" />

            {/* Official Dark Mode indicator (cyan accent) */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--color-cyan-accent)]" title="Modo Oscuro Oficial">
              <MaterialIcon icon="dark_mode" size={14} wght={300} />
            </div>

            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 cursor-pointer lg:hidden"
              style={{ color: 'var(--c-text-sec)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <MaterialIcon icon={menuOpen ? 'close' : 'menu'} size={16} wght={300} />
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {menuOpen && (
          <div
            className="lg:hidden absolute top-[76px] left-0 right-0 border-t px-6 pb-6 pt-4 flex flex-col gap-2 shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
            style={{
              borderColor: 'var(--c-border)',
              backgroundColor: 'var(--c-mobile-drawer-bg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="w-full text-left px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300 cursor-pointer"
                style={{ color: 'var(--c-text-sec)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.color = 'var(--c-text)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--c-text-sec)';
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ─── Sections ─── */}
      <main>
        <div id="inicio">
          <HeroPrincipal
            onExplore={() => scrollTo('inventario')}
            onRequestRepair={() => scrollTo('contacto')}
          />
        </div>

        <MarqueeTicker />

        <CategoriesSection />

        <div id="inventario">
          <InventorySection />
        </div>

        <div id="servicios">
          <ServicesSection />
        </div>

        <div id="taller">
          {/* Scroll anchor */}
        </div>

        <div id="nosotros">
          <StatsSection />
        </div>

        <TestimonialsSection />

        <CTASection />

        <div id="contacto">
          {/* Contact anchor */}
        </div>
      </main>

      <LandingFooter onRequestLogin={onRequestLogin} />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
