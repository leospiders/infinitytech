import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    quote: "La precisión milimétrica en la reparación de mi MacBook Pro fue asombrosa. Infinity Tech no es una tienda de servicio técnico común; es un laboratorio de alta costura tecnológica.",
    author: "Elena Rostova",
    role: "Directora de Arte, Studio V",
    image: "/testimonial_1.jpg",
  },
  {
    quote: "Encontrar repuestos originales para hardware de desarrollo no suele ser fácil. En Infinity Tech el stock está siempre actualizado y la atención es impecable. Confianza absoluta.",
    author: "Marcus Vance",
    role: "Ingeniero de Hardware, N-Link",
    image: "/testimonial_2.jpg",
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
});

export function TestimonialsSection() {
  return (
    <section className="py-32 px-6 sm:px-12 lg:px-16 max-w-[1440px] mx-auto overflow-hidden">
      <motion.div {...fadeUp(0)} className="mb-20">
        <span
          className="text-[11px] font-semibold uppercase tracking-[0.25em] block mb-4"
          style={{ color: 'var(--color-cyan-accent)' }}
        >
          TESTIMONIOS
        </span>
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-[-0.02em] leading-tight text-[var(--c-text)]"
          style={{ fontFamily: '"Space Grotesk", sans-serif' }}
        >
          Diseñado para durar.
          <br />
          Valorado por profesionales.
        </h2>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
        {TESTIMONIALS.map((t, i) => (
          <motion.div
            key={t.author}
            {...fadeUp(0.15 + i * 0.15)}
            className="flex-1 flex flex-col md:flex-row lg:flex-col items-start gap-8 lg:gap-10"
          >
            {/* Editorial Portrait Container */}
            <div className="w-full md:w-[240px] lg:w-full aspect-[3/4] rounded-[28px] overflow-hidden relative group border"
              style={{ borderColor: 'var(--c-border)' }}>
              {/* Zooming background image */}
              <div
                className="absolute inset-0 bg-cover bg-center scale-100 transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                style={{ backgroundImage: `url(${t.image})` }}
              />
              {/* Cold blue shadow overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-bg)] via-transparent to-transparent opacity-80 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[var(--c-primary)]/10 via-transparent to-transparent opacity-50 transition-opacity duration-700 group-hover:opacity-80 pointer-events-none" />
            </div>

            {/* Testimonial Text */}
            <div className="flex-1 flex flex-col justify-between py-2">
              <blockquote
                className="text-lg sm:text-xl lg:text-2xl font-light leading-relaxed mb-6"
                style={{ fontFamily: '"Space Grotesk", sans-serif', color: 'var(--c-text)' }}
              >
                “{t.quote}”
              </blockquote>
              <div>
                <cite
                  className="not-italic text-sm font-bold block"
                  style={{ fontFamily: '"Space Grotesk", sans-serif', color: 'var(--c-text)' }}
                >
                  {t.author}
                </cite>
                <span
                  className="text-xs uppercase tracking-wider block mt-1"
                  style={{ color: 'var(--c-text-sec)' }}
                >
                  {t.role}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
