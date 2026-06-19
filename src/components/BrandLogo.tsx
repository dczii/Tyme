import React from 'react';

interface BrandLogoProps {
  className?: string; // Tailwind overrides
  size?: number;      // Height/Width size for 1:1 ratio
}

export default function BrandLogo({ className = "", size = 44 }: BrandLogoProps) {
  return (
    <svg 
      viewBox="0 0 300 300" 
      width={size} 
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(150,150)">
        <circle cx="0" cy="0" r="90" fill="none" stroke="#2a1b12" strokeWidth="8"/>
        <circle cx="0" cy="0" r="90"
          fill="none"
          stroke="#dda67a"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="452 565"
          transform="rotate(-90)"
        />
        <circle cx="0" cy="0" r="72" fill="none" stroke="#1e1109" strokeWidth="1"/>
        <circle cx="0" cy="0" r="58" fill="#140d0a" stroke="#3e271a" strokeWidth="1.5"/>
        <line x1="-20" y1="-12" x2="20" y2="-12" stroke="#dda67a" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="0" y1="-10" x2="0" y2="28" stroke="#dda67a" strokeWidth="0.8" strokeLinecap="round" opacity={0.5}/>
        <circle cx="-85" cy="-28" r="6" fill="#dda67a"/>
        <circle cx="-85" cy="-28" r="3" fill="#ffdda6"/>
      </g>
    </svg>
  );
}
