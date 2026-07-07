import type { SVGProps } from "react";

type MuniqueSealProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function MuniqueSeal({
  title = "Munique 2026 official seal",
  className,
  ...props
}: MuniqueSealProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 320"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
      {...props}
    >
      <title>{title}</title>
      <circle cx="160" cy="160" r="148" stroke="#16233F" strokeWidth="4" />
      <circle cx="160" cy="160" r="132" stroke="#B4922E" strokeWidth="2.5" />
      <circle cx="160" cy="160" r="118" stroke="#16233F" strokeWidth="2" />
      <circle cx="160" cy="148" r="52" stroke="#2E4066" strokeWidth="1.5" />
      <ellipse cx="160" cy="148" rx="52" ry="20" stroke="#2E4066" strokeWidth="1" />
      <ellipse cx="160" cy="148" rx="20" ry="52" stroke="#2E4066" strokeWidth="1" />
      <line x1="108" y1="148" x2="212" y2="148" stroke="#2E4066" strokeWidth="1" />
      <line x1="160" y1="96" x2="160" y2="200" stroke="#2E4066" strokeWidth="1" />
      <path
        d="M128 178c0-12 8-20 16-24 8 4 16 12 16 24v28h-32v-28z"
        fill="#16233F"
      />
      <path
        d="M160 172c0-10 6-16 12-20 6 4 12 10 12 20v34h-24v-34z"
        fill="#16233F"
      />
      <path
        d="M192 178c0-12 8-20 16-24 8 4 16 12 16 24v28h-32v-28z"
        fill="#16233F"
      />
      <path
        d="M72 160c20-40 48-58 88-58"
        stroke="#B4922E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M248 160c-20-40-48-58-88-58"
        stroke="#B4922E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M72 160c20 40 48 58 88 58"
        stroke="#B4922E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M248 160c-20 40-48 58-88 58"
        stroke="#B4922E"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
