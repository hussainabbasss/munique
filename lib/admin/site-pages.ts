export type SitePageLink = {
  label: string;
  href: string;
  keywords?: string[];
};

/** Public routes available for admin link pickers (banner, CTAs, etc.). */
export const SITE_PAGE_LINKS: SitePageLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  {
    label: "Executive Board",
    href: "/eb",
    keywords: ["eb", "eb reveal", "board"],
  },
  { label: "Secretariat", href: "/secretariat" },
  { label: "Committees", href: "/committees" },
  { label: "Schedule", href: "/schedule" },
  {
    label: "Study Guides",
    href: "/study-guide",
    keywords: ["study guide", "guides"],
  },
  { label: "Contact", href: "/contact" },
  { label: "Register", href: "/register", keywords: ["registration"] },
  {
    label: "Register — Delegate",
    href: "/register/delegate",
    keywords: ["delegate registration"],
  },
  {
    label: "Register — Delegation",
    href: "/register/delegation",
    keywords: ["delegation registration", "school"],
  },
  { label: "Privacy", href: "/privacy" },
];

export function findSitePageByHref(href: string) {
  return SITE_PAGE_LINKS.find((page) => page.href === href);
}

export function filterSitePages(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return SITE_PAGE_LINKS;

  return SITE_PAGE_LINKS.filter((page) => {
    const haystack = [
      page.label,
      page.href,
      ...(page.keywords ?? []),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });
}
