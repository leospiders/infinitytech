import { motion } from 'framer-motion';
import { MarqueeTicker } from './MarqueeTicker';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
});

interface Props {
  onExplore: () => void;
  onRequestRepair: () => void;
}

export function HeroPrincipal({ onExplore, onRequestRepair }: Props) {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: "url('/hero_technician.jpg')" }}
      />

      {/* Dark overlay with gradient — darker at bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080616]/70 via-[#080616]/50 to-[#080616]/90" />

      {/* Subtle blue glow top-right */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[120px] pointer-events-none"
        style={{ backgroundColor: '#2F2FE4' }}
      />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-center px-6 sm:px-12 lg:px-16 max-w-[1440px] mx-auto">
        <div className="max-w-2xl">
          {/* Badge */}
          <motion.div
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.2em] mb-6"
            style={{
              backgroundColor: 'rgba(47,47,228,0.12)',
              border: '1px solid rgba(47,47,228,0.2)',
              color: '#00C8F8',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#00C8F8' }} />
            SERVICIO TÉCNICO PREMIUM
          </motion.div>

          {/* Title — multi-line editorial */}
          <motion.h1
            {...fadeUp(0.15)}
            className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-[-0.03em] leading-[0.92]"
            style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#FFFFFF' }}
          >
            {'REPAIR'.split('').map((letter, i) => (
              <span
                key={i}
                className="inline-block"
                style={{
                  background: i >= 3 ? 'linear-gradient(135deg, #2F2FE4 0%, #00C8F8 100%)' : 'none',
                  WebkitBackgroundClip: i >= 3 ? 'text' : 'none',
                  WebkitTextFillColor: i >= 3 ? 'transparent' : 'none',
                  backgroundClip: i >= 3 ? 'text' : 'none',
                }}
              >
                {letter}
              </span>
            ))}
            <br />
            <span className="text-white">WITHOUT</span>
            <br />
            <span
              className="inline-block"
              style={{
                background: 'linear-gradient(135deg, #2F2FE4 0%, #00C8F8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              LIMITS
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.3)}
            className="text-sm sm:text-base mt-6 max-w-md leading-relaxed"
            style={{ color: '#A5A5A5' }}
          >
            Repuestos originales, reparación de precisión y tecnología premium para tus dispositivos. Más de 10 años devolviéndole la vida a tu equipo.
          </motion.p>

          {/* Buttons */}
          <motion.div
            {...fadeUp(0.45)}
            className="flex items-center gap-4 mt-10"
          >
            <button
              onClick={onExplore}
              className="px-8 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300"
              style={{
                backgroundColor: '#2F2FE4',
                color: '#FFFFFF',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3B3BF0'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(47,47,228,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2F2FE4'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              Explorar inventario
            </button>
            <button
              onClick={onRequestRepair}
              className="px-8 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300"
              style={{
                backgroundColor: 'transparent',
                color: '#EAEAEA',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            >
              Solicitar reparación
            </button>
          </motion.div>
        </div>
      </div>

      {/* Infinite ticker at bottom */}
      <MarqueeTicker />
    </section>
  );
}
