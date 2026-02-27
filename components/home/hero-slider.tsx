"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

type HeroSlide = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
};

const slides: HeroSlide[] = [
  {
    title: "Celebrate every moment with thoughtful gifting",
    subtitle: "Premium flowers, cakes, and personalized picks from trusted vendors.",
    ctaLabel: "Shop collection",
    ctaHref: "/store",
    image:
      "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Gift box and flowers",
  },
  {
    title: "Same-day surprises for birthdays and anniversaries",
    subtitle: "Find fast-delivery options with top-rated stores near you.",
    ctaLabel: "Explore fast delivery",
    ctaHref: "/store?tag=same-day",
    image:
      "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Birthday celebration gifts",
  },
  {
    title: "Make gifts personal with curated custom picks",
    subtitle: "From keepsakes to premium hampers, compare styles and prices in one place.",
    ctaLabel: "View personalized",
    ctaHref: "/store?tag=personalized",
    image:
      "https://images.unsplash.com/photo-1512909006721-3d6018887383?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Personalized gift wrapping",
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
      className="relative overflow-hidden rounded-[3rem] border border-border/50 shadow-2xl"
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
              className={`object-cover transition-transform duration-[10000ms] ease-linear ${
                slideIndex === index ? "scale-105" : "scale-100"
              }`}
              sizes="100vw"
              priority={slideIndex === 0}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-[28rem] flex-col justify-end p-8 sm:min-h-[32rem] sm:p-12 lg:min-h-[36rem] lg:p-16">
        <article className="max-w-2xl space-y-6 text-white">
          <span className="inline-block rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md ring-1 ring-white/30">
            Curated gifting marketplace
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1] drop-shadow-lg">
            {active.title}
          </h1>
          <p className="max-w-xl text-base font-medium text-white/90 sm:text-lg drop-shadow-md">
            {active.subtitle}
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link 
              href={active.ctaHref}
              className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-amber-400 px-8 font-bold text-amber-950 transition-all hover:scale-105 hover:bg-amber-300 hover:shadow-[0_0_40px_rgba(251,191,36,0.4)]"
            >
              <span className="relative z-10 flex items-center gap-2">
                {active.ctaLabel}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link 
              href="/store?sort=rating"
              className="inline-flex h-14 items-center justify-center rounded-full border-2 border-white/30 bg-black/20 px-8 font-bold text-white backdrop-blur-md transition-all hover:border-white hover:bg-white/10"
            >
              Top rated picks
            </Link>
          </div>
        </article>

        <div className="absolute bottom-8 right-8 z-20 flex items-center gap-3 sm:bottom-12 sm:right-12">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.title}
              type="button"
              aria-label={`Go to slide ${slideIndex + 1}`}
              onClick={() => setIndex(slideIndex)}
              className={`h-3 rounded-full transition-all duration-500 ${
                slideIndex === index ? "w-10 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "w-3 bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
