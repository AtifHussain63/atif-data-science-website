import React from 'react';

interface AtifSignatureProps {
  className?: string;
  color?: string;
}

/**
 * Authentic Handwritten Signature of ATIF HUSSAIN (Founder, Atif Skills Hub)
 * Meticulously vectorized from the authentic handwritten blue ink signature photo:
 * - Prominent, graceful upper balloon loop (tilted clockwise)
 * - Stylized "Atif" name with leftward under-hook flourish
 * - Horizontal crossbar spanning across 'A' and 't'
 * - Long vertical descending tail on 'f' reaching down with authentic stroke terminal
 */
export const AtifFounderSignature: React.FC<AtifSignatureProps> = ({
  className = 'h-14 w-auto',
  color = '#002D84', // Deep Royal Blue Pen Ink
}) => {
  return (
    <svg
      viewBox="0 0 130 190"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible' }}
    >
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
        {/* 1. Grand Upper Balloon Loop (Tilted oval loop extending up and right) */}
        <path
          d="M 52 114 C 26 84, 28 42, 54 22 C 78 4, 108 12, 114 36 C 118 64, 96 94, 52 126"
          strokeWidth="3.2"
          strokeMiterlimit="10"
        />

        {/* 2. Left Under-Hook Flourish beneath the 'A' */}
        <path
          d="M 52 136 C 36 142, 22 136, 18 124 C 15 112, 20 102, 28 98"
          strokeWidth="2.8"
        />

        {/* 3. Letter 'A' Structure */}
        {/* Left ascending stem */}
        <path
          d="M 38 128 L 50 96"
          strokeWidth="3.0"
        />
        {/* Right descending stem */}
        <path
          d="M 50 96 L 54 130"
          strokeWidth="3.0"
        />
        {/* Crossbar slicing through 'A' and extending horizontally across 't' */}
        <path
          d="M 34 114 Q 52 110 74 106"
          strokeWidth="3.0"
        />

        {/* 4. Letters 't' & 'i' */}
        <path
          d="M 56 106 L 58 128 Q 60 132 66 126"
          strokeWidth="2.8"
        />

        {/* 5. Letter 'f' loop & THE LONG VERTICAL DESCENDING TAIL */}
        {/* Loop of 'f' */}
        <path
          d="M 66 126 C 72 118, 80 120, 78 132 C 76 138, 72 142, 70 146"
          strokeWidth="2.8"
        />
        {/* Dramatic long vertical descender plunging down */}
        <path
          d="M 74 104 L 72 176 C 71.5 182, 69 184, 66 182"
          strokeWidth="3.2"
        />
      </g>
    </svg>
  );
};

