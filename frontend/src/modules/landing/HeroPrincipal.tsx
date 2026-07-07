import { motion } from 'framer-motion';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

/* ─── Color palette ── */
const C = {
  text: 'var(--c-text)',
  textSec: 'var(--c-text-sec)',
  textTer: 'var(--c-text-ter)',
  primary: 'var(--c-primary)',
  surface: 'var(--c-surface)',
  border: 'var(--c-border)',
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
});

export function HeroPrincipal({ onSearch }: { onSearch: () => void }) {
  return (
    <section className="relative overflow-hidden rounded-2xl">
      {/* Dark premium gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F1115] via-[#14171D] to-[#1A1E27]" />

      {/* Subtle cyan glow — right side */}
      <div
        className="absolute -right-32 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-[0.08] blur-[120px] pointer-events-none"
        style={{ backgroundColor: C.primary }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-0 px-8 sm:px-12 lg:px-16 py-16 lg:py-20 min-h-[520px]">
        {/* ─── Left: Content ─── */}
        <div className="flex-1 flex flex-col gap-6 max-w-xl">
          {/* Badge */}
          <motion.span
            {...fadeUp(0)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit"
            style={{
              backgroundColor: 'rgba(0,217,255,0.1)',
              color: C.primary,
              border: '1px solid rgba(0,217,255,0.2)',
            }}
          >
            <MaterialIcon icon="verified" wght={300} size={12} />
            Repuestos originales. Garantía real.
          </motion.span>

          {/* Title */}
          <motion.h1
            {...fadeUp(0.1)}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]"
            style={{ color: '#FFFFFF', fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Tu celular, como el primer día
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-sm sm:text-base leading-relaxed max-w-lg"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            Repuestos originales, garantizados, instalados por técnicos certificados. La diferencia se nota — y se siente.
          </motion.p>

          {/* CTAs */}
          <motion.div
            {...fadeUp(0.3)}
            className="flex items-center gap-3 flex-wrap"
          >
            <button
              onClick={onSearch}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                backgroundColor: C.primary,
                color: '#0F1115',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,217,255,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              Buscar mi repuesto
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            {...fadeUp(0.4)}
            className="flex flex-wrap gap-x-6 gap-y-2 pt-2"
          >
            {[
              { icon: 'check_circle', label: 'Repuestos con garantía certificada' },
              { icon: 'check_circle', label: '100% compatibilidad garantizada' },
              { icon: 'check_circle', label: 'Instalación por técnicos expertos' },
            ].map((item) => (
              <span
                key={item.label}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                <MaterialIcon icon={item.icon} size={12} style={{ color: C.primary }} />
                {item.label}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ─── Right: Minimalist device composition ─── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 relative flex items-center justify-center w-72 h-72 lg:w-80 lg:h-80"
        >
          {/* Outer ring glow */}
          <div
            className="absolute inset-0 rounded-full opacity-[0.06]"
            style={{
              background: `radial-gradient(circle at center, ${C.primary} 0%, transparent 70%)`,
            }}
          />

          {/* Main device */}
          <div
            className="relative z-10 w-40 h-[260px] rounded-[32px] flex flex-col items-center justify-center gap-3"
            style={{
              backgroundColor: '#1A1E27',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 40px rgba(0,217,255,0.05), inset 0 0 20px rgba(0,217,255,0.02)',
            }}
          >
            {/* Screen inner glow */}
            <div
              className="absolute inset-2 rounded-[24px] opacity-[0.03]"
              style={{ background: `radial-gradient(circle at 50% 30%, ${C.primary}, transparent 70%)` }}
            />
            <MaterialIcon icon="smartphone" size={40} style={{ color: C.primary, opacity: 0.7 }} />
            <span className="text-[10px] font-medium tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
              DISPLAY
            </span>
          </div>

          {/* Floating elements — battery (top-right) */}
          <div
            className="absolute top-6 right-4 w-12 h-7 rounded flex items-center justify-center opacity-50"
            style={{
              backgroundColor: '#1A1E27',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <MaterialIcon icon="battery_full" size={14} style={{ color: C.primary }} />
          </div>

          {/* Camera (top-left) */}
          <div
            className="absolute top-8 left-3 w-10 h-10 rounded-full flex items-center justify-center opacity-40"
            style={{
              backgroundColor: '#1A1E27',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <MaterialIcon icon="camera_alt" size={14} style={{ color: C.primary }} />
          </div>

          {/* Chip/processor (bottom-right) */}
          <div
            className="absolute bottom-8 right-2 w-14 h-8 rounded flex items-center justify-center gap-1 opacity-40"
            style={{
              backgroundColor: '#1A1E27',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <MaterialIcon icon="memory" size={12} style={{ color: C.primary }} />
          </div>

          {/* Headphones (bottom-left) */}
          <div
            className="absolute bottom-6 left-1 w-10 h-10 rounded-full flex items-center justify-center opacity-40"
            style={{
              backgroundColor: '#1A1E27',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <MaterialIcon icon="headphones" size={14} style={{ color: C.primary }} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
