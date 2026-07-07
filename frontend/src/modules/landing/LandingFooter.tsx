import { MaterialIcon } from '../../components/ui/MaterialIcon';

interface Props {
  onRequestLogin: () => void;
}

export function LandingFooter({ onRequestLogin }: Props) {
  return (
    <footer
      className="py-24 px-6 sm:px-12 lg:px-16"
      style={{
        backgroundColor: 'var(--c-bg)',
        borderTop: '1px solid var(--c-border)',
      }}
    >
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        {/* Column 1: Logo & Info */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center text-md font-bold"
              style={{
                background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--color-cyan-accent) 100%)',
                color: 'var(--c-bg)',
              }}
            >
              ∞
            </div>
            <span
              className="text-xs font-bold tracking-[0.2em] uppercase"
              style={{ color: 'var(--c-text)', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              INFINITY <span style={{ color: 'var(--c-text-sec)', fontWeight: 300 }}>TECH</span>
            </span>
          </div>
          <p
            className="text-xs leading-relaxed max-w-sm font-light"
            style={{ color: 'var(--c-text-sec)', fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Laboratorio especializado en reingeniería de dispositivos móviles, venta de componentes originales y accesorios premium.
          </p>
          {/* Social Links */}
          <div className="flex items-center gap-6 mt-4">
            {['Instagram', 'Facebook', 'LinkedIn'].map(s => (
              <a
                key={s}
                href="#"
                className="text-[10px] font-bold tracking-widest uppercase transition-colors duration-300"
                style={{ color: 'var(--c-text-sec)', fontFamily: '"Space Grotesk", sans-serif' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-cyan-accent)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-sec)'}
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* Column 2: Info details */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-10">
          {/* Contact info */}
          <div className="flex flex-col gap-6">
            <h4
              className="text-[10px] font-bold tracking-[0.25em] uppercase"
              style={{ color: 'var(--color-cyan-accent)', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              CONTACTO
            </h4>
            <ul
              className="flex flex-col gap-4 text-xs font-light"
              style={{ color: 'var(--c-text-sec)', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              <li className="flex items-start gap-3">
                <MaterialIcon icon="pin_drop" size={16} style={{ color: 'var(--color-cyan-accent)', marginTop: '2px' }} />
                <span className="leading-relaxed">Calle Comercio Gal. Elegans #850, Of. 2 y 3</span>
              </li>
              <li className="flex items-center gap-3">
                <MaterialIcon icon="call" size={16} style={{ color: 'var(--color-cyan-accent)' }} />
                <span>+591 60574727</span>
              </li>
              <li className="flex items-center gap-3">
                <MaterialIcon icon="mail" size={16} style={{ color: 'var(--color-cyan-accent)' }} />
                <span>info@infinitytech.com</span>
              </li>
            </ul>
          </div>

          {/* Opening hours */}
          <div className="flex flex-col gap-6">
            <h4
              className="text-[10px] font-bold tracking-[0.25em] uppercase"
              style={{ color: 'var(--color-cyan-accent)', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              HORARIOS
            </h4>
            <ul
              className="flex flex-col gap-4 text-xs font-light"
              style={{ color: 'var(--c-text-sec)', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              <li className="flex flex-col gap-1">
                <span style={{ color: 'var(--c-text)', fontWeight: 500 }}>Lunes a Viernes</span>
                <span className="opacity-75">09:00 – 19:30</span>
              </li>
              <li className="flex flex-col gap-1">
                <span style={{ color: 'var(--c-text)', fontWeight: 500 }}>Sábados</span>
                <span className="opacity-75">09:00 – 13:00</span>
              </li>
              <li className="flex flex-col gap-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider block mt-1"
                  style={{ color: 'var(--c-text-sec)', opacity: 0.5 }}
                >
                  Domingos cerrado
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Column 3: Sleek Abstract HUD map */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <h4
            className="text-[10px] font-bold tracking-[0.25em] uppercase"
            style={{ color: 'var(--color-cyan-accent)', fontFamily: '"Space Grotesk", sans-serif' }}
          >
            LABORATORIO
          </h4>
          <div
            className="w-full h-40 rounded-[24px] overflow-hidden relative border"
            style={{
              backgroundColor: 'var(--c-surface)',
              borderColor: 'var(--c-border)',
            }}
          >
            {/* HUD neon scanner background */}
            <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px]" />
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--c-primary)]/5 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              {/* Radar pulse */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center relative"
                style={{
                  backgroundColor: 'rgba(0, 229, 255, 0.06)',
                  border: '1px solid rgba(0, 229, 255, 0.2)',
                }}
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 bg-[var(--color-cyan-accent)]" />
                <span className="relative w-2 h-2 rounded-full bg-[var(--color-cyan-accent)]" />
              </div>
              <span
                className="text-[10px] font-bold tracking-[0.2em] uppercase text-[var(--c-text)]"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                INFINITY LAB
              </span>
            </div>
            {/* Map Link */}
            <a
              href="https://maps.google.com/?q=Calle+Comercio+Gal.+Elegans+850,+Santa+Cruz"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 px-4.5 py-2.5 text-[9px] font-bold tracking-widest uppercase rounded-xl transition-all duration-300 border cursor-pointer"
              style={{
                backgroundColor: 'rgba(0, 229, 255, 0.08)',
                borderColor: 'var(--c-border)',
                color: 'var(--c-text)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.15)';
                e.currentTarget.style.borderColor = 'var(--color-cyan-accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 229, 255, 0.08)';
                e.currentTarget.style.borderColor = 'var(--c-border)';
              }}
            >
              Ver mapa
            </a>
          </div>
        </div>
      </div>

      {/* Footer Bottom credits */}
      <div
        className="max-w-[1440px] mx-auto mt-20 pt-10 flex flex-col sm:flex-row items-center justify-between gap-6"
        style={{ borderTop: '1px solid var(--c-border)' }}
      >
        <p
          className="text-[10px] tracking-widest uppercase"
          style={{ color: 'var(--c-text-sec)', fontFamily: '"Space Grotesk", sans-serif', opacity: 0.6 }}
        >
          © {new Date().getFullYear()} Infinity Technology. Todos los derechos reservados.
        </p>
        <button
          onClick={onRequestLogin}
          className="flex items-center gap-2 text-[10px] tracking-widest uppercase transition-colors duration-300 cursor-pointer"
          style={{ color: 'var(--c-text-sec)', fontFamily: '"Space Grotesk", sans-serif', opacity: 0.6 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-cyan-accent)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-sec)'}
        >
          <MaterialIcon icon="lock" size={12} style={{ color: 'var(--color-cyan-accent)' }} />
          Acceso personal autorizado
        </button>
      </div>
    </footer>
  );
}
