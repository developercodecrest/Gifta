import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_18px_36px_-20px_rgba(200,155,42,0.5)] hover:bg-[#b78b1f] hover:shadow-[0_22px_42px_-24px_rgba(200,155,42,0.62)]",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_16px_28px_-24px_rgba(117,86,20,0.24)] hover:bg-[#ecd59d]",
        outline: "border border-border/80 bg-background/92 text-foreground shadow-[0_12px_26px_-24px_rgba(88,63,17,0.2)] hover:bg-accent hover:text-accent-foreground",
        ghost: "text-foreground hover:bg-accent/80 hover:text-accent-foreground",
        link: "h-auto min-h-0 px-0 text-primary underline-offset-4 hover:underline",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "px-4 py-2",
        sm: "min-h-9 px-3.5 text-xs",
        lg: "min-h-12 px-6",
        icon: "h-10 w-10 min-h-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
