import { motion } from 'framer-motion';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

const SERVICES = [
  {
    title: 'Cambio de pantalla',
    desc: 'Instalación de paneles de grado original y calibración cromática. Reemplazo de alta precisión con sellado contra polvo y humedad.',
    icon: 'devices',
    image: '/repairservice.webp',
    reversed: false,
  },
  {
    title: 'Cambio de batería',
    desc: 'Células de energía premium con control de ciclo integrado. Restauración completa de la autonomía nominal original en minutos.',
    icon: 'battery_charging_full',
    image: '/precision_repair.jpg',
    reversed: true,
  },
  {
    title: 'Reparación de placa',
    desc: 'Micro-soldadura SMD y reconstrucción de pistas de circuitos. Diagnóstico lógico microscópico para resolver cortocircuitos complejos.',
    icon: 'memory',
    image: '/repairservice.webp',
    reversed: false,
  },
  {
    title: 'Mantenimiento',
    desc: 'Limpieza ultrasónica, optimización térmica avanzada y reemplazo de compuestos disipadores de calor.',
    icon: 'build',
    image: '/unlockservice.webp',
    reversed: true,
  },
  {
    title: 'Actualización de software',
    desc: 'Restauración de firmware oficial, optimización de velocidad, desinfección de malware y copias de seguridad lógicas.',
    icon: 'terminal',
    image: '/unlockservice.webp',
    reversed: false,
  },
  {
    title: 'Recuperación de datos',
    desc: 'Extracción forense de almacenamiento flash dañado físicamente. Técnicas avanzadas de reconstrucción lógica y clonación profunda.',
    icon: 'settings_backup_restore',
    image: '/gamingservice.webp',
    reversed: true,
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function ServicesSection() {
  return (
    <section className="py-32 px-6 sm:px-12 lg:px-16 max-w-[1440px] mx-auto">
      {/* Section Header */}
      <motion.div {...fadeUp(0)} className="mb-24">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.25em] block mb-4"
          style={{ color: 'var(--color-cyan-accent)' }}
        >
          SERVICIOS / LABORATORIO
        </span>
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.03em] leading-tight text-[var(--c-text)]"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          Ingeniería de reparación.
        </h2>
      </motion.div>

      {/* Alternating editorial blocks */}
      <div className="flex flex-col gap-32">
        {SERVICES.map((svc, i) => (
          <motion.div
            key={svc.title}
            {...fadeUp(0.1 + i * 0.05)}
            className={`flex flex-col ${svc.reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12 lg:gap-24`}
          >
            {/* Image Box - Massive size, custom zoom hover */}
            <div
              className="w-full lg:w-1/2 aspect-[16/10] rounded-[28px] overflow-hidden border relative group"
              style={{ backgroundColor: 'var(--c-bg)', borderColor: 'var(--c-border)' }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center scale-100 opacity-40 transition-all duration-[2000ms] ease-out group-hover:scale-105 group-hover:opacity-60"
                style={{ backgroundImage: `url(${svc.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--c-bg)]/80 via-transparent to-transparent opacity-40 pointer-events-none" />
            </div>

            {/* Content Box */}
            <div className="w-full lg:w-1/2 flex flex-col gap-6 items-start">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center border backdrop-blur-md"
                style={{ backgroundColor: 'var(--c-surface)', borderColor: 'var(--c-border)' }}
              >
                <MaterialIcon icon={svc.icon} size={20} style={{ color: 'var(--color-cyan-accent)' }} />
              </div>
              <h3
                className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--c-text)]"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {svc.title}
              </h3>
              <p
                className="text-sm leading-relaxed font-light"
                style={{ color: 'var(--c-text-sec)', fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {svc.desc}
              </p>
              <button
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-cyan-accent)] transition-colors duration-300 hover:text-[var(--c-text)] mt-2 cursor-pointer"
              >
                Consultar Servicio →
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
