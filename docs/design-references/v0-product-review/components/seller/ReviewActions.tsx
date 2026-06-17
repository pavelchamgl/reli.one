"use client"

import { useState } from "react"
import { ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react"

interface ReviewActionsProps {
  onBack?: () => void
  onSubmit?: () => void
}

export function ReviewActions({ onBack, onSubmit }: ReviewActionsProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle")

  const handleSubmit = () => {
    setStatus("loading")
    setTimeout(() => {
      setStatus("done")
      onSubmit?.()
    }, 1800)
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t border-border mt-2">
      <button
        onClick={onBack}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        <ArrowLeft size={16} />
        Back to editing
      </button>

      <button
        onClick={handleSubmit}
        disabled={status !== "idle"}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-seller-accent text-white text-sm font-semibold shadow-sm hover:bg-seller-accent/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {status === "idle" && (
          <>
            <Send size={15} />
            Submit for moderation
          </>
        )}
        {status === "loading" && (
          <>
            <Loader2 size={15} className="animate-spin" />
            Submitting…
          </>
        )}
        {status === "done" && (
          <>
            <CheckCircle2 size={15} />
            Submitted!
          </>
        )}
      </button>
    </div>
  )
}
