import type { HTMLAttributes, ReactElement } from 'react';

interface MaterialIconProps extends HTMLAttributes<HTMLSpanElement> {
  icon: string;
  fill?: boolean;
  wght?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  size?: number;
}

/**
 * Material Symbols Outlined icon component.
 * Props: icon (name), fill (bool), wght (weight), size (font-size px).
 * Default wght=400 for most contexts, wght=300 for dashboard/technician views.
 */
export function MaterialIcon({
  icon,
  fill = false,
  wght = 400,
  size,
  className = '',
  style,
  ...props
}: MaterialIconProps): ReactElement {
  const inlineStyle: Record<string, string | number> = {
    fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${wght}, 'GRAD' 0, 'opsz' 24`,
  };
  if (size) inlineStyle.fontSize = `${size}px`;
  if (style) Object.assign(inlineStyle, style);

  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={inlineStyle}
      {...props}
    >
      {icon}
    </span>
  );
}
