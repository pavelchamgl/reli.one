"use client"

import { Eye, AlertCircle } from "lucide-react"

export function PreviewBanner() {
  return (
    <div className="w-full bg-seller-warn-bg border border-seller-warn text-seller-warn-text rounded-lg px-4 py-3 flex items-start gap-3">
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-seller-warn" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">Review before submitting for moderation</p>
        <p className="text-xs text-seller-warn-text/80 mt-0.5 leading-relaxed">
          This is how your product listing will look to buyers. Check all the details carefully before sending it to moderation.
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-seller-warn bg-seller-warn/10 border border-seller-warn/30 rounded-md px-2.5 py-1">
        <Eye size={13} />
        Preview
      </div>
    </div>
  )
}
