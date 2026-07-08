"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  /** Stagger delay in ms, applied once the element intersects. */
  delay?: number;
  /** Entrance travel distance in px. */
  y?: number;
  as?: ElementType;
  className?: string;
};

/**
 * Scroll-entrance choreography. Content is visible by default (SSR, no-JS,
 * reduced motion, headless renderers); the pre-state is applied only after
 * mount and only for elements still below the viewport.
 */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  as: Tag = "div",
  className,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Already on screen — leave it visible, no entrance.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return;

    el.dataset.reveal = "pending";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.dataset.reveal = "in";
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = {
    "--reveal-delay": `${delay}ms`,
    "--reveal-y": `${y}px`,
  } as CSSProperties;

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Tag ref={ref as any} className={className} style={style}>
      {children}
    </Tag>
  );
}
