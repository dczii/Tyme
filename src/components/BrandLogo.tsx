import React from 'react';

interface BrandLogoProps {
  className?: string; // Tailwind overrides
  size?: number;      // Height/Width size for 1:1 ratio
  showBackground?: boolean;
}

export default function BrandLogo({ className = "", size = 44, showBackground = true }: BrandLogoProps) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      width={size} 
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Tyme logo</title>
      {showBackground && <rect x="0" y="0" width="100" height="100" rx="20" fill="#1A0F0A"/>}

      <rect x="17" y="9" width="66" height="9.5" rx="4.75" fill="#5C3D28"/>
      <rect x="25" y="21.5" width="50" height="8.4" rx="4.2" fill="#4A2C1A"/>
      <rect x="33" y="33" width="34" height="7.4" rx="3.7" fill="#3D2314"/>
      <rect x="41" y="43.5" width="18" height="6.3" rx="3.15" fill="#3D2314"/>
      <rect x="41" y="50.2" width="18" height="6.3" rx="3.15" fill="#E8651A" opacity={0.5}/>
      <rect x="33" y="59.6" width="34" height="7.4" rx="3.7" fill="#E8651A" opacity={0.72}/>
      <rect x="25" y="70.1" width="50" height="8.4" rx="4.2" fill="#E8651A" opacity={0.86}/>
      <rect x="17" y="81.5" width="66" height="9.5" rx="4.75" fill="#E8651A"/>
    </svg>
  );
}
