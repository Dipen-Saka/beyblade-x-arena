"use client";
import Image from "next/image";
import { useState } from "react";
import { PartType } from "@/lib/types";

interface PartImageProps {
  src: string | null;
  name: string;
  type: PartType;
  size?: number;
  className?: string;
}

const TYPE_COLORS: Record<PartType, string> = {
  blade:   "border-[#f0b429]/30 bg-[#f0b429]/10",
  ratchet: "border-[#3b82f6]/30 bg-[#3b82f6]/10",
  bit:     "border-[#ef4444]/30 bg-[#ef4444]/10",
};

const TYPE_LABELS: Record<PartType, string> = {
  blade:   "BLD",
  ratchet: "RTC",
  bit:     "BIT",
};

export default function PartImage({ src, name, type, size = 64, className = "" }: PartImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div
        className={`flex flex-col items-center justify-center border rounded-lg ${TYPE_COLORS[type]} ${className}`}
        style={{ width: size, height: size, minWidth: size }}
      >
        <span className="font-orbitron text-[9px] tracking-widest opacity-50">
          {TYPE_LABELS[type]}
        </span>
        <span className="text-[8px] text-[#55556a] mt-0.5 text-center px-1 leading-tight truncate w-full text-center">
          {name.split(" ")[0]}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative border rounded-lg overflow-hidden ${TYPE_COLORS[type]} ${className}`}
      style={{ width: size, height: size, minWidth: size }}
    >
      <Image
        src={src}
        alt={name}
        fill
        className="object-contain p-1"
        onError={() => setError(true)}
        sizes={`${size}px`}
      />
    </div>
  );
}
