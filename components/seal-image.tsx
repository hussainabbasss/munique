"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MuniqueSeal } from "@/components/munique-seal";

type SealImageProps = {
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
};

export function SealImage({
  alt,
  width,
  height,
  className,
  priority = false,
  decorative = false,
}: SealImageProps) {
  const [pngAvailable, setPngAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/logo.png", { method: "HEAD" })
      .then((response) => setPngAvailable(response.ok))
      .catch(() => setPngAvailable(false));
  }, []);

  if (pngAvailable !== true) {
    return (
      <MuniqueSeal
        aria-hidden={decorative || undefined}
        aria-label={decorative ? undefined : alt}
        className={className}
        width={width}
        height={height}
      />
    );
  }

  return (
    <Image
      src="/logo.png"
      alt={decorative ? "" : alt}
      width={width}
      height={height}
      priority={priority}
      aria-hidden={decorative || undefined}
      className={className}
      onError={() => setPngAvailable(false)}
    />
  );
}
