import { motion } from 'framer-motion';

const STATS = [
  { value: '+12 000', label: 'Equipos reparados' },
  { value: '98%', label: 'Clientes satisfechos' },
  { value: '10+', label: 'Años de experiencia' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
});

export function StatsSection() {
  return (
    <section className="py-24 px-6 sm:px-12 lg:px-16 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            {...fadeUp(i * 0.1)}
            className="flex flex-col items-center text-center gap-3 py-10 px-6 rounded-[24px]"
            style={{
              backgroundColor: 'rgba(47,47,228,0.04)',
              border: '1px solid rgba(47,47,228,0.08)',
            }}
          >
            <span
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-none"
              style={{
                fontFamily: '"Space Grotesk", sans-serif',
                background: 'linear-gradient(135deg, #2F2FE4 0%, #00C8F8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {stat.value}
            </span>
            <span className="text-sm" style={{ color: '#A5A5A5' }}>
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
