import { useRef, useState, useCallback } from 'react';

interface Props {
  delivered: boolean;
  onDeliver: () => void;
  onUndo: () => void;
}

const TRACK_WIDTH = 80;
const KNOB_SIZE = 22;

export function DeliverToggle({ delivered, onDeliver, onUndo }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [knobX, setKnobX] = useState(delivered ? TRACK_WIDTH - KNOB_SIZE : 0);

  // Reset knob position when `delivered` prop changes externally
  const [prevDelivered, setPrevDelivered] = useState(delivered);
  if (delivered !== prevDelivered) {
    setPrevDelivered(delivered);
    setKnobX(delivered ? TRACK_WIDTH - KNOB_SIZE : 0);
  }

  const clamp = (x: number) => Math.max(0, Math.min(x, TRACK_WIDTH - KNOB_SIZE));

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!trackRef.current) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - KNOB_SIZE / 2;
    setKnobX(clamp(x));
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    const mid = (TRACK_WIDTH - KNOB_SIZE) / 2;
    if (delivered) {
      // If currently delivered, left half = undo, right half = stay
      if (knobX < mid) {
        onUndo();
        setKnobX(0);
      } else {
        setKnobX(TRACK_WIDTH - KNOB_SIZE);
      }
    } else {
      // If not delivered, right half = deliver, left half = stay
      if (knobX > mid) {
        onDeliver();
        setKnobX(TRACK_WIDTH - KNOB_SIZE);
      } else {
        setKnobX(0);
      }
    }
  }, [dragging, knobX, delivered, onDeliver, onUndo]);

  const fraction = knobX / (TRACK_WIDTH - KNOB_SIZE);

  return (
    <div className="flex items-center gap-1 select-none">
      {/* Current status label */}
      <span className={`text-[9px] font-bold px-1 py-0.5 rounded border whitespace-nowrap ${
        delivered ? 'bg-success/10 text-success border-success/25' : 'bg-white text-muted border-[#d4d8f0]'
      }`}>
        {delivered ? 'DELIVERED' : 'PENDING'}
      </span>

      {/* Slider track */}
      <div
        ref={trackRef}
        className="relative rounded-full cursor-grab active:cursor-grabbing"
        style={{ width: TRACK_WIDTH, height: KNOB_SIZE + 4 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Background track */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ background: delivered ? '#065f4620' : '#f4f6ff', border: '1px solid', borderColor: delivered ? '#065f4640' : '#d4d8f0' }}
        >
          {/* Fill that grows as knob slides */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-75"
            style={{
              width: `${fraction * 100}%`,
              background: delivered
                ? 'linear-gradient(90deg, #ef444420 0%, #f59e0b30 100%)'
                : 'linear-gradient(90deg, #10b981 0%, #10b98160 100%)',
            }}
          />
        </div>

        {/* Knob */}
        <div
          className={`absolute top-[2px] rounded-full shadow-sm border flex items-center justify-center transition-shadow ${dragging ? 'shadow-md' : ''}`}
          style={{
            width: KNOB_SIZE,
            height: KNOB_SIZE,
            left: knobX,
            background: fraction > 0.5
              ? (delivered ? '#f59e0b' : '#10b981')
              : (delivered ? '#f59e0b' : '#94a3b8'),
            borderColor: fraction > 0.5
              ? (delivered ? '#d97706' : '#059669')
              : (delivered ? '#d97706' : '#cbd5e1'),
          }}
        >
          <span className="text-white" style={{ fontSize: 10, lineHeight: 1 }}>
            {delivered ? (fraction > 0.5 ? '✓' : '↩') : (fraction > 0.5 ? '→' : '·')}
          </span>
        </div>
      </div>
    </div>
  );
}
