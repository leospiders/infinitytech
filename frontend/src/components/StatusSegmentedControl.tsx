import { useRef, useEffect, useState } from 'react';

export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: string;
}

interface Props {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
}

export function StatusSegmentedControl({ options, value, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const activeIndex = options.findIndex(opt => opt.value === value);
    if (activeIndex === -1) return;

    const button = container.children[activeIndex + 1] as HTMLElement; // +1 to skip the indicator div
    if (button) {
      setIndicatorStyle({
        left: button.offsetLeft,
        width: button.offsetWidth,
        opacity: 1
      });
    }
  }, [value, options]);

  return (
    <div
      ref={containerRef}
      role="tablist"
      className="relative flex items-center p-1 rounded-xl w-full sm:w-auto"
      style={{ backgroundColor: 'var(--c-surface)', border: '1px solid var(--c-border)' }}
    >
      <div
        className="absolute transition-all duration-300 ease-out rounded-lg"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          opacity: indicatorStyle.opacity,
          height: 'calc(100% - 8px)',
          backgroundColor: 'var(--c-primary)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      />
      
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className="relative z-10 flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold transition-colors duration-200 flex-1 sm:flex-none rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ color: isActive ? '#fff' : 'var(--c-text-sec)' }}
          >
            {opt.icon && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{opt.icon}</span>}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
