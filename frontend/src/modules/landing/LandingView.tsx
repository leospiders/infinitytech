import { useState, useEffect } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { HeroPrincipal } from './HeroPrincipal';
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
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const navItems = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'nosotros', label: 'Nosotros' },
    { id: 'contacto', label: 'Contacto' },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#080616', color: '#FFFFFF' }}>
      {/* ─── Navbar ─── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'shadow-[0_1px_0_rgba(255,255,255,0.04)]' : ''
        }`}
        style={{
          backgroundColor: scrolled ? 'rgba(8,6,22,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <button onClick={() => scrollTo('inicio')} className="flex items-center gap-2.5 cursor-pointer">
              <div className="h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: '#2F2FE4', color: '#FFFFFF' }}>
                ∞
              </div>
              <span className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: '#FFFFFF', fontFamily: '"Space Grotesk", sans-serif' }}>
                INFINITY <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>TECH</span>
              </span>
            </button>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
                >
                  {label}
                </button>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <button className="hidden sm:flex p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#00C8F8'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
                <MaterialIcon icon="search" size={18} wght={300} />
              </button>
              <button onClick={() => setCartOpen(true)}
                className="relative p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#00C8F8'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
                <MaterialIcon icon="shopping_cart" size={18} wght={300} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 rounded-full text-[8px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: '#2F2FE4', color: '#FFFFFF' }}>
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </button>
              <button onClick={onRequestLogin}
                className="hidden sm:flex p-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#00C8F8'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}>
                <MaterialIcon icon="person" size={18} wght={300} />
              </button>
              <div className="w-px h-5 mx-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />
              {/* Dark mode toggle placeholder */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
                <MaterialIcon icon="dark_mode" size={14} wght={200} />
              </div>

              {/* Mobile hamburger */}
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="p-2.5 rounded-xl transition-all duration-200 cursor-pointer md:hidden"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                <MaterialIcon icon={menuOpen ? 'close' : 'menu'} size={18} wght={300} />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="md:hidden border-t px-6 pb-6 pt-4 flex flex-col gap-1"
            style={{ borderColor: 'rgba(255,255,255,0.04)', backgroundColor: 'rgba(8,6,22,0.95)', backdropFilter: 'blur(20px)' }}>
            {navItems.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="w-full text-left px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer"
                style={{ color: 'rgba(255,255,255,0.5)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
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

        <CategoriesSection />

        <div id="inventario">
          <InventorySection />
        </div>

        <div id="servicios">
          <ServicesSection />
        </div>

        <div id="nosotros">
          <StatsSection />
        </div>

        <CTASection />

        <div id="contacto">
          {/* Contact anchor for scrolling — footer acts as contact */}
        </div>
      </main>

      <LandingFooter onRequestLogin={onRequestLogin} />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
