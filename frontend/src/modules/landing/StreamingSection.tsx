import { motion } from 'framer-motion';
import { MaterialIcon } from '../../components/ui/MaterialIcon';

const SERVICES = [
  { icon: 'live_tv', name: 'Video', desc: 'Series, películas y contenido on demand' },
  { icon: 'music_note', name: 'Música', desc: 'Tu música sin límites, en cualquier dispositivo' },
  { icon: 'devices_other', name: 'Combos', desc: 'Ahorrá combinando tus plataformas favoritas' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

export function StreamingSection() {
  return (
    <section className="flex flex-col gap-8">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: '#FFFFFF', fontFamily: '"Space Grotesk", sans-serif' }}>
          Todo tu entretenimiento, en un solo lugar
        </h2>
        <p className="text-sm leading-relaxed max-w-xl" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Cuentas y planes digitales para tus plataformas favoritas, listas para usar hoy mismo.
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {SERVICES.map((svc) => (
          <motion.div
            key={svc.name}
            variants={cardAnim}
            whileHover={{ y: -4 }}
            className="flex flex-col gap-4 rounded-xl p-6 transition-all duration-200"
            style={{
              backgroundColor: '#1A1E27',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,217,255,0.15)'; e.currentTarget.style.backgroundColor = '#1D222D'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.backgroundColor = '#1A1E27'; }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(0,217,255,0.06)' }}
            >
              <MaterialIcon icon={svc.icon} size={20} style={{ color: 'rgba(0,217,255,0.7)' }} />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                {svc.name}
              </h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {svc.desc}
              </p>
            </div>

            <button
              className="mt-auto w-full py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
              style={{
                backgroundColor: 'rgba(0,217,255,0.08)',
                color: '#00D9FF',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,217,255,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,217,255,0.08)'; }}
            >
              Activar ahora
            </button>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
