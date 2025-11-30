
import React from 'react';

export const Logo = ({ className = "h-12" }: { className?: string }) => (
  <svg viewBox="0 0 300 100" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Text JDG */}
    <g transform="translate(10, 10)">
      <text x="0" y="60" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="70" fill="#b0d12a">J</text>
      <text x="45" y="60" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="70" fill="#00797b">DG</text>
    </g>
    
    {/* Box TELECO */}
    <rect x="15" y="70" width="150" height="25" fill="#00797b" rx="2" />
    <text x="90" y="88" fontFamily="Courier New, monospace" fontWeight="bold" fontSize="20" fill="white" textAnchor="middle" letterSpacing="2">TELECO</text>

    {/* Swirl Icon */}
    <g transform="translate(200, 50)">
      <circle cx="0" cy="0" r="35" fill="none" stroke="#00797b" strokeWidth="4" />
      <circle cx="0" cy="0" r="25" fill="none" stroke="#b0d12a" strokeWidth="4" strokeDasharray="40 20" transform="rotate(45)" />
      <circle cx="0" cy="0" r="15" fill="none" stroke="#00797b" strokeWidth="4" strokeDasharray="30 10" transform="rotate(-20)" />
      <circle cx="0" cy="0" r="5" fill="#e11d48" />
    </g>
  </svg>
);
