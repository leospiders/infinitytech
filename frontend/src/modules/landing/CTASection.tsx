import { motion } from 'framer-motion';
import { WHATSAPP_URL } from '../../config';

export function CTASection() {
  return (
    <section className="py-32 px-6 sm:px-12 lg:px-16 relative overflow-hidden"
      style={{ backgroundColor: '#1A1953' }}>
      {/* Blue glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-[0.12] blur-[120px] pointer-events-none"
        style={{ backgroundColor: '#2F2FE4' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center gap-8 relative z-10"
      >
        <h2 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-[-0.03em] leading-[0.92] max-w-3xl"
          style={{ fontFamily: '"Space Grotesk", sans-serif', color: '#FFFFFF' }}>
          {'READY'.split('').map((letter, i) => (
            <span key={i} className="inline-block"
              style={{
                background: i >= 3
                  ? 'linear-gradient(135deg, #2F2FE4 0%, #00C8F8 100%)'
                  : 'none',
                WebkitBackgroundClip: i >= 3 ? 'text' : 'none',
                WebkitTextFillColor: i >= 3 ? 'transparent' : 'none',
                backgroundClip: i >= 3 ? 'text' : 'none',
              }}
            >{letter}</span>
          ))}
          <br />
          <span>TO</span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #2F2FE4 0%, #00C8F8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            UPGRADE?
          </span>
        </h2>

        <p className="text-sm max-w-md" style={{ color: '#A5A5A5' }}>
          Consultanos sin compromiso. Respondemos en minutos.
        </p>

        <a
          href={`${WHATSAPP_URL}?text=${encodeURIComponent('Hola! Quiero consultar por una reparación')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 mt-4"
          style={{ backgroundColor: '#2F2FE4', color: '#FFFFFF' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#3B3BF0'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(47,47,228,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#2F2FE4'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          Contactar ahora →
        </a>
      </motion.div>
    </section>
  );
}
