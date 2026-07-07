import { motion } from 'framer-motion';

const STATS = [
  { value: '+12 000', label: 'Equipos reparados' },
  { value: '98%', label: 'Clientes satisfechos' },
  { value: '10+', label: 'Años de experiencia' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function StatsSection() {
  return (
    <section className="py-32 px-6 sm:px-12 lg:px-16 max-w-[1440px] mx-auto">
      {/* Editorial layout: Clean title */}
      <motion.div {...fadeUp(0)} className="mb-20 text-center sm:text-left">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.25em] block mb-4"
          style={{ color: 'var(--color-cyan-accent)' }}
        >
          NOSOTROS / LOGROS
        </span>
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-tight text-[var(--c-text)]"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          Precisión en números.
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            {...fadeUp(i * 0.1)}
            className="flex flex-col items-start gap-4 py-12 px-8 rounded-[28px] border"
            style={{
              backgroundColor: 'var(--c-surface)',
              borderColor: 'var(--c-border)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
            }}
          >
            <span
              className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--color-cyan-accent) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {stat.value}
            </span>
            <span
              className="text-xs uppercase tracking-widest font-semibold block mt-2"
              style={{ color: 'var(--c-text-sec)', fontFamily: '"Space Grotesk", sans-serif' }}
            >
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
