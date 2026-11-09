import Image from "next/image";

/** Портрет мастера в аркообразной рамке. Без фото — монограмма на тёплом фоне. */
export function Portrait({
  name,
  photoUrl,
  className = "",
  sizes = "(min-width: 768px) 25vw, 50vw",
}: {
  name: string;
  photoUrl?: string | null;
  className?: string;
  sizes?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return (
    <div className={`arch relative aspect-[3/4] w-full ${photoUrl ? "bg-sand" : "placeholder-photo"} ${className}`}>
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill sizes={sizes} className="object-cover" unoptimized />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="display text-[64px] italic text-ink/25 select-none">{initials}</span>
        </div>
      )}
    </div>
  );
}
