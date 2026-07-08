"use client";

import { useEffect, useState } from "react";
import { SealLine } from "@/components/seal-line";

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
      <SealLine width={size} height={size} />
    </div>
  );
}
