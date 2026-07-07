import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const DOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function pos(n: number, size: number, gap: number): [number, number] {
  const off = (size - gap * 2) / 2;
  const row = Math.floor((n - 1) / 3);
  const col = (n - 1) % 3;
  return [off + col * gap, off + row * gap];
}

function pointInCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

export function PatternLock({ value, onChange, disabled }: Props) {
  const [pattern, setPattern] = useState<number[]>(value ? value.split(',').map(Number) : []);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastDotRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Responsive size: bigger on mobile for touch accuracy
  const [size, setSize] = useState(200);
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 768) setSize(260);
      else setSize(200);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const { t } = useTranslation();

  const r = Math.round(size * 0.05);
  const gap = Math.round(size * 0.325);
  const padding = 15;

  const getDotAtPoint = useCallback((clientX: number, clientY: number): number | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const viewSize = size + padding * 2;
    // Map from rendered pixels → viewBox coordinates → grid space (after translate)
    const scaleX = viewSize / rect.width;
    const scaleY = viewSize / rect.height;
    const x = (clientX - rect.left) * scaleX - padding;
    const y = (clientY - rect.top) * scaleY - padding;
    for (const n of DOTS) {
      const [cx, cy] = pos(n, size, gap);
      if (pointInCircle(x, y, cx, cy, r + 10)) return n;
    }
    return null;
  }, [size, gap, r]);

  const startDrawing = useCallback((n: number) => {
    if (disabled) return;
    setIsDrawing(true);
    setPattern([n]);
    lastDotRef.current = n;
    onChange(String(n));
  }, [disabled, onChange]);

  const addToPattern = useCallback((n: number) => {
    if (!isDrawing || disabled) return;
    if (pattern.includes(n) || lastDotRef.current === n) return;
    const next = [...pattern, n];
    setPattern(next);
    lastDotRef.current = n;
    onChange(next.join(','));
  }, [isDrawing, disabled, pattern, onChange]);

  const finishDrawing = useCallback(() => {
    setIsDrawing(false);
    lastDotRef.current = null;
  }, []);

  const handleClear = useCallback(() => {
    setPattern([]);
    setIsDrawing(false);
    lastDotRef.current = null;
    onChange('');
  }, [onChange]);

  // Unified pointer: find dot under cursor/finger, start or extend pattern
  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    if (disabled) return;
    const n = getDotAtPoint(clientX, clientY);
    if (n !== null) startDrawing(n);
  }, [disabled, getDotAtPoint, startDrawing]);

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!isDrawing || disabled) return;
    const n = getDotAtPoint(clientX, clientY);
    if (n !== null) addToPattern(n);
  }, [isDrawing, disabled, getDotAtPoint, addToPattern]);

  // Mouse handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handlePointerDown(e.clientX, e.clientY);
  }, [handlePointerDown]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handlePointerMove(e.clientX, e.clientY);
  }, [handlePointerMove]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    handlePointerDown(t.clientX, t.clientY);
  }, [handlePointerDown]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    handlePointerMove(t.clientX, t.clientY);
  }, [handlePointerMove]);

  const viewSize = size + padding * 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={finishDrawing}
        onTouchCancel={finishDrawing}
        className="user-none"
        style={{ touchAction: 'none' }}
      >
        <g transform={`translate(${padding},${padding})`}>
          {/* Lines between dots */}
          {pattern.length > 1 && pattern.slice(0, -1).map((n, i) => {
            const [x1, y1] = pos(n, size, gap);
            const [x2, y2] = pos(pattern[i + 1], size, gap);
            return (
              <line key={`l-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
            );
          })}
          {/* Arrow at end */}
          {pattern.length > 1 && (() => {
            const last = pattern[pattern.length - 1];
            const prev = pattern[pattern.length - 2];
            const [x1, y1] = pos(prev, size, gap);
            const [x2, y2] = pos(last, size, gap);
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const aLen = 6;
            const ax = x2 - Math.cos(angle) * r;
            const ay = y2 - Math.sin(angle) * r;
            return (
              <polygon
                points={`${ax},${ay} ${ax - aLen * Math.cos(angle - 0.5)},${ay - aLen * Math.sin(angle - 0.5)} ${ax - aLen * Math.cos(angle + 0.5)},${ay - aLen * Math.sin(angle + 0.5)}`}
                fill="#4f46e5"
              />
            );
          })()}
          {/* Dots */}
          {DOTS.map(n => {
            const [cx, cy] = pos(n, size, gap);
            const active = pattern.includes(n);
            return (
              <g key={n}>
                {active && (
                  <circle cx={cx} cy={cy} r={r + 4} fill="#4f46e5" opacity="0.12" />
                )}
                <circle cx={cx} cy={cy} r={r}
                  fill={active ? '#4f46e5' : 'none'}
                  stroke={active ? '#4f46e5' : '#cbd5e1'}
                  strokeWidth="2" />
              </g>
            );
          })}
        </g>
      </svg>
      <div className="flex items-center gap-2">
        {pattern.length > 0 && (
          <span className="text-xs text-muted">
            {t('patternLock.pointsSelected', { count: pattern.length })}
          </span>
        )}
        <button type="button" onClick={handleClear}
          className="text-[10px] text-muted hover:text-brand transition-colors">
          {t('patternLock.clear')}
        </button>
      </div>
    </div>
  );
}
