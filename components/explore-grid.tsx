import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { images } from "@/lib/images";

const rows = [
  {
    href: "/about",
    title: "About",
    description: "What Munique is, and how Edition I runs.",
    image: images.chamberDesk,
  },
  {
    href: "/committees",
    title: "Committees",
    description: "Chambers and agendas, published as they are confirmed.",
    image: images.committeesGavel,
  },
  {
    href: "/schedule",
    title: "Schedule",
    description: "Programme and venue. Dates TBA.",
    image: images.gavelAlt,
  },
  {
    href: "/study-guide",
    title: "Study Guides",
    description: "Committee briefs, published before session.",
    image: images.heroGavel,
  },
] as const;

export function ExploreGrid() {
  return (
    <section
      id="explore"
      className="home-proceedings"
      aria-labelledby="proceedings-title"
    >
      <div className="sheet">
        <Reveal>
          <div className="home-proceedings-head">
            <h2
              id="proceedings-title"
              className="display display-lg home-proceedings-title"
            >
              Proceedings
            </h2>
            <p className="prose-lede">
              Everything a delegate needs before committee — filed in order.
            </p>
          </div>
        </Reveal>
      </div>

      <ul className="ledger home-ledger">
        {rows.map((row, index) => (
          <Reveal
            key={row.href}
            as="li"
            delay={index * 70}
            className="ledger-row home-row"
          >
            <Link href={row.href} className="ledger-link home-row-link">
              <div className="home-row-grid">
                <h3 className="display display-md home-row-title">
                  {row.title}
                </h3>
                <p className="home-row-desc">{row.description}</p>
                <span className="home-row-thumb home-duotone" aria-hidden>
                  <Image
                    src={row.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 192px, 1px"
                  />
                </span>
                <span className="arrow-cta home-row-arrow" aria-hidden>
                  <span className="arrow">→</span>
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}
