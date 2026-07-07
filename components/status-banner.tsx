import Link from "next/link";

type StatusBannerProps = {
  message?: string;
  href?: string;
  visible?: boolean;
};

const DEFAULT_MESSAGE = "REGISTRATION IS LIVE · REGISTER NOW →";

export function StatusBanner({
  message = DEFAULT_MESSAGE,
  href = "/register",
  visible = true,
}: StatusBannerProps) {
  if (!visible) return null;

  const items = Array.from({ length: 6 }, (_, index) => (
    <span key={index} className="status-banner-item" aria-hidden={index > 0}>
      {message}
    </span>
  ));

  return (
    <div className="status-banner" role="region" aria-label="Conference status">
      <Link href={href} className="status-banner-link">
        <div className="status-banner-track">{items}</div>
      </Link>
    </div>
  );
}
