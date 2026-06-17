"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, Truck } from "lucide-react"

const variants = [
  { color: "#B91C1C", label: "Red", price: 832 },
  { color: "#1D4ED8", label: "Blue", price: 890 },
  { color: "#374151", label: "Graphite", price: 855 },
]

interface ProductInfoProps {
  name: string
  category: string
  vatRate: string
}

export function ProductInfo({ name, category, vatRate }: ProductInfoProps) {
  const [selected, setSelected] = useState(0)

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb">
        <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <li>Home</li>
          <li aria-hidden="true">/</li>
          <li>Entrance Doors</li>
          <li aria-hidden="true">/</li>
          <li className="text-foreground font-medium truncate max-w-[140px]">{name}</li>
        </ol>
      </nav>

      {/* Category tag */}
      <div>
        <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border border-border rounded px-2 py-0.5">
          {category}
        </span>
      </div>

      {/* Name */}
      <h1 className="text-xl font-bold text-foreground text-pretty leading-snug">{name}</h1>

      {/* Price block */}
      <div className="flex items-end gap-3">
        <span className="text-3xl font-bold text-foreground tabular-nums">
          {variants[selected].price.toFixed(2)} €
        </span>
        <span className="text-xs text-muted-foreground mb-1">
          Without VAT {variants[selected].price} €&nbsp;·&nbsp;{vatRate}
        </span>
      </div>

      {/* Color variants */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Style: Color
        </p>
        <div className="flex gap-2 flex-wrap">
          {variants.map((v, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium transition-all",
                i === selected
                  ? "border-seller-accent bg-seller-accent/5 text-seller-accent"
                  : "border-border text-foreground hover:border-muted-foreground"
              )}
              aria-pressed={i === selected}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                style={{ backgroundColor: v.color }}
              />
              {v.label}
              <span className="text-muted-foreground font-normal text-xs">{v.price} €</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stock & delivery */}
      <div className="flex flex-col gap-2 p-4 rounded-xl bg-muted/50 border border-border">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 size={15} className="text-green-600 shrink-0" />
          <span className="font-semibold text-green-700">In Stock</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Truck size={15} className="shrink-0" />
          <span>Delivery: 2 days to 4 months</span>
        </div>
      </div>
    </div>
  )
}
