export function FestiveDivider() {
  return (
    <div className="my-8 flex items-center justify-center gap-3">
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-primary/40" />
      <span className="text-lg text-accent">✦</span>
      <span className="text-primary text-xl">❁</span>
      <span className="text-lg text-accent">✦</span>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-primary/40" />
    </div>
  );
}