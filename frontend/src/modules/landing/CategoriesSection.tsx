import { motion } from 'framer-motion';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

const CATEGORIES = [
  { name: 'Celulares', icon: 'smartphone', image: '/repairservice.webp' },
  { name: 'Laptops', icon: 'laptop', image: '/hero_technician.jpg' },
  { name: 'Pantallas', icon: 'tv', image: '/repairservice.webp' },
  { name: 'Baterías', icon: 'battery_saver', image: '/precision_repair.jpg' },
  { name: 'Accesorios', icon: 'headphones', image: '/gamingservice.webp' },
  { name: 'Herramientas', icon: 'handyman', image: '/precision_repair.jpg' },
  { name: 'Repuestos', icon: 'inventory_2', image: '/unlockservice.webp' },
  { name: 'Gaming', icon: 'sports_esports', image: '/gamingservice.webp' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function CategoriesSection() {
  return (
    <section className="py-32 px-6 sm:px-12 lg:px-16 max-w-[1440px] mx-auto">
      {/* Title block */}
      <motion.div {...fadeUp(0)} className="mb-20">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.25em] block mb-4"
          style={{ color: 'var(--color-cyan-accent)' }}
        >
          COLECCIÓN / CATEGORÍAS
        </span>
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-none"
          style={{ fontFamily: '"Space Grotesk", sans-serif', color: 'var(--c-text)' }}
        >
          Hardware curado.
        </h2>
      </motion.div>

      {/* Grid of massive card sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.name}
            {...fadeUp(0.05 + i * 0.05)}
            className="group relative rounded-[28px] overflow-hidden cursor-pointer aspect-[4/5] border"
            style={{
              backgroundColor: 'var(--c-surface)',
              borderColor: 'var(--c-border)',
            }}
          >
            {/* Background Image with elegant slide/zoom on hover */}
            <div
              className="absolute inset-0 bg-cover bg-center scale-100 opacity-40 transition-all duration-[1500ms] ease-out group-hover:scale-105 group-hover:opacity-60 group-hover:translate-y-[-4px]"
              style={{ backgroundImage: `url(${cat.image})` }}
            />

            {/* Dark & Blue Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-bg)] via-[var(--c-bg)]/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--c-bg)]/10 to-[var(--c-bg)] pointer-events-none" />
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(0, 229, 255, 0.08) 0%, transparent 60%)',
              }}
            />

            {/* Glowing borders on hover */}
            <div className="absolute inset-0 rounded-[28px] border border-transparent group-hover:border-[var(--color-cyan-accent)]/20 transition-colors duration-500 pointer-events-none" />

            {/* Card Content */}
            <div className="absolute inset-0 p-8 flex flex-col justify-end gap-4 z-10">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border backdrop-blur-md transition-all duration-300 group-hover:border-[var(--color-cyan-accent)]/30 group-hover:scale-105"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'var(--c-border)',
                }}
              >
                <MaterialIcon icon={cat.icon} size={18} style={{ color: 'var(--color-cyan-accent)' }} />
              </div>
              <div className="flex flex-col gap-1">
                <h3
                  className="text-lg sm:text-xl font-bold tracking-tight text-[var(--c-text)] transition-colors duration-300 group-hover:text-[var(--color-cyan-accent)]"
                  style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                >
                  {cat.name}
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-[var(--c-text-sec)] block">
                  Ver Colección →
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
