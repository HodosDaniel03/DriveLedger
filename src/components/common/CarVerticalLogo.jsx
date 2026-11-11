import React, { useState } from 'react';

/**
 * CarVerticalLogo Component
 * Renders the official carVertical brand logo served from /carvertical-logo.png
 * with an inline SVG fallback in case the static asset fails to load.
 *
 * Implements carVertical Brand Asset Usage Rules:
 * Wraps in a high-contrast white pill background by default so the official
 * #0068FF blue wordmark maintains contrast across both light and dark themes.
 */
export default function CarVerticalLogo({
  className = '',
  imgClassName = 'h-5 w-auto object-contain',
  withPill = true,
  alt = 'carVertical',
  ...props
}) {
  const [hasError, setHasError] = useState(false);

  const logoNode = !hasError ? (
    <img
      src="/carvertical-logo.png"
      alt={alt}
      onError={() => setHasError(true)}
      className={imgClassName}
      loading="lazy"
      {...props}
    />
  ) : (
    <svg
      viewBox="0 0 160 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={imgClassName}
      aria-label={alt}
      role="img"
      {...props}
    >
      <rect width="28" height="28" rx="6" fill="#0068FF" />
      <path
        d="M7.5 14.5L12 19L20.5 9"
        stroke="#FFFFFF"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="36"
        y="19"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="16"
        fontWeight="800"
        letterSpacing="-0.3px"
        fill="#0068FF"
      >
        car<tspan fontWeight="400" fill="#0068FF">Vertical</tspan>
      </text>
    </svg>
  );

  if (withPill) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg bg-white px-2.5 py-1 shadow-xs border border-zinc-200/80 transition-shadow ${className}`}
        title="carVertical — Official Vehicle History Partner"
      >
        {logoNode}
      </span>
    );
  }

  return logoNode;
}
