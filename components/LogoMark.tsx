"use client";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * InboxPilot logo mark — SVG envelope with an AI spark/bolt.
 * Renders cleanly at any size. Uses currentColor for the spark so it
 * inherits text colour, and a CSS var for the amber glow.
 */
export default function LogoMark({ size = 28, className = "" }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Envelope body */}
      <rect x="2" y="7" width="28" height="19" rx="3.5" fill="#f0a030" fillOpacity="0.12" stroke="#f0a030" strokeWidth="1.5" />

      {/* Envelope flap / chevron */}
      <polyline
        points="2,10 16,19 30,10"
        stroke="#f0a030"
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />

      {/* AI spark — lightning bolt centred on envelope */}
      <path
        d="M17.5 6 L14 13.5 H17 L14.5 20 L21 12 H17.5 L20 6 Z"
        fill="#f0a030"
        stroke="#111"
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
