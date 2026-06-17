import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 text-accent ${className}`}
    aria-hidden
  >
    <rect width="64" height="64" rx="14" fill="#050505" />
    <text
      x="32"
      y="47"
      textAnchor="middle"
      fill="currentColor"
      fontFamily="JetBrains Mono, ui-monospace, monospace"
      fontSize="40"
      fontWeight="700"
    >
      A
    </text>
  </svg>
);

export default Logo;
