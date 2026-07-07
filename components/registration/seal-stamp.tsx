"use client";

import { useEffect, useState } from "react";
import { SealImage } from "@/components/seal-image";

type SealStampProps = {
  size?: number;
  animate?: boolean;
  onComplete?: () => void;
};

export function SealStamp({
  size = 96,
  animate = true,
  onComplete,
}: SealStampProps) {
  const [ready, setReady] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      onComplete?.();
      return;
    }
    const startTimer = window.setTimeout(() => setReady(true), 30);
    const completeTimer = window.setTimeout(() => onComplete?.(), 450);
    return () => {
      window.clearTimeout(startTimer);
      window.clearTimeout(completeTimer);
    };
  }, [animate, onComplete]);

  return (
    <div
      className={`seal-stamp ${ready ? "seal-stamp-animate" : ""}`}
      aria-hidden="true"
    >
      <SealImage
        alt="Munique 2026 official seal"
        width={size}
        height={size}
        decorative
      />
    </div>
  );
}
