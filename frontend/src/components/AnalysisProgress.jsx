import React from 'react'
import { Loader2 } from 'lucide-react'

export default function AnalysisProgress({ steps, currentStep }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Loader2 size={16} className="text-accent animate-spin" />
        <span className="text-sm font-display font-bold text-white">Analysis in Progress</span>
      </div>

      {/* Scan line animation */}
      <div className="relative h-1 bg-border rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent to-transparent animate-scan" />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2.5 text-xs font-mono">
            <span className="text-accent mt-0.5 flex-shrink-0">▸</span>
            <span className="text-text/80">{step}</span>
          </div>
        ))}
        {currentStep && (
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <Loader2 size={11} className="text-accent animate-spin flex-shrink-0" />
            <span className="text-muted">{currentStep}</span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted font-mono">
        LangGraph pipeline: parse → retrieve → classify → root_cause → fix_suggest → summarize
      </p>
    </div>
  )
}
