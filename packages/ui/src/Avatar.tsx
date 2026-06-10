import { cn } from "./cn";

export interface AvatarProps {
  src?: string;
  alt: string;
  size?: number;
  rounded?: boolean;
  className?: string;
}

/** Artwork/thumbnail com fallback para as iniciais do título. */
export function Avatar({ src, alt, size = 48, rounded = false, className }: AvatarProps) {
  const radius = rounded ? "rounded-full" : "rounded-md";
  if (!src) {
    const initials = alt.trim().slice(0, 1).toUpperCase() || "?";
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-zinc-700 text-zinc-300",
          radius,
          className,
        )}
        style={{ width: size, height: size }}
        aria-label={alt}
      >
        {initials}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      className={cn("object-cover", radius, className)}
      style={{ width: size, height: size }}
    />
  );
}
