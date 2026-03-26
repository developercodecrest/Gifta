"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type InputOTPProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
};

const InputOTP = React.forwardRef<HTMLInputElement, InputOTPProps>(
  ({ className, value, onChange, maxLength = 6, disabled, ...props }, ref) => {
    const localRef = React.useRef<HTMLInputElement | null>(null);
    const [isFocused, setIsFocused] = React.useState(false);

    React.useImperativeHandle(ref, () => localRef.current as HTMLInputElement);

    const normalizedValue = React.useMemo(() => {
      return (value ?? "").replace(/\D/g, "").slice(0, maxLength);
    }, [value, maxLength]);

    const chars = React.useMemo(() => {
      return Array.from({ length: maxLength }, (_, index) => normalizedValue[index] ?? "");
    }, [maxLength, normalizedValue]);

    const activeIndex = React.useMemo(() => {
      return Math.min(normalizedValue.length, maxLength - 1);
    }, [maxLength, normalizedValue.length]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value.replace(/\D/g, "").slice(0, maxLength);
      onChange(nextValue);
    };

    const focusInput = () => {
      if (!disabled) {
        localRef.current?.focus();
      }
    };

    return (
      <div className={cn("space-y-2", className)}>
        <input
          {...props}
          ref={localRef}
          value={normalizedValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={maxLength}
          className="sr-only"
          disabled={disabled}
        />

        <div className="flex gap-2" onClick={focusInput} role="presentation" aria-hidden="true">
          {chars.map((char, index) => (
            <div
              key={index}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-md border text-base font-semibold transition",
                char ? "border-primary text-foreground" : "border-border text-muted-foreground",
                isFocused && index === activeIndex ? "ring-2 ring-ring ring-offset-2" : "",
                disabled ? "opacity-50" : "",
              )}
            >
              {char || "-"}
            </div>
          ))}
        </div>
      </div>
    );
  },
);

InputOTP.displayName = "InputOTP";

export { InputOTP };
