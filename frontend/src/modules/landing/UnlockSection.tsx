import { motion } from 'framer-motion';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const BENEFITS = [
  { icon: 'bolt', label: 'Resultados en tiempo récord' },
  { icon: 'verified', label: 'Proceso 100% seguro' },
  { icon: 'devices', label: 'Todas las marcas y operadores' },
];

export function UnlockSection() {
  return (
    <section className="relative overflow-hidden rounded-2xl">
      {/* Slightly different bg to separate */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#13161C] via-[#161B24] to-[#1A1E27]" />

      {/* Subtle cyan accent */}
      <div
        className="absolute -left-20 top-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-[0.05] blur-[100px] pointer-events-none"
        style={{ backgroundColor: 'var(--c-primary)' }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 px-8 sm:px-12 lg:px-16 py-14 lg:py-16">
        {/* Left: Content */}
        <div className="flex-1 flex flex-col gap-5 max-w-lg">
          <motion.h2
            {...fadeUp(0)}
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: '#FFFFFF', fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Desbloqueá tu celular sin vueltas
          </motion.h2>

          <motion.p
            {...fadeUp(0.1)}
            className="text-sm leading-relaxed"
            style={{ color: 'rgba(255,255,255,0.5)' }}
          >
            Liberación profesional para cualquier marca u operador, con seguimiento en cada paso.
          </motion.p>

          {/* Benefits */}
          <motion.div
            {...fadeUp(0.2)}
            className="flex flex-col gap-2.5 pt-1"
          >
            {BENEFITS.map((b) => (
              <span
                key={b.label}
                className="flex items-center gap-2 text-xs"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                <MaterialIcon icon={b.icon} size={14} style={{ color: 'rgba(0,217,255,0.6)' }} />
                {b.label}
              </span>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div {...fadeUp(0.3)}>
            <button
              className="mt-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2"
              style={{
                backgroundColor: '#00D9FF',
                color: '#0F1115',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,217,255,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <MaterialIcon icon="lock_open" size={16} />
              Desbloquear mi celular
            </button>
          </motion.div>
        </div>

        {/* Right: visual representation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0 relative w-48 h-48 lg:w-56 lg:h-56 flex items-center justify-center"
        >
          {/* Ring glow */}
          <div
            className="absolute inset-0 rounded-full opacity-[0.08]"
            style={{
              background: `radial-gradient(circle at center, #00D9FF 0%, transparent 70%)`,
            }}
          />
          {/* Phone with unlock icon */}
          <div
            className="relative z-10 w-32 h-[200px] rounded-[28px] flex flex-col items-center justify-center gap-2"
            style={{
              backgroundColor: '#1A1E27',
              border: '1px solid rgba(0,217,255,0.15)',
              boxShadow: '0 0 30px rgba(0,217,255,0.04)',
            }}
          >
            <MaterialIcon icon="lock_open" size={36} style={{ color: '#00D9FF' }} />
            <span className="text-[9px] font-mono tracking-widest" style={{ color: 'rgba(0,217,255,0.3)' }}>
              UNLOCKED
            </span>
            {/* Signal bars */}
            <div className="flex items-end gap-[2px] mt-1">
              {[1,2,3,4].map((i) => (
                <div
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{
                    height: 4 + i * 3,
                    backgroundColor: i <= 3 ? '#00D9FF' : 'rgba(255,255,255,0.1)',
                    opacity: 0.5,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
