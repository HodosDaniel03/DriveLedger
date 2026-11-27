import React, { useState } from 'react';

const SIZE_MAP = {
  xs: {
    icon: 'w-7 h-[18px]',
    svgWidth: 28,
    svgHeight: 18,
    text: 'text-sm',
    gap: 'gap-1.5',
    img: 'h-6 w-auto',
    imgWidth: 120,
    imgHeight: 24,
  },
  sm: {
    icon: 'w-8 h-5',
    svgWidth: 32,
    svgHeight: 20,
    text: 'text-base',
    gap: 'gap-2',
    img: 'h-7 w-auto',
    imgWidth: 140,
    imgHeight: 28,
  },
  md: {
    icon: 'w-9 h-[23px] sm:w-10 sm:h-[25px]',
    svgWidth: 40,
    svgHeight: 25,
    text: 'text-base sm:text-lg',
    gap: 'gap-2 sm:gap-2.5',
    img: 'h-7 sm:h-8 w-auto',
    imgWidth: 160,
    imgHeight: 32,
  },
  lg: {
    icon: 'w-12 h-[30px]',
    svgWidth: 48,
    svgHeight: 30,
    text: 'text-xl sm:text-2xl',
    gap: 'gap-2.5',
    img: 'h-9 sm:h-10 w-auto',
    imgWidth: 200,
    imgHeight: 40,
  },
};

/**
 * BrandLogo Component
 * Official DriveLedger segmented emerald gauge emblem & geometric wordmark.
 *
 * - Icon: #10B981 segmented speedometer gauge (6 outer arc segments, inner arc,
 *   42° up-right needle, and hollow center pivot ring).
 * - Wordmark: Bold geometric sans-serif "Drive" (#0F172A / dark #F8FAFC)
 *   + "Ledger" (#10B981).
 * - Hybrid image support: pass `imgSrc="/DriveLedgeremblem.png"` when bitmap
 *   rendering is desired; automatically falls back to crisp inline SVG + keeps
 *   accessible "DriveLedger" text in the DOM.
 */
export default function BrandLogo({
  size = 'md',
  showWordmark = true,
  imgSrc = '',
  className = '',
  iconClassName = '',
  wordmarkClassName = '',
  ...props
}) {
  const [imgError, setImgError] = useState(false);
  const scale = SIZE_MAP[size] || SIZE_MAP.md;

  if (imgSrc && !imgError) {
    return (
      <span
        className={`inline-flex items-center shrink-0 select-none ${className}`}
        {...props}
      >
        <img
          src={imgSrc}
          alt="DriveLedger"
          width={scale.imgWidth}
          height={scale.imgHeight}
          onError={() => setImgError(true)}
          className={`${scale.img} object-contain shrink-0`}
        />
        <span className="sr-only">DriveLedger</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${scale.gap} shrink-0 select-none ${className}`}
      {...props}
    >
      <svg
        viewBox="0 0 64 40"
        width={scale.svgWidth}
        height={scale.svgHeight}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className={`${scale.icon} shrink-0 ${iconClassName}`}
      >
        {/* 6 Outer Gauge Arc Segments */}
        <g stroke="#10B981" strokeWidth="5.4" strokeLinecap="butt" fill="none">
          <path d="M 9 31 A 23 23 0 0 1 11.33 20.92" />
          <path d="M 12.24 19.22 A 23 23 0 0 1 19.41 11.75" />
          <path d="M 21.06 10.77 A 23 23 0 0 1 31.04 8.02" />
          <path d="M 32.96 8.02 A 23 23 0 0 1 42.94 10.77" />
          <path d="M 44.59 11.75 A 23 23 0 0 1 51.76 19.22" />
          <path d="M 52.67 20.92 A 23 23 0 0 1 55 31" />
        </g>

        {/* Inner Concentric Gauge Arc */}
        <path
          d="M 17.88 29.52 A 14.2 14.2 0 0 1 40.35 19.51"
          stroke="#10B981"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />

        {/* 42° Up-Right Needle */}
        <polygon points="34.18,26.55 46.57,17.89 36.66,29.30" fill="#10B981" />

        {/* Hollow Center Pivot Ring */}
        <circle cx="32" cy="31" r="4.2" stroke="#10B981" strokeWidth="2.6" fill="none" />
      </svg>

      {showWordmark ? (
        <span
          className={`font-sans font-extrabold ${scale.text} tracking-tight leading-none ${wordmarkClassName}`}
        >
          <span className="text-[#0F172A] dark:text-[#F8FAFC] print:text-[#0F172A]">
            Drive
          </span>
          <span className="text-[#047857] dark:text-[#10B981]">Ledger</span>
        </span>
      ) : (
        <span className="sr-only">DriveLedger</span>
      )}
    </span>
  );
}
