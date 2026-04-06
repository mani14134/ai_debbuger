import React, { useState } from 'react'
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ChevronDown, ChevronUp, Cpu, Wrench, History, Server } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, color: 'text-crit', bg: 'bg-crit/10', border: 'border-crit/30', label: 'CRITICAL' },
  high:     { icon: AlertTriangle, color: 'text-warn', bg: 'bg-warn/10', border: 'border-warn/30', label: 'HIGH' },
  medium:   { icon: Info, color: 'text-info', bg: 'bg-info/10', border: 'border-info/30', label: 'MEDIUM' },
  low:      { icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30', label: 'LOW' },
}

function SeverityBadge({ severity }) {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.medium
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold ${cfg.color} ${cfg.bg} border ${cfg.border}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function RootCauseCard({ cause, index }) {
  const pct = Math.round((cause.confidence || 0) * 100)
  return (
    <div className="bg-surface border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-warn/10 border border-warn/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] font-mono font-bold text-warn">{index + 1}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{cause.title}</p>
            {cause.location && (
              <p className="text-[11px] font-mono text-muted mt-0.5">{cause.location}</p>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-xs font-mono text-warn font-semibold">{pct}%</p>
          <p className="text-[10px] text-muted">confidence</p>
        </div>
      </div>
      <div className="w-full bg-border rounded-full h-1">
        <div className="h-1 rounded-full bg-warn transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-text/80 leading-relaxed">{cause.description}</p>
      {cause.service && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-info/10 border border-info/20 rounded text-[10px] text-info font-mono">
          <Server size={9} /> {cause.service}
        </span>
      )}
    </div>
  )
}

function FixCard({ fix }) {
  const [expanded, setExpanded] = useState(false)
  const hasCode = fix.code_before || fix.code_after
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="p-4 space-y-2">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 rounded bg-accent/10 border border-accent/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Wrench size={10} className="text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">{fix.title}</p>
            <p className="text-xs text-text/70 mt-1 leading-relaxed">{fix.description}</p>
          </div>
          <span className="text-[10px] font-mono text-muted bg-border px-1.5 py-0.5 rounded flex-shrink-0">P{fix.priority || 1}</span>
        </div>
        {hasCode && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-[11px] text-accent/80 hover:text-accent font-mono transition-colors"
          >
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {expanded ? 'Hide' : 'Show'} code diff
          </button>
        )}
      </div>
      {expanded && hasCode && (
        <div className="border-t border-border">
          {fix.code_before && (
            <div>
              <div className="px-4 py-2 bg-crit/5 border-b border-border flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-crit" />
                <span className="text-[10px] font-mono text-muted">Before (broken)</span>
              </div>
              <SyntaxHighlighter
                language="python"
                style={vscDarkPlus}
                customStyle={{ margin: 0, borderRadius: 0, fontSize: '11px', background: '#0d0f14' }}
              >
                {fix.code_before}
              </SyntaxHighlighter>
            </div>
          )}
          {fix.code_after && (
            <div>
              <div className="px-4 py-2 bg-accent/5 border-t border-b border-border flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-[10px] font-mono text-muted">After (fixed)</span>
              </div>
              <SyntaxHighlighter
                language="python"
                style={vscDarkPlus}
                customStyle={{ margin: 0, borderRadius: 0, fontSize: '11px', background: '#0d0f14' }}
              >
                {fix.code_after}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultPanel({ result }) {
  const [activeSection, setActiveSection] = useState('causes')

  const tabs = [
    { id: 'causes', label: 'Root Causes', count: result.root_causes?.length },
    { id: 'fixes', label: 'Fixes', count: result.fixes?.length },
    { id: 'similar', label: 'Similar Issues', count: result.similar_issues?.length },
    { id: 'steps', label: 'Analysis Steps', count: result.analysis_steps?.length },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-display text-lg font-bold text-white">Analysis Complete</h2>
            <SeverityBadge severity={result.severity} />
          </div>
          <p className="text-sm text-text/80 leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* Affected services */}
      {result.affected_services?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-muted font-mono">Affected:</span>
          {result.affected_services.map(s => (
            <span key={s} className="flex items-center gap-1 px-2 py-0.5 bg-surface border border-border rounded-full text-[11px] text-info font-mono">
              <Server size={9} /> {s}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono transition-colors border-b-2 -mb-px ${
              activeSection === tab.id
                ? 'text-accent border-accent'
                : 'text-muted border-transparent hover:text-text'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              activeSection === tab.id ? 'bg-accent/20 text-accent' : 'bg-border text-muted'
            }`}>{tab.count || 0}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeSection === 'causes' && (
          result.root_causes?.length > 0
            ? result.root_causes.map((c, i) => <RootCauseCard key={i} cause={c} index={i} />)
            : <p className="text-sm text-muted font-mono text-center py-8">No root causes identified</p>
        )}

        {activeSection === 'fixes' && (
          result.fixes?.length > 0
            ? result.fixes.map((f, i) => <FixCard key={i} fix={f} />)
            : <p className="text-sm text-muted font-mono text-center py-8">No fixes suggested</p>
        )}

        {activeSection === 'similar' && (
          result.similar_issues?.length > 0
            ? result.similar_issues.map((s, i) => (
                <div key={i} className="bg-surface border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{s.title}</p>
                    <span className="text-[10px] font-mono text-accent/80 bg-accent/10 px-2 py-0.5 rounded flex-shrink-0">
                      {Math.round((s.similarity_score || 0) * 100)}% match
                    </span>
                  </div>
                  <p className="text-xs text-text/70 leading-relaxed">{s.description}</p>
                  {s.resolution && (
                    <div className="mt-2 p-3 bg-accent/5 border border-accent/20 rounded-lg">
                      <p className="text-[11px] text-muted font-mono mb-1">Resolution:</p>
                      <p className="text-xs text-text/80 leading-relaxed">{s.resolution}</p>
                    </div>
                  )}
                </div>
              ))
            : <p className="text-sm text-muted font-mono text-center py-8">No similar issues found in knowledge base</p>
        )}

        {activeSection === 'steps' && (
          <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
            {result.analysis_steps?.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs font-mono text-text/80">
                <span className="text-accent flex-shrink-0 mt-0.5">▸</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
