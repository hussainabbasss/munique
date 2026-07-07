import Image from "next/image";
import Link from "next/link";
import { SealImage } from "@/components/seal-image";
import { images } from "@/lib/images";

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-media" aria-hidden>
        <Image
          src={images.heroGavel}
          alt=""
          fill
          priority
          sizes="100vw"
          className="hero-photo"
        />
        <div className="hero-grade-ink" />
        <div className="hero-grade-gold" />
        <div className="hero-parchment-fade" />
      </div>

      <div className="hero-layout">
        <div className="hero-panel">
          <div className="hero-seal-row">
            <SealImage
              alt="Munique 2026 official seal"
              width={88}
              height={88}
              priority
              className="hero-seal-mark"
            />
            <div className="hero-seal-meta">
              <span className="hero-edition">Edition I</span>
              <span className="hero-year">2026</span>
            </div>
          </div>

          <h1 id="hero-title" className="hero-title">
            Munique
          </h1>

          <p className="hero-tagline">Uniqueness Of Diplomacy</p>

          <p className="hero-lede">
            A conference built like an institution — not a poster. For delegates
            who treat negotiation as craft, not performance.
          </p>

          <div className="hero-actions">
            <Link href="/register" className="btn-primary btn-hero-primary">
              Register
            </Link>
            <a href="#explore" className="btn-hero-secondary">
              View committees
            </a>
          </div>
        </div>
      </div>

      <div className="hero-page-edge" aria-hidden>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 56"
          preserveAspectRatio="none"
          className="hero-deckle"
        >
          <path
            fill="#E9DFC3"
            d="M0,56V18c48-4 96 8 144 4s96-12 144-6 96 10 144 6 96-14 144-8 96 8 144 4 96-10 144-6 96 12 144 6 96-8 144-4 96 6 144 2 96-8 144-4 96 10 144 6 96-12 144-6 96 8 144 4V56H0Z"
          />
        </svg>
      </div>

      <div className="hero-scroll-sentinel" aria-hidden />
    </section>
  );
}
