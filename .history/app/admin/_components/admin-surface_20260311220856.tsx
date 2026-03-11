import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AdminHero({
  eyebrow,
  title,
  description,
  actions,
  stats,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  stats?: Array<{ label: string; value: string; tone?: "warm" | "mint" | "sun" }>;
}) {
  return (
    <section className="relative overflow-hidden rounded-4xl border border-border/60 bg-[linear-gradient(135deg,rgba(255,252,246,0.95),rgba(249,239,214,0.96)_45%,rgba(243,223,178,0.74)_100%)] p-6 shadow-[0_32px_90px_-54px_rgba(116,84,26,0.32)] lg:p-8">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(200,155,42,0.22),transparent_52%)]" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge className="bg-foreground text-background">{eyebrow}</Badge>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl lg:text-5xl">{title}</h1>
              <p className="max-w-2xl text-sm leading-6 text-[#5f5047] sm:text-base">{description}</p>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>

        {stats?.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "rounded-[1.4rem] border border-white/70 px-4 py-4 backdrop-blur-sm shadow-[0_16px_28px_-24px_rgba(113,84,26,0.16)]",
                  stat.tone === "mint" && "bg-accent/75",
                  stat.tone === "sun" && "bg-secondary/75",
                  (!stat.tone || stat.tone === "warm") && "bg-white/70",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function AdminSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border-border/70 bg-card/95 shadow-[0_26px_70px_-54px_rgba(116,84,26,0.28)]", className)}>
      <CardHeader className="border-b border-border/60 bg-[rgba(251,246,236,0.92)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl tracking-[-0.03em]">{title}</CardTitle>
            {description ? <CardDescription className="max-w-2xl leading-6">{description}</CardDescription> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-5">{children}</CardContent>
    </Card>
  );
}

export function AdminEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-border bg-background/50 px-6 py-10 text-center">
      <h3 className="text-lg font-semibold tracking-[-0.03em]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}