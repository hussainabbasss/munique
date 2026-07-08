import type { SVGProps } from "react";

type SealLineProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

/**
 * Line-art edition of the Munique seal drawn entirely in currentColor,
 * for use on cobalt / ink surfaces where the full-color mark would clash.
 */
export function SealLine({
  title = "Munique 2026 official seal",
  className,
  ...props
}: SealLineProps) {
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
      <circle cx="160" cy="160" r="148" stroke="currentColor" strokeWidth="3" />
      <circle
        cx="160"
        cy="160"
        r="132"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <circle cx="160" cy="160" r="118" stroke="currentColor" strokeWidth="1" />
      <circle
        cx="160"
        cy="148"
        r="52"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <ellipse
        cx="160"
        cy="148"
        rx="52"
        ry="20"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.8"
      />
      <ellipse
        cx="160"
        cy="148"
        rx="20"
        ry="52"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.8"
      />
      <line
        x1="108"
        y1="148"
        x2="212"
        y2="148"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.8"
      />
      <line
        x1="160"
        y1="96"
        x2="160"
        y2="200"
        stroke="currentColor"
        strokeWidth="0.75"
        opacity="0.8"
      />
      <path
        d="M128 178c0-12 8-20 16-24 8 4 16 12 16 24v28h-32v-28z"
        fill="currentColor"
      />
      <path
        d="M160 172c0-10 6-16 12-20 6 4 12 10 12 20v34h-24v-34z"
        fill="currentColor"
      />
      <path
        d="M192 178c0-12 8-20 16-24 8 4 16 12 16 24v28h-32v-28z"
        fill="currentColor"
      />
      <path
        d="M72 160c20-40 48-58 88-58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M248 160c-20-40-48-58-88-58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M72 160c20 40 48 58 88 58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M248 160c-20 40-48 58-88 58"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
