import { motion } from 'framer-motion';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

const CATEGORIES = [
  { name: 'Celulares', icon: 'smartphone', image: '/repairservice.webp' },
  { name: 'Laptops', icon: 'laptop', image: '/hero_technician.jpg' },
  { name: 'Pantallas', icon: 'tv', image: '/repairservice.webp' },
  { name: 'Baterías', icon: 'battery_saver', image: '/hero_technician.jpg' },
  { name: 'Accesorios', icon: 'headphones', image: '/gamingservice.webp' },
  { name: 'Herramientas', icon: 'handyman', image: '/repairservice.webp' },
  { name: 'Repuestos', icon: 'inventory_2', image: '/unlockservice.webp' },
  { name: 'Gaming', icon: 'sports_esports', image: '/gamingservice.webp' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
});

export function CategoriesSection() {
  return (
    <section className="py-24 px-6 sm:px-12 lg:px-16 max-w-[1440px] mx-auto">
      <motion.div {...fadeUp(0)} className="mb-14">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] block mb-3"
          style={{ color: '#2F2FE4' }}>
          CATEGORÍAS
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
          style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#FFFFFF' }}>
          Todo lo que necesitás
        </h2>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.name}
            {...fadeUp(0.1 + i * 0.04)}
            className="group relative rounded-[20px] overflow-hidden cursor-pointer aspect-[3/4] sm:aspect-square"
            style={{ backgroundColor: '#0A0C14' }}
          >
            {/* Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110"
              style={{ backgroundImage: `url(${cat.image})`, opacity: 0.35 }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080616]/90 via-transparent to-[#080616]/30" />

            {/* Hover blue accent */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500"
              style={{ background: 'linear-gradient(180deg, rgba(47,47,228,0.15) 0%, transparent 50%)' }}
            />

            {/* Content */}
            <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex flex-col gap-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(47,47,228,0.2)' }}>
                <MaterialIcon icon={cat.icon} size={18} style={{ color: '#00C8F8' }} />
              </div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight"
                style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#FFFFFF' }}>
                {cat.name}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
