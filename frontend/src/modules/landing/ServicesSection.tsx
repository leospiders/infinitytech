import { motion } from 'framer-motion';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

const SERVICES = [
  {
    title: 'Cambio de pantalla',
    desc: 'Pantallas originales y de alta calidad para todas las marcas. Reparación con herramientas de precisión y garantía escrita.',
    icon: 'devices',
    image: '/repairservice.webp',
    reversed: false,
  },
  {
    title: 'Cambio de batería',
    desc: 'Baterías certificadas con control de calidad. Recuperá la autonomía original de tu equipo en 30 minutos.',
    icon: 'battery_charging_full',
    image: '/hero_technician.jpg',
    reversed: true,
  },
  {
    title: 'Reparación de placa',
    desc: 'Microsoldadura de componente a nivel placa. Diagnóstico profesional con osciloscopio y estación de calor.',
    icon: 'memory',
    image: '/repairservice.webp',
    reversed: false,
  },
  {
    title: 'Mantenimiento general',
    desc: 'Limpieza profunda, cambio de pasta térmica, revisión de conectores y puesta a punto completa.',
    icon: 'build',
    image: '/unlockservice.webp',
    reversed: true,
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
});

export function ServicesSection() {
  return (
    <section id="servicios" className="py-24 px-6 sm:px-12 lg:px-16 max-w-[1440px] mx-auto">
      <motion.div {...fadeUp(0)} className="mb-16">
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] block mb-3" style={{ color: '#2F2FE4' }}>
          SERVICIOS
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight" style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#FFFFFF' }}>
          Reparación de precisión
        </h2>
      </motion.div>

      <div className="flex flex-col gap-20">
        {SERVICES.map((svc, i) => (
          <motion.div
            key={svc.title}
            {...fadeUp(0.1 + i * 0.08)}
            className={`flex flex-col ${svc.reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-10 lg:gap-16`}
          >
            {/* Image */}
            <div className="w-full lg:w-1/2 aspect-[4/3] rounded-[24px] overflow-hidden"
              style={{ backgroundColor: '#0A0C14' }}>
              <div
                className="w-full h-full bg-cover bg-center transition-all duration-700 hover:scale-105"
                style={{ backgroundImage: `url(${svc.image})`, opacity: 0.4 }}
              />
            </div>

            {/* Text */}
            <div className="w-full lg:w-1/2 flex flex-col gap-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: 'rgba(47,47,228,0.12)' }}>
                <MaterialIcon icon={svc.icon} size={20} style={{ color: '#00C8F8' }} />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight"
                style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#FFFFFF' }}>
                {svc.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#A5A5A5' }}>
                {svc.desc}
              </p>
              <button className="inline-flex items-center gap-2 text-sm font-semibold transition-all duration-200 w-fit mt-2"
                style={{ color: '#00C8F8' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                Saber más →
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
