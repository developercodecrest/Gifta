"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Gift, Sparkles, Star, Truck } from "lucide-react";

type HeroSlide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  highlights: string[];
  image: string;
  imageAlt: string;
};

const slides: HeroSlide[] = [
  {
    eyebrow: "Editorial gifting",
    title: "Thoughtful gifting with a richer, more premium presentation",
    subtitle: "Full-width stories, handcrafted picks, and vivid collections inspired by the best modern gifting storefronts.",
    ctaLabel: "Shop the edit",
    ctaHref: "/search",
    secondaryLabel: "Browse bestsellers",
    secondaryHref: "/search?sort=rating",
    highlights: ["Personalized keepsakes", "Curated hampers", "Vibrant occasion edits"],
    image:
      "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=1800&auto=format&fit=crop",
    imageAlt: "Gift box with flowers and warm festive decor",
  },
  {
    eyebrow: "Express delivery",
    title: "Same-day surprise drops for birthdays, anniversaries, and last-minute magic",
    subtitle: "Fast search, high-visibility offers, and gift-ready products designed to convert quickly across devices.",
    ctaLabel: "Explore same day",
    ctaHref: "/search?tag=same-day",
    secondaryLabel: "View premium picks",
    secondaryHref: "/search?tag=luxury",
    highlights: ["60-minute heroes", "City-ready gifting", "Fast checkout flow"],
    image:
      "https://images.unsplash.com/photo-1481391319762-47dff72954d9?q=80&w=1800&auto=format&fit=crop",
    imageAlt: "Wrapped gifts and flowers on a vibrant table",
  },
  {
    eyebrow: "Personalized stories",
    title: "Custom gifts, photo keepsakes, and celebration-led stories that feel handcrafted",
    subtitle: "A more vibrant browsing experience with bold contrast, elegant typography, and strong product focus.",
    ctaLabel: "Personalize now",
    ctaHref: "/search?tag=personalized",
    secondaryLabel: "See relationship gifts",
    secondaryHref: "/search?q=couple",
    highlights: ["Photo gifting", "Luxury wrapping", "Made-to-feel special"],
    image:
      "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=1800&auto=format&fit=crop",
    imageAlt: "Custom gift packaging with ribbon and cards",
  },
];

export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const goToNext = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const goToPrev = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      goToNext();
    }, 4500);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const active = useMemo(() => slides[index], [index]);

  const onTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
    touchEndXRef.current = null;
  };

  const onTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    touchEndXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const onTouchEnd = () => {
    const startX = touchStartXRef.current;
    const endX = touchEndXRef.current;

    if (startX === null || endX === null) return;

    const distance = startX - endX;
    const threshold = 50;

    if (distance > threshold) {
      goToNext();
    } else if (distance < -threshold) {
      goToPrev();
    }

    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  return (
    <section
      className="relative overflow-hidden bg-[#160f13] text-white soft-shadow"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="absolute inset-0">
        {slides.map((slide, slideIndex) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              slideIndex === index ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={slide.image}
              alt={slide.imageAlt}
              fill
              className={`object-cover transition-transform duration-10000 ease-linear ${
                slideIndex === index ? "scale-105" : "scale-100"
              }`}
              sizes="100vw"
              priority={slideIndex === 0}
            />
          </div>
        ))}
      </div>

      <div className="animate-glow-drift absolute -left-20 top-8 h-60 w-60 rounded-full bg-[#ff7b63]/30 blur-3xl" />
      <div className="animate-float-soft absolute right-0 top-0 h-64 w-64 rounded-full bg-[#f6c87a]/20 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,10,14,0.88)_0%,rgba(20,10,14,0.72)_35%,rgba(20,10,14,0.2)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_22%,rgba(7,4,6,0.44)_100%)]" />

      <div className="relative z-20 flex min-h-120 flex-col justify-end px-[var(--page-gutter)] py-10 sm:min-h-[37rem] sm:py-12 lg:min-h-[35rem] lg:py-16 pb-12 sm:pb-16 lg:pb-20 transition-all">
        <article className="animate-rise relative z-30 max-w-3xl space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/88 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-[#ffc38f]" />
            {active.eyebrow}
          </span>
          <h1 className="font-display text-4xl leading-[0.98] text-white sm:text-5xl lg:text-6xl">
            {active.title}
          </h1>
          <p className="max-w-2xl text-base font-medium text-white/82 sm:text-lg lg:text-xl">
            {active.subtitle}
          </p>

          <div className="flex flex-wrap gap-2.5">
            {active.highlights.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/88 backdrop-blur">
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link 
              href={active.ctaHref}
              className="group relative z-30 inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary/90 px-8 font-semibold text-white shadow-lg transition-all hover:scale-[1.01] hover:shadow-xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                {active.ctaLabel}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link 
              href={active.secondaryHref}
              className="inline-flex relative z-30 h-14 items-center justify-center rounded-full border border-white/20 bg-white/10 px-8 font-semibold text-white backdrop-blur-md transition-all hover:border-white/40 hover:bg-white/15"
            >
              {active.secondaryLabel}
            </Link>
          </div>
        </article>

        <div className="absolute bottom-6 right-[var(--page-gutter)] z-30 flex items-center gap-3 sm:bottom-10">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Go to slide ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
              className={`h-3 rounded-full transition-all duration-500 ${
                slideIndex === index ? "w-12 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "w-3 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FloatingFact({
  icon: Icon,
  label,
}: {
  icon: typeof Gift;
  label: string;
}) {
  return (
    <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/88 backdrop-blur md:inline-flex">
      <Icon className="h-4 w-4 text-[#ffc38f]" />
      {label}
    </span>
  );
}
