import { ReactNode } from "react";

type SurfaceCardProps = {
  children: ReactNode;
  tone?: "neutral" | "brand";
  className?: string;
};

export function SurfaceCard({ children, tone = "neutral", className }: SurfaceCardProps) {
  const baseClasses =
    tone === "brand"
      ? "paws-surface paws-surface--brand rounded-3xl p-6"
      : "paws-surface rounded-2xl p-4";

  return (
    <section
      className={[
        baseClasses,
        className ?? "",
      ].join(" ")}
    >
      {children}
    </section>
  );
}

