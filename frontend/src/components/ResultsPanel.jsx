import React, { useState } from 'react'
import { AlertTriangle, Target, Wrench, Search, CheckCircle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const SEVERITY_MAP = {
  critical: { label: 'CRITICAL', cls: 'severity-critical' },
  high:     { label: 'HIGH',     cls: 'severity-high' },
  medium:   { label: 'MEDIUM',   cls: 'severity-medium' },
  low:      { label: 'LOW',      cls: 'severity-low' },
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="p-1.5 rounded text-muted hover:text-accent transition-colors">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

function Collapsible({ title, icon: Icon, count, accent, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={15} style={{ color: accent }} />
          <span className="text-sm font-semibold text-text">{title}</span>
          {count !== undefined && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-white/5 text-muted font-mono">{count}</span>
          )}
        </div>
        {open ? <ChevronUp size={14} className="text-muted" /> : <ChevronDown size={14} className="text-muted" />}
      </button>
      {open && <div className="border-t border-border">{children}</div>}
    </div>
  )
}

function RootCauseCard({ rc, index }) {
  return (
    <div className="p-4 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-warn/10 border border-warn/30 text-warn text-[10px] font-bold flex items-center justify-center flex-shrink-0">
            {index + 1}
          </span>
          <span className="text-sm font-semibold text-text">{rc.title}</span>
        </div>
        <span className="flex-shrink-0 text-[11px] font-mono text-muted">
          {Math.round((rc.confidence || 0) * 100)}% confidence
        </span>
      </div>
      <p className="text-xs text-muted/80 leading-relaxed pl-7">{rc.description}</p>
      {rc.location && (
        <div className="mt-2 pl-7">
          <code className="text-[11px] text-info bg-info/10 px-2 py-0.5 rounded font-mono">{rc.location}</code>
        </div>
      )}
      {rc.service && (
        <div className="mt-1.5 pl-7">
          <span className="text-[11px] text-accent/70 font-mono">service: {rc.service}</span>
        </div>
      )}
    </div>
  )
}

function FixCard({ fix }) {
  return (
    <div className="p-4 border-b border-border last:border-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-1.5 py-0.5 text-[10px] rounded bg-accent/10 text-accent font-mono border border-accent/20">
          P{fix.priority}
        </span>
        <span className="text-sm font-semibold text-text">{fix.title}</span>
      </div>
      <p className="text-xs text-muted/80 leading-relaxed mb-3">{fix.description}</p>

      {fix.code_before && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-crit/70">BEFORE</span>
            <CopyButton text={fix.code_before} />
          </div>
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{ margin: 0, borderRadius: 6, fontSize: 11, background: '#0d0f14' }}
          >
            {fix.code_before}
          </SyntaxHighlighter>
        </div>
      )}

      {fix.code_after && (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono text-accent/70">AFTER</span>
            <CopyButton text={fix.code_after} />
          </div>
          <SyntaxHighlighter
            language="python"
            style={vscDarkPlus}
            customStyle={{ margin: 0, borderRadius: 6, fontSize: 11, background: '#0d0f14', border: '1px solid rgba(0,255,136,0.15)' }}
          >
            {fix.code_after}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  )
}

export default function ResultsPanel({ result }) {
  const { label: sevLabel, cls: sevCls } = SEVERITY_MAP[result.severity] || SEVERITY_MAP.medium

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2.5 py-1 text-xs font-bold font-mono rounded border ${sevCls}`}>
                {sevLabel}
              </span>
              {result.affected_services?.map(s => (
                <span key={s} className="px-2 py-0.5 text-[11px] bg-info/10 border border-info/30 text-info rounded-full font-mono">
                  {s}
                </span>
              ))}
            </div>
            <p className="text-sm text-text/90 leading-relaxed">{result.summary}</p>
          </div>
        </div>

        {/* Steps */}
        <div className="mt-3 pt-3 border-t border-border space-y-1">
          {result.analysis_steps?.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-muted/70">
              <CheckCircle size={11} className="text-accent flex-shrink-0" />
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Root Causes */}
      <Collapsible
        title="Root Causes"
        icon={Target}
        accent="#ff6b35"
        count={result.root_causes?.length}
        defaultOpen
      >
        {result.root_causes?.length > 0
          ? result.root_causes.map((rc, i) => <RootCauseCard key={i} rc={rc} index={i} />)
          : <p className="p-4 text-xs text-muted font-mono">No root causes identified.</p>
        }
      </Collapsible>

      {/* Fixes */}
      <Collapsible
        title="Suggested Fixes"
        icon={Wrench}
        accent="#00ff88"
        count={result.fixes?.length}
        defaultOpen
      >
        {result.fixes?.length > 0
          ? result.fixes.map((fix, i) => <FixCard key={i} fix={fix} />)
          : <p className="p-4 text-xs text-muted font-mono">No fixes generated.</p>
        }
      </Collapsible>

      {/* Similar Issues */}
      <Collapsible
        title="Similar Historical Issues"
        icon={Search}
        accent="#00b4ff"
        count={result.similar_issues?.length}
      >
        {result.similar_issues?.length > 0 ? (
          <div className="divide-y divide-border">
            {result.similar_issues.map((issue, i) => (
              <div key={i} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-text">{issue.title}</span>
                  <span className="text-[11px] font-mono text-info">
                    {Math.round((issue.similarity_score || 0) * 100)}% match
                  </span>
                </div>
                <p className="text-xs text-muted/70 mb-2">{issue.description}</p>
                {issue.resolution && (
                  <div className="bg-accent/5 border border-accent/15 rounded-lg p-2.5">
                    <p className="text-[11px] text-muted font-mono mb-0.5">Resolution:</p>
                    <p className="text-xs text-text/80">{issue.resolution}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="p-4 text-xs text-muted font-mono">No similar issues found in knowledge base.</p>
        )}
      </Collapsible>
    </div>
  )
}
