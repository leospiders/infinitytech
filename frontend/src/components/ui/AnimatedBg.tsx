import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface Props {
  className?: string;
}

export function AnimatedBg({ className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const els: HTMLDivElement[] = [];
    const count = 6;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const size = 60 + Math.random() * 140;
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      const opacity = 0.2 + Math.random() * 0.2;

      el.style.cssText = `
        position: absolute;
        left: ${x}%;
        top: ${y}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: radial-gradient(circle at center, rgba(0, 229, 255, ${opacity}), transparent 70%);
        pointer-events: none;
        will-change: transform;
      `;

      container.appendChild(el);
      els.push(el);

      // Float animation
      gsap.to(el, {
        x: `+=${(Math.random() - 0.5) * 80}`,
        y: `+=${(Math.random() - 0.5) * 80}`,
        duration: 10 + Math.random() * 15,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Slow rotation
      gsap.to(el, {
        rotation: 360,
        duration: 80 + Math.random() * 80,
        repeat: -1,
        ease: 'none',
      });
    }

    // Subtle scale pulse on some
    els.forEach((el, i) => {
      if (i % 2 === 0) return;
      gsap.to(el, {
        scale: 1.4,
        duration: 6 + Math.random() * 6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: Math.random() * 4,
      });
    });

    return () => {
      els.forEach((el) => {
        gsap.killTweensOf(el);
        el.remove();
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
