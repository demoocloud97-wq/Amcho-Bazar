import { Sparkle, Flower2 } from "lucide-react";

export function FestiveDivider() {
  return (
    <div aria-hidden="true" className="my-8 flex items-center justify-center gap-3">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-primary/40" />
      <Sparkle className="h-3.5 w-3.5 text-accent" />
      <Flower2 className="h-5 w-5 text-primary" />
      <Sparkle className="h-3.5 w-3.5 text-accent" />
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-primary/40" />
    </div>
  );
}