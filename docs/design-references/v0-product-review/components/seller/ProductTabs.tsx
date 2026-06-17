"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { FileText } from "lucide-react"

const tabs = ["Description", "Characteristics", "Documents"]

const characteristics = [
  { col1: "Material", col2: "Cold-rolled steel, 2mm" },
  { col1: "Insulation", col2: "Mineral wool + foam" },
  { col1: "Door leaf thickness", col2: "75 mm" },
  { col1: "Weight", col2: "QWE123 kg" },
  { col1: "Lock type", col2: "Multi-point deadbolt" },
  { col1: "Finish", col2: "Powder-coated matte" },
]

const documents = [
  { name: "Certificate_ISO9001.pdf", size: "412 KB" },
  { name: "Product_License.docx", size: "98 KB" },
]

interface ProductTabsProps {
  description: string
}

export function ProductTabs({ description }: ProductTabsProps) {
  const [active, setActive] = useState(0)

  return (
    <div>
      {/* Tab list */}
      <div className="flex border-b border-border" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              i === active
                ? "text-seller-accent after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-seller-accent"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="pt-5" role="tabpanel">
        {/* Description */}
        {active === 0 && (
          <p className="text-sm text-foreground leading-relaxed">{description}</p>
        )}

        {/* Characteristics */}
        {active === 1 && (
          <div className="rounded-xl overflow-hidden border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60 border-b border-border">
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-1/2">
                    Parameter
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide w-1/2">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {characteristics.map((row, i) => (
                  <tr
                    key={i}
                    className={cn(
                      "border-b last:border-0 border-border transition-colors hover:bg-muted/30",
                      i % 2 === 0 ? "bg-background" : "bg-muted/20"
                    )}
                  >
                    <td className="px-4 py-3 text-muted-foreground font-medium">{row.col1}</td>
                    <td className="px-4 py-3 text-foreground">{row.col2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Documents */}
        {active === 2 && (
          <div className="space-y-2">
            {documents.map((doc, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-seller-accent/10 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-seller-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.size}</p>
                </div>
                <span className="text-xs text-seller-accent font-medium hover:underline">View</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
