import React from "react";

interface ReformatorLogoProps {
  className?: string;
  color?: string;
}

export function ReformatorLogo({ className = "", color = "currentColor" }: ReformatorLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M8 8h4.5c1.38 0 2.5 1.12 2.5 2.5S13.88 13 12.5 13H8V8z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M8 8v8"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 13l4 3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
