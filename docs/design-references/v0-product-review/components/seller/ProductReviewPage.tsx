"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Send,
  Loader2,
  CheckCircle2,
  User,
  MapPin,
} from "lucide-react"

/* ─── font shorthand ─── */
const ral = { fontFamily: "var(--font-raleway), Raleway, sans-serif" }

/* ─── stock status types ─── */
type StockStatus = "IN_STOCK" | "FEW_LEFT" | "OUT_OF_STOCK"

/* ─── mock data (would come from Redux store) ─── */
const IMAGES = [
  { src: "/product-main.png", alt: "Door Metal – main view" },
  { src: "/product-thumb-2.png", alt: "Door Metal – handle detail" },
  { src: "/product-thumb-3.png", alt: "Door Metal – side profile" },
]

const STYLE_VARIANTS: {
  src: string
  label: string
  price: string
  stock: StockStatus
}[] = [
  { src: "/product-thumb-2.png", label: "Dark steel", price: "832.00", stock: "IN_STOCK" },
  { src: "/product-thumb-3.png", label: "Matte black", price: "890.00", stock: "FEW_LEFT" },
  { src: "/product-main.png",    label: "Brushed aluminium", price: "920.00", stock: "OUT_OF_STOCK" },
]

const VAT_RATE = 21

/* Parameters / Characteristics (dynamic — from create form) */
const CHARACTERISTICS: [string, string][] = [
  ["Door material", "Cold-rolled steel, 1.5 mm"],
  ["Opening type", "Left-hand, inward-opening"],
]

/* Additional Seller Details */
const ADDITIONAL_SELLER_DETAILS: [string, string][] = [
  ["Country of origin", "Czech Republic"],
  ["Warranty, months", "24"],
  ["EAN/UPC barcode", "8594012345678"],
  ["Seller article", "RG-DOOR-M5-DS"],
  ["Age restricted", "No"],
]

/* ─── stock badge helpers ─── */
const STOCK_LABEL: Record<StockStatus, string> = {
  IN_STOCK:     "IN STOCK",
  FEW_LEFT:     "FEW LEFT",
  OUT_OF_STOCK: "OUT OF STOCK",
}

const STOCK_PILL: Record<StockStatus, string> = {
  IN_STOCK:     "bg-[#E6F4EC] text-[#1E7A3E] border border-[#A8D5B5]",
  FEW_LEFT:     "bg-[#FFF3E6] text-[#C26A00] border border-[#F5C98A]",
  OUT_OF_STOCK: "bg-[#FEECEC] text-[#C0392B] border border-[#F5A9A9]",
}

/* ═══════════════════════════════════════════════════
   HEADER – seller cabinet only
═══════════════════════════════════════════════════ */
function ReliHeader() {
  const NAV_ITEMS = ["Home", "Goods", "Orders", "Finance", "Sales analytics"] as const

  return (
    <header className="w-full bg-white">
      {/* ── Row 1: logo + Vstoupit + Jazyk ── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[95px] flex items-center justify-between h-[72px]">
        {/* Logo: RELI brand mark baseline-aligned with "/ Seller" */}
        <a href="#" className="flex items-center shrink-0" aria-label="RELI Seller home">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-o92JA6gC5WnCJzUhqKmwkq2P8OiorW.png"
            alt="RELI"
            style={{ height: "28px", width: "auto", display: "block" }}
          />
          <span
            className="text-[#4A4A4A]"
            style={{
              ...ral,
              fontSize: "20px",
              fontWeight: 500,
              letterSpacing: "-0.2px",
              lineHeight: 1,
              marginLeft: "8px",
            }}
          >
            / Seller
          </span>
        </a>

        {/* Vstoupit + Jazyk */}
        <div className="hidden sm:flex items-center gap-8">
          <a
            href="#"
            className="flex items-center gap-2 text-[#333] hover:opacity-70 transition-opacity"
            style={{ ...ral, fontSize: "15px", fontWeight: 400, letterSpacing: "-0.2px" }}
          >
            <User size={17} strokeWidth={1.5} />
            Vstoupit
          </a>
          <a
            href="#"
            className="flex items-center gap-2 text-[#333] hover:opacity-70 transition-opacity"
            style={{ ...ral, fontSize: "15px", fontWeight: 400, letterSpacing: "-0.2px" }}
          >
            <MapPin size={15} strokeWidth={1.2} />
            Jazyk
          </a>
        </div>
      </div>

      {/* ── Row 2: nav items + bottom separator ── */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[95px]">
        <div className="flex items-end gap-8 lg:gap-[57px] overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item === "Goods"
            return (
              <div
                key={item}
                className="flex flex-col items-start cursor-pointer shrink-0 gap-3"
              >
                <span
                  className="text-[#111] whitespace-nowrap"
                  style={{
                    ...ral,
                    fontSize: "22px",
                    fontWeight: 500,
                    lineHeight: 1,
                    letterSpacing: "-0.32px",
                  }}
                >
                  {item}
                </span>
                <div
                  style={{
                    height: "2px",
                    background: "#F5B80B",
                    opacity: isActive ? 1 : 0,
                    alignSelf: "stretch",
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="border-b border-[#D3D4D5]" />
      </div>
    </header>
  )
}

/* ═══════════════════════════════════════════════════
   PREVIEW BANNER
═══════════════════════════════════════════════════ */
function PreviewBanner() {
  return (
    <div className="w-full bg-[#FFFBEB] border border-[#F5B80B] px-5 py-3 flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-[#F5B80B] shrink-0 animate-pulse" />
      <p className="text-[13px] text-[#7A4F00] leading-relaxed" style={{ ...ral }}>
        <span className="font-semibold">Preview mode.</span>{" "}
        This is how your product will appear to buyers after approval. Review all fields carefully before submitting for moderation.
      </p>
      <span
        className="ml-auto shrink-0 text-[11px] font-semibold uppercase tracking-wider text-[#7A4F00] border border-[#F5B80B] px-2 py-0.5 bg-white"
        style={{ ...ral }}
      >
        Draft
      </span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   GALLERY
═══════════════════════════════════════════════════ */
function Gallery() {
  const [active, setActive] = useState(0)
  const prev = () => setActive((i) => (i === 0 ? IMAGES.length - 1 : i - 1))
  const next = () => setActive((i) => (i === IMAGES.length - 1 ? 0 : i + 1))

  return (
    <div className="flex flex-col gap-3">
      <div className="relative w-full aspect-square bg-[#F8F8F8] overflow-hidden">
        <img
          src={IMAGES[active].src}
          alt={IMAGES[active].alt}
          className="w-full h-full object-contain"
        />
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-[#ddd] rounded-full flex items-center justify-center shadow-sm hover:shadow transition-shadow"
          aria-label="Previous image"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-[#ddd] rounded-full flex items-center justify-center shadow-sm hover:shadow transition-shadow"
          aria-label="Next image"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="flex gap-[10px]">
        {IMAGES.map((img, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              "w-[75px] h-[75px] border overflow-hidden shrink-0 transition-all",
              i === active ? "border-black border-2" : "border-[#D3D4D5] hover:border-[#888]"
            )}
            aria-label={`View image ${i + 1}`}
          >
            <img src={img.src} alt={img.alt} className="w-full h-full object-contain bg-[#F8F8F8]" />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   STARS
═══════════════════════════════════════════════════ */
function Stars({ count = 5, total = 0 }: { count?: number; total?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill={i < count ? "#F5B80B" : "#ddd"} aria-hidden="true">
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
          </svg>
        ))}
      </div>
      <span className="text-[#64748B] text-[14px]" style={{ ...ral, fontVariantNumeric: "tabular-nums" }}>
        {total}
      </span>
    </div>
  )
}

/* ─── Stock badge pill ─── */
function StockBadge({ status }: { status: StockStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 text-[11px] font-semibold uppercase tracking-wider",
        STOCK_PILL[status]
      )}
      style={{ ...ral, letterSpacing: "0.8px" }}
    >
      {STOCK_LABEL[status]}
    </span>
  )
}

/* ═══════════════════════════════════════════════════
   INFO PANEL (right column top section)
═══════════════════════════════════════════════════ */
function InfoPanel() {
  const [selectedStyle, setSelectedStyle] = useState(0)
  const [descOpen, setDescOpen] = useState(false)

  const variant = STYLE_VARIANTS[selectedStyle]
  const priceRaw = parseFloat(variant.price)
  const priceExVat = (priceRaw / (1 + VAT_RATE / 100)).toFixed(2)
  const isOutOfStock = variant.stock === "OUT_OF_STOCK"

  return (
    <div className="flex flex-col gap-3">
      <Stars count={0} total={0} />

      {/* Goods name */}
      <div>
        <h1
          className="text-[24px] font-semibold text-black leading-tight text-pretty"
          style={{ ...ral }}
        >
          Door Metal – 5
        </h1>
        <p
          className="text-[#64748B] text-[13px] font-medium uppercase tracking-[1px] mt-0.5"
          style={{ ...ral }}
        >
          Entrance Doors
        </p>
      </div>

      {/* Price + VAT */}
      <div className="flex flex-col gap-0.5">
        <p
          className="text-[24px] font-medium text-black leading-none"
          style={{ ...ral, fontVariantNumeric: "tabular-nums" }}
        >
          {priceRaw.toFixed(2)} Kč
        </p>
        <p
          className="text-[#F5B80B] text-[14px] leading-none"
          style={{ ...ral, fontVariantNumeric: "tabular-nums" }}
        >
          Without VAT {priceExVat} Kč
        </p>
      </div>

      {/* Style variants with stock status */}
      <div>
        <p className="text-[13px] text-[#64748B] mb-1.5" style={{ ...ral }}>
          Style:{" "}
          <span className="font-semibold text-black">{variant.label}</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          {STYLE_VARIANTS.map((v, i) => {
            const out = v.stock === "OUT_OF_STOCK"
            return (
              <button
                key={i}
                onClick={() => setSelectedStyle(i)}
                className={cn(
                  "flex flex-col items-center justify-center px-3 py-2.5 border text-[12px] transition-colors min-w-[90px]",
                  selectedStyle === i ? "border-black" : "border-[#D3D4D5] hover:border-[#888]",
                  out && "opacity-60"
                )}
                style={{ ...ral }}
                aria-label={`${v.label} – ${v.price} Kč – ${STOCK_LABEL[v.stock]}`}
              >
                <span
                  className="font-semibold text-[13px] text-[#333]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {v.label}
                </span>
                <span
                  className="text-[12px] text-[#555] mt-0.5"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {v.price} Kč
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide mt-1",
                    v.stock === "IN_STOCK"     && "text-[#1E7A3E]",
                    v.stock === "FEW_LEFT"     && "text-[#C26A00]",
                    v.stock === "OUT_OF_STOCK" && "text-[#C0392B]",
                  )}
                  style={{ ...ral }}
                >
                  {STOCK_LABEL[v.stock]}
                </span>
              </button>
            )
          })}
        </div>

        {/* Stock status pill below variants */}
        <div className="mt-2">
          <StockBadge status={variant.stock} />
        </div>
      </div>

      {/* CTA button (preview — reflects stock) */}
      <button
        disabled
        className={cn(
          "w-full py-3 text-[15px] font-medium text-white transition-colors cursor-not-allowed",
          isOutOfStock ? "bg-[#8C9BAB]" : "bg-black hover:bg-[#222]"
        )}
        style={{ ...ral }}
        aria-disabled="true"
      >
        {isOutOfStock ? "Out of stock" : "Add to cart"}
      </button>

      {/* Delivery info */}
      <div
        className="flex items-center justify-center gap-2 border border-[#D3D4D5] py-2.5 text-[13px] text-[#444]"
        style={{ ...ral }}
      >
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none" aria-hidden="true">
          <rect x="1" y="3" width="13" height="9" rx="1" stroke="#666" strokeWidth="1.3" />
          <path d="M14 5h4l3 4v3h-7V5Z" stroke="#666" strokeWidth="1.3" />
          <circle cx="5.5" cy="13.5" r="1.5" stroke="#666" strokeWidth="1.2" />
          <circle cx="17.5" cy="13.5" r="1.5" stroke="#666" strokeWidth="1.2" />
        </svg>
        Delivery: 2 days to 4 months
      </div>

      {/* Tabs: Description / Reviews */}
      <div className="mt-2">
        <div className="flex border-b border-[#D3D4D5]">
          <span
            className="pb-2 text-[15px] font-medium border-b-2 border-black text-black mr-8 cursor-default"
            style={{ ...ral }}
          >
            Description
          </span>
          <span className="pb-2 text-[15px] text-[#888] cursor-default" style={{ ...ral }}>
            Reviews
          </span>
        </div>

        <p className="mt-3 text-[14px] text-black leading-relaxed" style={{ ...ral, fontWeight: 400 }}>
          High-security entrance door manufactured from cold-rolled steel with multi-layer insulation.
          Features a multi-point deadbolt locking system, reinforced frame, and powder-coated matte
          finish for lasting durability. Available in multiple colour options. Suitable for residential
          and commercial use.
        </p>

        {/* Additional details accordion */}
        <div className="mt-3 border-t border-b border-black">
          <button
            onClick={() => setDescOpen((o) => !o)}
            className="w-full flex items-center justify-between py-3 text-[14px] font-medium text-black"
            style={{ ...ral }}
          >
            Additional details
            <ChevronDown
              size={18}
              className={cn("transition-transform", descOpen && "rotate-180")}
            />
          </button>
          {descOpen && (
            <p className="pb-4 text-[14px] text-black leading-relaxed" style={{ ...ral }}>
              Manufactured to EN 1627 burglar-resistance class RC2. Fire rating EI30. Triple glazing
              option available. Available in RAL custom colours upon request.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   TABLE ROWS (shared utility)
═══════════════════════════════════════════════════ */
function TableRows({ rows }: { rows: [string, string][] }) {
  return (
    <div>
      {rows.map(([label, value], i) => (
        <div
          key={i}
          className={cn(
            "flex items-baseline px-4 py-2 border-b border-[#E5E5E5]",
            i % 2 === 1 && "bg-[#F5F7F5]"
          )}
        >
          <span className="w-1/2 text-[13px] text-black" style={{ ...ral, fontWeight: 400 }}>
            {label}
          </span>
          <span
            className="w-1/2 text-[13px] text-black"
            style={{ ...ral, fontWeight: 400, fontVariantNumeric: "tabular-nums" }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="bg-black px-4 py-2.5">
      <h3
        className="text-white text-[12px] font-semibold tracking-[1.5px] uppercase"
        style={{ ...ral }}
      >
        {title}
      </h3>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   CHARACTERISTICS + ADDITIONAL DETAILS + DOCUMENTS
═══════════════════════════════════════════════════ */
function CharacteristicsSection() {
  return (
    <div className="mt-6 flex flex-col gap-5">

      {/* Parameters / Characteristics */}
      <div>
        <SectionHeader title="Parameters / Characteristics" />
        <TableRows rows={CHARACTERISTICS} />
      </div>

      {/* Additional Seller Details */}
      <div>
        <SectionHeader title="Additional Seller Details" />
        <TableRows rows={ADDITIONAL_SELLER_DETAILS} />
      </div>

      {/* Documents */}
      <div>
        <SectionHeader title="Documents" />
        <div className="px-4 py-3 border-b border-[#E5E5E5] text-[14px] text-black" style={{ ...ral }}>
          You can read the certificate{" "}
          <a href="#" className="underline hover:text-[#F5B80B] transition-colors">
            here
          </a>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   ACTIONS
═══════════════════════════════════════════════════ */
function Actions() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")

  const handleSubmit = () => {
    setStatus("loading")
    setTimeout(() => setStatus("done"), 1800)
  }

  return (
    <div className="flex items-center justify-between gap-4 py-8 border-t border-[#D3D4D5] mt-8">
      <button
        className="flex items-center gap-2 px-5 py-2.5 border border-[#D3D4D5] text-[14px] text-black hover:border-black transition-colors"
        style={{ ...ral }}
      >
        <ArrowLeft size={15} />
        Back to editing
      </button>

      <button
        onClick={handleSubmit}
        disabled={status !== "idle"}
        className={cn(
          "flex items-center gap-2 px-6 py-2.5 text-white text-[14px] font-medium transition-colors",
          status === "idle"    && "bg-[#2D7A4F] hover:bg-[#236040]",
          status === "loading" && "bg-[#2D7A4F] opacity-70 cursor-not-allowed",
          status === "done"    && "bg-[#1E5C3A] cursor-default",
        )}
        style={{ ...ral }}
        aria-live="polite"
      >
        {status === "idle" && (
          <>
            <Send size={14} />
            Submit for moderation
          </>
        )}
        {status === "loading" && (
          <>
            <Loader2 size={14} className="animate-spin" />
            Submitting…
          </>
        )}
        {status === "done" && (
          <>
            <CheckCircle2 size={14} />
            Submitted!
          </>
        )}
      </button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   PAGE ROOT
═══════════════════════════════════════════════════ */
export function ProductReviewPage() {
  return (
    <div className="bg-white min-h-screen">
      <ReliHeader />

      {/* Preview banner */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[95px] pt-3">
        <PreviewBanner />
      </div>

      {/* Breadcrumb */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[95px] pt-2">
        <nav aria-label="breadcrumb">
          <ol
            className="flex items-center gap-1.5 text-[12px] text-[#888] uppercase"
            style={{ ...ral, letterSpacing: "0.4px" }}
          >
            <li>Home</li>
            <li>/</li>
            <li>Entrance Doors</li>
            <li>/</li>
            <li>Door Metal – 5</li>
          </ol>
        </nav>
      </div>

      {/* Main product area */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-[95px] pt-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[500px_1fr] gap-10 lg:gap-14 items-start">
          {/* Left: sticky on desktop only */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Gallery />
          </div>

          {/* Right: all product info */}
          <div>
            <InfoPanel />
            <CharacteristicsSection />
            <Actions />
          </div>
        </div>
      </div>
    </div>
  )
}
