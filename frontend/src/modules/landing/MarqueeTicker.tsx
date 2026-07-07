import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const ITEMS = [
  "REPARACIONES",
  "CONSOLAS",
  "ACCESORIOS",
  "REPUESTOS",
  "GARANTÍA",
  "SERVICIO TÉCNICO",
  "STREAMING",
];

export function MarqueeTicker() {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) setWidth(ref.current.scrollWidth / 2);
  }, []);

  return (
    <div
      className="relative left-0 right-0 border-t border-b overflow-hidden z-20"
      style={{
        borderColor: "var(--c-border)",
        backgroundColor: "var(--c-bg)",
        opacity: 0.95,
      }}
    >
      <div className="py-5">
        <motion.div
          ref={ref}
          animate={{ x: [0, -width] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-16 whitespace-nowrap cursor-default"
        >
          {[...ITEMS, ...ITEMS].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-6 group transition-all duration-300"
            >
              <span
                className="text-xs font-bold tracking-[0.2em] transition-all duration-300 select-none"
                style={{
                  color: "var(--c-text)",
                  fontFamily: '"Space Grotesk", sans-serif',
                }}
              >
                {item}
              </span>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: "var(--color-cyan-accent)",
                  boxShadow: "0 0 8px var(--color-cyan-accent)",
                }}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
