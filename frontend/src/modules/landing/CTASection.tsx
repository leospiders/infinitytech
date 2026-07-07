import { motion } from 'framer-motion';
import { WHATSAPP_URL } from '../../config';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function CTASection() {
  return (
    <section
      className="py-40 px-6 sm:px-12 lg:px-16 relative overflow-hidden border-t border-b"
      style={{
        backgroundColor: 'var(--c-surface)',
        borderColor: 'var(--c-border)',
      }}
    >
      {/* Dynamic ambient blue light inside CTA */}
      <div
        className="absolute -top-60 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full opacity-10 blur-[130px] pointer-events-none"
        style={{ backgroundColor: 'var(--c-primary)' }}
      />
      <div
        className="absolute -bottom-40 right-0 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] pointer-events-none"
        style={{ backgroundColor: 'var(--color-cyan-accent)' }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <motion.div
        {...fadeUp(0)}
        className="flex flex-col items-center text-center gap-10 relative z-10"
      >
        <h2
          className="text-7xl sm:text-8xl lg:text-9xl font-black tracking-[-0.04em] leading-[0.85] max-w-4xl text-[var(--c-text)]"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          <span className="block">READY</span>
          <span className="block opacity-30">TO</span>
          <span
            className="block"
            style={{
              background: 'linear-gradient(135deg, var(--color-cyan-accent) 0%, var(--c-text) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            UPGRADE?
          </span>
        </h2>

        <p
          className="text-sm max-w-md leading-relaxed font-light mt-4"
          style={{ color: 'var(--c-text-sec)', fontFamily: '"Space Grotesk", sans-serif' }}
        >
          Escríbanos directamente para programar una cita o solicitar asistencia inmediata. Respuestas garantizadas por ingenieros de laboratorio.
        </p>

        <a
          href={`${WHATSAPP_URL}?text=${encodeURIComponent('Hola! Quiero consultar por una reparación')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-10 py-4.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all duration-300 mt-6 cursor-pointer"
          style={{
            backgroundColor: 'var(--c-primary)',
            color: 'var(--c-bg)',
            fontFamily: '"Space Grotesk", sans-serif',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.filter = 'brightness(1.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 217, 255, 0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.filter = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Contactar ahora →
        </a>
      </motion.div>
    </section>
  );
}
