import type { Product, ProductImage as Img } from "@/data/types";
import { fullName } from "@/lib/products";
import { cn } from "@/lib/utils";

import SneakerArt from "./sneaker-art";

/** Studio tile: the real photo when there is one, otherwise the render. */
export function ProductImage({
  product,
  image = product.images[0],
  className,
  artClassName,
  alt,
}: {
  product: Product;
  image?: Img;
  className?: string;
  artClassName?: string;
  alt?: string;
}) {
  const label = alt ?? fullName(product) + " — " + product.colorway;
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-tile",
        "bg-[radial-gradient(120%_90%_at_50%_35%,#f8f9f8_0%,var(--tile)_60%,#e0e3e0_100%)]",
        className,
      )}
    >
      {image.src ? (
        // eslint-disable-next-line @next/next/no-img-element -- remplaçable par next/image avec de vraies photos
        <img src={image.src} alt={label} className="absolute inset-0 size-full object-cover" />
      ) : (
        <SneakerArt
          silhouette={product.silhouette}
          colorway={product.colors}
          view={image.view}
          title={label}
          className={cn("w-[84%]", artClassName)}
        />
      )}
    </div>
  );
}
