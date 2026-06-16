import React from 'react';

interface BrandLogoProps {
  className?: string; // Tailwind overrides
  size?: number;      // Height size, width is automatically scaled
}

export default function BrandLogo({ className = "", size = 44 }: BrandLogoProps) {
  return (
    <svg 
      viewBox="0 0 180 120" 
      width={size * 1.5} 
      height={size}
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer dark brown circle/hook on the left */}
      <path 
        d="M 80 34 A 36 36 0 1 0 80 86" 
        stroke="#423124" 
        strokeWidth="10" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* Inner beige clock face circle / left lobe */}
      <circle 
        cx="54" 
        cy="60" 
        r="21" 
        stroke="#c5b3a6" 
        strokeWidth="6" 
        fill="none" 
      />

      {/* Chocolate brown clock hand inside the left lobe */}
      <path 
        d="M 54 45 L 54 60 L 67 66" 
        stroke="#423124" 
        strokeWidth="5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none" 
      />

      {/* Beige infinity ribbon / loop connecting left and right */}
      {/* Smoothly curves backwards and forwards forming infinity crossover */}
      <path 
        d="M 54 81 C 74 81, 104 39, 126 39 A 21 21 0 0 1 147 60 A 21 21 0 0 1 126 81 C 104 81, 74 39, 54 39" 
        stroke="#c5b3a6" 
        strokeWidth="8" 
        strokeLinecap="round" 
        fill="none" 
      />

      {/* Dark brown sweeping arrow inside the right lobe */}
      <path 
        d="M 94 72 C 108 55, 122 55, 140 55" 
        stroke="#423124" 
        strokeWidth="8" 
        strokeLinecap="round" 
        fill="none" 
      />
      
      {/* Arrow head */}
      <path 
        d="M 134 46 L 151 55 L 134 64 Z" 
        fill="#423124" 
      />
    </svg>
  );
}
