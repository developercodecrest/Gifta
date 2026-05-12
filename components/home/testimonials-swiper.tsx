"use client";

import Image from "next/image";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

type TestimonialItem = {
  id: string;
  name: string;
  title?: string;
  description: string;
  image: string;
  rating?: number;
};

export function TestimonialsSwiper({ items }: { items: TestimonialItem[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <Swiper
      modules={[Navigation, Pagination]}
      className="testimonials-swiper pb-12!"
      spaceBetween={18}
      slidesPerView={1.05}
      loop={items.length > 3}
      navigation
      pagination={{ clickable: true }}
      breakpoints={{
        640: { slidesPerView: 1.2 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 2.4, spaceBetween: 20 },
        1280: { slidesPerView: 3, spaceBetween: 22 },
      }}
    >
      {items.map((item) => {
        const ratingValue = item.rating ?? 5;
        const ratingLabel = `${ratingValue.toFixed(1)} / 5`;

        return (
          <SwiperSlide key={item.id} className="h-auto">
            <article className="mx-1 flex h-full flex-col rounded-3xl border border-[#efe1d6] bg-white p-5 text-center shadow-[0_22px_52px_-40px_rgba(70,44,24,0.48)] sm:p-6">
              <div className="mx-auto -mt-3 mb-4">
                <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border-4 border-[#f7e7cb] bg-white shadow-[0_12px_26px_-20px_rgba(85,52,24,0.55)] sm:h-22 sm:w-22">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="88px"
                    className="object-cover"
                  />
                </div>
              </div>

              <h4 className="text-base font-semibold text-slate-900 sm:text-lg">{item.name}</h4>

              <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-[0.95rem]">{item.description}</p>

              <div className="mt-auto pt-5">
                <div className="flex items-center justify-center gap-1 text-[#cd9933]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={`${item.id}-star-${index}`} className="text-base" aria-hidden>
                      ★
                    </span>
                  ))}
                </div>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{ratingLabel}</p>
              </div>
            </article>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}
