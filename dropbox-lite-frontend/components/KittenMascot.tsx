import React from "react";

export default function KittenMascot({ size = 96 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Cute Kitten Mascot"
    >
      {/* Head */}
      <ellipse cx="48" cy="56" rx="28" ry="24" fill="#F9D7B5" />
      {/* Left ear */}
      <polygon points="20,40 32,16 36,44" fill="#F9D7B5" />
      <polygon points="24,36 32,22 34,40" fill="#F7BFA0" />
      {/* Right ear */}
      <polygon points="76,40 64,16 60,44" fill="#F9D7B5" />
      <polygon points="72,36 64,22 62,40" fill="#F7BFA0" />
      {/* Face */}
      <ellipse cx="48" cy="60" rx="20" ry="16" fill="#FFF" />
      {/* Eyes */}
      <ellipse cx="40" cy="62" rx="3" ry="4" fill="#222" />
      <ellipse cx="56" cy="62" rx="3" ry="4" fill="#222" />
      {/* Nose */}
      <ellipse cx="48" cy="70" rx="2" ry="1.2" fill="#F7BFA0" />
      {/* Mouth */}
      <path
        d="M46 72 Q48 74 50 72"
        stroke="#F7BFA0"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Whiskers */}
      <path
        d="M28 68 Q36 70 40 66"
        stroke="#F7BFA0"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M68 68 Q60 70 56 66"
        stroke="#F7BFA0"
        strokeWidth="1.2"
        fill="none"
      />
      {/* Blush */}
      <ellipse cx="38" cy="70" rx="2" ry="1" fill="#F7BFA0" opacity="0.5" />
      <ellipse cx="58" cy="70" rx="2" ry="1" fill="#F7BFA0" opacity="0.5" />
    </svg>
  );
}
