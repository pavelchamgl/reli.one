"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"

const images = [
  { src: "/product-main.png", alt: "Door metal - main view" },
  { src: "/product-thumb-2.png", alt: "Door metal - handle detail" },
  { src: "/product-thumb-3.png", alt: "Door metal - side profile" },
]

export function ProductGallery() {
  const [active, setActive] = useState(0)

  const prev = () => setActive((i) => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setActive((i) => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-border bg-muted">
        <img
          src={images[active].src}
          alt={images[active].alt}
          className="w-full h-full object-cover"
        />
        {/* Arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 border border-border shadow-sm flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 border border-border shadow-sm flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Next image"
        >
          <ChevronRight size={16} />
        </button>
        {/* Counter */}
        <div className="absolute bottom-2 right-2 text-xs bg-background/80 border border-border rounded px-2 py-0.5 font-medium">
          {active + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      <div className="flex gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0",
              i === active
                ? "border-seller-accent shadow-sm"
                : "border-border hover:border-muted-foreground"
            )}
            aria-label={`View image ${i + 1}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
