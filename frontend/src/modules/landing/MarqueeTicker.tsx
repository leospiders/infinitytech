import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const ITEMS = [
  'REPARACIÓN EXPRESS', 'REPUESTOS ORIGINALES', 'GARANTÍA',
  'STOCK DISPONIBLE', 'ACCESORIOS', 'SERVICIO TÉCNICO',
];

export function MarqueeTicker() {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) setWidth(ref.current.scrollWidth / 2);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 right-0 overflow-hidden border-t border-white/5">
      <div className="py-4">
        <motion.div
          ref={ref}
          animate={{ x: [0, -width] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 whitespace-nowrap"
        >
          {[...ITEMS, ...ITEMS].map((item, i) => (
            <span
              key={i}
              className="text-[11px] font-semibold tracking-[0.25em] uppercase"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
