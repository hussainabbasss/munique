import Link from "next/link";
import type { CSSProperties } from "react";

type StatusBannerProps = {
  message?: string;
  href?: string;
  visible?: boolean;
};

const DEFAULT_MESSAGE = "Registration is live — register now";

export function StatusBanner({
  message = DEFAULT_MESSAGE,
  href = "/register",
  visible = true,
}: StatusBannerProps) {
  if (!visible) return null;

  const items = Array.from({ length: 8 }, (_, index) => (
    <span key={index} className="wire-item" aria-hidden={index > 0}>
      <span className="wire-dot" aria-hidden />
      {message}
    </span>
  ));

  return (
    <div className="wire" role="region" aria-label="Conference status">
      <Link href={href} className="wire-link marquee">
        <div
          className="marquee-track"
          style={{ "--marquee-duration": "26s" } as CSSProperties}
        >
          {items}
        </div>
      </Link>
    </div>
  );
}
