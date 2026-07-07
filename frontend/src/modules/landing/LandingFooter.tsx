import { MaterialIcon } from '../../components/ui/MaterialIcon';

interface Props {
  onRequestLogin: () => void;
}

export function LandingFooter({ onRequestLogin }: Props) {
  return (
    <footer className="py-20 px-6 sm:px-12 lg:px-16" style={{ backgroundColor: '#080616', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Logo + desc */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#2F2FE4' }}>
              <span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>∞</span>
            </div>
            <span className="text-xs font-bold tracking-[0.15em] uppercase" style={{ color: '#FFFFFF', fontFamily: '"Space Grotesk", sans-serif' }}>
              INFINITY <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>TECH</span>
            </span>
          </div>
          <p className="text-xs leading-relaxed max-w-sm" style={{ color: '#A5A5A5' }}>
            Laboratorio especializado en reparación de dispositivos, venta de repuestos originales y accesorios tecnológicos premium.
          </p>
          <div className="flex items-center gap-4 mt-2">
            {['FB', 'IG', 'LN'].map(s => (
              <a key={s} href="#" className="text-[10px] font-bold tracking-widest uppercase transition-all duration-200" style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#00C8F8'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}>
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* Contacto + Horario */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-8">
          <div className="flex flex-col gap-5">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#2F2FE4' }}>CONTACTO</h4>
            <ul className="flex flex-col gap-3 text-xs" style={{ color: '#A5A5A5' }}>
              <li className="flex items-start gap-2">
                <MaterialIcon icon="pin_drop" size={14} style={{ color: '#00C8F8' }} />
                <span>Calle Comercio Gal. Elegans #850, Of. 2 y 3</span>
              </li>
              <li className="flex items-center gap-2">
                <MaterialIcon icon="call" size={14} style={{ color: '#00C8F8' }} />
                <span>+591 60574727</span>
              </li>
              <li className="flex items-center gap-2">
                <MaterialIcon icon="mail" size={14} style={{ color: '#00C8F8' }} />
                <span>info@infinitytech.com</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col gap-5">
            <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#2F2FE4' }}>HORARIO</h4>
            <ul className="flex flex-col gap-3 text-xs" style={{ color: '#A5A5A5' }}>
              <li className="flex flex-col gap-0.5">
                <span style={{ color: '#EAEAEA' }}>Lunes a Viernes</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>09:00 – 19:30</span>
              </li>
              <li className="flex flex-col gap-0.5">
                <span style={{ color: '#EAEAEA' }}>Sábados</span>
                <span style={{ color: 'rgba(255,255,255,0.35)' }}>09:00 – 13:00</span>
              </li>
              <li>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.2)' }}>Domingos cerrado</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Mapa */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: '#2F2FE4' }}>UBICACIÓN</h4>
          <div className="w-full h-40 rounded-[20px] overflow-hidden relative" style={{ backgroundColor: '#0A0C14', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="absolute inset-0 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center animate-pulse" style={{ backgroundColor: 'rgba(47,47,228,0.15)', border: '1px solid rgba(47,47,228,0.3)' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#2F2FE4' }} />
              </div>
              <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>Infinity Tech</span>
            </div>
            <a href="https://maps.google.com/?q=Calle+Comercio+Gal.+Elegans+850,+Santa+Cruz" target="_blank" rel="noopener noreferrer"
              className="absolute bottom-3 right-3 px-3 py-1.5 text-[9px] font-bold tracking-widest uppercase rounded-lg transition-all duration-200"
              style={{ backgroundColor: 'rgba(47,47,228,0.12)', color: '#FFFFFF' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(47,47,228,0.2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(47,47,228,0.12)'}>
              Ver mapa
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="max-w-[1440px] mx-auto mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <p className="text-[10px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)' }}>
          © {new Date().getFullYear()} Infinity Technology
        </p>
        <button
          onClick={onRequestLogin}
          className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase transition-all duration-200"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#00C8F8'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
        >
          <MaterialIcon icon="lock" size={10} />
          Acceso personal autorizado
        </button>
      </div>
    </footer>
  );
}
