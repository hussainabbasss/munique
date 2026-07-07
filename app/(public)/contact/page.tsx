import Link from "next/link";
import { ContactQueryForm } from "@/components/contact-query-form";

export default function ContactPage() {
  return (
    <main id="main" className="mx-auto max-w-[65ch] px-6 py-16">
      <h1 className="font-display text-[clamp(1.75rem,3vw,2.625rem)] font-semibold text-ink-navy text-balance">
        Contact
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-navy-soft text-pretty">
        Submit a delegate query below. The Executive Board responds to tickets in
        the admin panel — no WhatsApp threads.
      </p>
      <p className="mt-4 text-base leading-relaxed text-ink-navy-soft text-pretty">
        For general updates, follow{" "}
        <a
          href="https://instagram.com/munique_2026"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-ink-navy underline-offset-2 hover:underline"
        >
          @munique_2026
        </a>{" "}
        on Instagram.
      </p>

      <ContactQueryForm />

      <Link
        href="/"
        className="mt-8 inline-block text-sm font-semibold text-ink-navy no-underline hover:underline"
      >
        ← Back to homepage
      </Link>
    </main>
  );
}
