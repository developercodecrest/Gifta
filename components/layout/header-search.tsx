"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  category: string;
  offerCount: number;
};

export function HeaderSearch({ mobile = false }: { mobile?: boolean }) {
  return (
    <Suspense fallback={<HeaderSearchFallback mobile={mobile} />}>
      <HeaderSearchContent mobile={mobile} />
    </Suspense>
  );
}

function HeaderSearchContent({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(initialQ);
  }, [initialQ]);

  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();

    if (pathname.startsWith("/store")) {
      const params = new URLSearchParams(searchParams.toString());
      const currentQ = params.get("q") ?? "";
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }

      if (currentQ !== trimmed) {
        params.delete("page");
        router.replace(`/store?${params.toString()}`, { scroll: false });
      }
    }

    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    let cancelled = false;

    fetch(`/api/items/suggestions?q=${encodeURIComponent(trimmed)}&limit=10`)
      .then(async (response) => {
        const payload = (await response.json()) as {
          success?: boolean;
          data?: Suggestion[];
        };

        if (!cancelled) {
          const items = response.ok && payload.success && payload.data ? payload.data : [];
          setSuggestions(items);
          setOpen(items.length > 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSuggestions([]);
          setOpen(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, pathname, router, searchParams]);

  const hasText = useMemo(() => query.trim().length > 0, [query]);

  const submitSearch = (term?: string) => {
    const target = (term ?? query).trim();
    const params = new URLSearchParams(searchParams.toString());

    if (target) {
      params.set("q", target);
    } else {
      params.delete("q");
    }

    params.delete("page");
    router.replace(`/store?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  return (
    <div className={mobile ? "relative w-full" : "relative max-w-xl flex-1"}>
      <form
        className="relative"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
        role="search"
        aria-label="Search gifts"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          value={query}
          onFocus={() => setOpen(suggestions.length > 0)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search gifts by keyword"
          autoComplete="off"
          className="rounded-full pl-10 pr-12"
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          disabled={!hasText}
          className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full"
          aria-label="Show results"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-background shadow-lg">
          <ul className="max-h-80 overflow-auto p-1">
            {suggestions.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    setQuery(item.name);
                    submitSearch(item.name);
                  }}
                >
                  <span className="truncate">{item.name}</span>
                  <span className="ml-3 shrink-0 text-xs text-muted-foreground">{item.offerCount} offers</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function HeaderSearchFallback({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={mobile ? "relative w-full" : "relative max-w-xl flex-1"}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search gifts by keyword" className="rounded-full pl-10 pr-12" readOnly />
      </div>
    </div>
  );
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}
