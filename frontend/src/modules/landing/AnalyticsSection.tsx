import { motion } from 'framer-motion';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

/* ─── Metrics data ──────────────────────────────────────────────── */
const METRICS = [
  { icon: 'build', value: '+1000', label: 'Reparaciones realizadas' },
  { icon: 'trending_up', value: '+2000', label: 'Ventas concretadas' },
  { icon: 'history', value: '+10', label: 'Años de experiencia' },
] as const;

/* ─── Fade-up animation presets ─────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
});

/* ─── AnalyticsSection ──────────────────────────────────────────── */
export function AnalyticsSection() {
  return (
    <section className="flex flex-col items-center gap-8 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl mx-auto">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            {...fadeUp(i * 0.1)}
            className="flex flex-col items-center gap-3 rounded-xl p-8 text-center transition-all duration-200"
            style={{
              backgroundColor: '#1A1E27',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0,217,255,0.15)';
              e.currentTarget.style.backgroundColor = '#1D222D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.backgroundColor = '#1A1E27';
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,217,255,0.06)' }}
            >
              <MaterialIcon
                icon={m.icon}
                size={24}
                style={{ color: 'rgba(0,217,255,0.7)' }}
              />
            </div>

            {/* Value */}
            <span
              className="text-4xl sm:text-5xl font-bold tracking-tight"
              style={{
                color: '#FFFFFF',
                fontFamily: '"Space Grotesk", sans-serif',
              }}
            >
              {m.value}
            </span>

            {/* Label */}
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {m.label}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
