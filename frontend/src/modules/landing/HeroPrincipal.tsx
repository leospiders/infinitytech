import { motion } from 'framer-motion';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
});

const scaleBackground = {
  initial: { scale: 1.05, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 2.2, ease: [0.16, 1, 0.3, 1] as const },
};

interface Props {
  onExplore: () => void;
  onRequestRepair: () => void;
}

export function HeroPrincipal({ onExplore, onRequestRepair }: Props) {
  return (
    <section
      className="relative min-h-screen lg:h-screen w-full overflow-hidden flex items-center pt-28 pb-36 lg:pb-32"
      style={{ backgroundColor: 'var(--c-bg)' }}
    >
      {/* Background Image - Lab is visible, slow reveal zoom */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={scaleBackground}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero_technician.jpg')" }}
      />

      {/* Black Overlay of ~58% opacity to maintain text readability while showing lab */}
      <div className="absolute inset-0 bg-black/58 pointer-events-none" />

      {/* Ambient dark blue overlay for depth and color consistency */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-bg)] via-transparent to-[var(--c-bg)]/30 pointer-events-none" />

      {/* Radial soft blue glow behind H1 to pop text from the background */}
      <div
        className="absolute left-1/4 top-1/2 -translate-y-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full opacity-[0.22] blur-[130px] pointer-events-none select-none"
        style={{
          background: 'radial-gradient(circle, var(--c-primary) 0%, transparent 70%)',
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-16 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-12">
        {/* Left: Text Block & CTAs */}
        <div className="lg:col-span-8 flex flex-col justify-center">
          {/* Badge */}
          <motion.div
            {...fadeUp(0)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.25em] uppercase mb-8 w-fit"
            style={{
              backgroundColor: 'rgba(0, 200, 248, 0.08)',
              border: '1px solid rgba(0, 200, 248, 0.25)',
              color: 'var(--color-cyan-accent)',
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-cyan-accent)] animate-pulse" />
            LABORATORIO DE PRECISIÓN
          </motion.div>

          {/* H1 - Balanced title with gradient text using dashboard variables */}
          <motion.h1
            {...fadeUp(0.12)}
            className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black tracking-[-0.04em] leading-[0.82] select-none text-left"
            style={{ fontFamily: '"Space Grotesk", sans-serif', color: 'var(--c-text)' }}
          >
            <span className="block">REPAIR</span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, var(--c-text) 30%, var(--c-text-sec) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              WITHOUT
            </span>
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, var(--c-primary) 0%, var(--color-cyan-accent) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              LIMITS
            </span>
          </motion.h1>

          {/* Subtitle/Description - Max 60-70 characters per line */}
          <motion.p
            {...fadeUp(0.24)}
            className="text-base sm:text-lg mt-12 max-w-[520px] leading-relaxed font-light text-left"
            style={{
              color: 'var(--c-text-sec)',
              fontFamily: '"Space Grotesk", sans-serif',
            }}
          >
            Soporte técnico de alta gama y componentes de grado original. Experimente una precisión inquebrantable y un servicio exclusivo para restaurar su ecosistema tecnológico.
          </motion.p>

          {/* CTA Buttons - Using dashboard theme variables with glows */}
          <motion.div
            {...fadeUp(0.36)}
            className="flex flex-wrap items-center gap-4 mt-12"
          >
            {/* Primary Button */}
            <button
              onClick={onExplore}
              className="h-14 px-10 rounded-[20px] text-xs font-bold uppercase tracking-wider cursor-pointer shadow-[0_0_24px_rgba(0,217,255,0.15)]"
              style={{
                backgroundColor: 'var(--c-primary)',
                color: 'var(--c-bg)',
                border: 'none',
                fontFamily: '"Space Grotesk", sans-serif',
                transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.filter = 'brightness(1.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 217, 255, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.filter = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0 24px rgba(0,217,255,0.15)';
              }}
            >
              Explorar inventario
            </button>

            {/* Secondary Button */}
            <button
              onClick={onRequestRepair}
              className="h-14 px-10 rounded-[20px] text-xs font-bold uppercase tracking-wider cursor-pointer"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--c-text)',
                border: '1px solid var(--c-border)',
                fontFamily: '"Space Grotesk", sans-serif',
                transition: 'all 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--c-border)';
                e.currentTarget.style.color = 'var(--c-text)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 217, 255, 0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--c-text)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Solicitar reparación
            </button>
          </motion.div>
        </div>

        {/* Right: Left Empty for Breathing Space */}
        <div className="hidden lg:col-span-4 lg:block h-full" />
      </div>

    </section>
  );
}
