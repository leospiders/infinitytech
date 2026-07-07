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
            {/* WhatsApp */}
            <a
              href="https://wa.me/59160574727"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300"
              style={{ color: 'var(--c-text-sec)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-cyan-accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-sec)'}
              aria-label="WhatsApp"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            {/* TikTok */}
            <a
              href="https://tiktok.com/@infinitytech"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300"
              style={{ color: 'var(--c-text-sec)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-cyan-accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-sec)'}
              aria-label="TikTok"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
            {/* Facebook */}
            <a
              href="https://facebook.com/infinitytech"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300"
              style={{ color: 'var(--c-text-sec)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-cyan-accent)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-sec)'}
              aria-label="Facebook"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
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
