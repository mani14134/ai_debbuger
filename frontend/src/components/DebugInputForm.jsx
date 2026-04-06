import React, { useState, useEffect } from 'react'
import { Play, Trash2, ChevronDown, ChevronUp, Lightbulb, Plus, X } from 'lucide-react'
import { getExamples } from '../services/api'

const LANGUAGES = ['python', 'java', 'javascript', 'typescript', 'go', 'rust', 'c++', 'ruby', 'php', 'other']

export default function DebugInputForm({ onSubmit, isLoading }) {
  const [form, setForm] = useState({
    logs: '',
    stack_trace: '',
    code_snippet: '',
    user_description: '',
    language: 'python',
    services: [],
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [newService, setNewService] = useState('')
  const [examples, setExamples] = useState([])

  useEffect(() => {
    getExamples().then(d => setExamples(d.examples || [])).catch(() => {})
  }, [])

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const addService = () => {
    const name = newService.trim()
    if (name && !form.services.find(s => s.name === name)) {
      update('services', [...form.services, { name, language: form.language }])
      setNewService('')
    }
  }

  const removeService = (name) => update('services', form.services.filter(s => s.name !== name))

  const loadExample = (ex) => {
    setForm(f => ({
      ...f,
      logs: ex.logs || '',
      stack_trace: ex.stack_trace || '',
      language: ex.language || 'python',
      services: ex.services || [],
      user_description: '',
      code_snippet: '',
    }))
    setShowAdvanced(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  const hasInput = form.logs || form.stack_trace || form.code_snippet || form.user_description

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Examples */}
      {examples.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs text-muted font-mono self-center">Try example:</span>
          {examples.map((ex, i) => (
            <button
              key={i}
              type="button"
              onClick={() => loadExample(ex)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-surface border border-border rounded-lg text-muted hover:text-accent hover:border-accent/40 transition-all font-mono"
            >
              <Lightbulb size={11} />
              {ex.title}
            </button>
          ))}
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-xs font-mono text-muted mb-1.5">Describe the issue</label>
        <textarea
          value={form.user_description}
          onChange={e => update('user_description', e.target.value)}
          placeholder="e.g. Our order service crashes every 30 minutes with a NullPointerException in production..."
          rows={2}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text placeholder-muted/50 focus:outline-none focus:border-accent/50 resize-none transition-colors"
        />
      </div>

      {/* Stack Trace */}
      <div>
        <label className="block text-xs font-mono text-muted mb-1.5">Stack Trace / Error</label>
        <textarea
          value={form.stack_trace}
          onChange={e => update('stack_trace', e.target.value)}
          placeholder="Paste your stack trace or error message here..."
          rows={5}
          className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-xs text-accent font-mono placeholder-muted/40 focus:outline-none focus:border-accent/50 resize-none transition-colors"
        />
      </div>

      {/* Advanced toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center gap-2 text-xs text-muted hover:text-text transition-colors font-mono"
      >
        {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {showAdvanced ? 'Hide' : 'Show'} advanced inputs (logs, code, services)
      </button>

      {showAdvanced && (
        <div className="space-y-4 border-l-2 border-border pl-4">
          {/* Logs */}
          <div>
            <label className="block text-xs font-mono text-muted mb-1.5">Application Logs</label>
            <textarea
              value={form.logs}
              onChange={e => update('logs', e.target.value)}
              placeholder="Paste raw log output here..."
              rows={5}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-xs text-text font-mono placeholder-muted/40 focus:outline-none focus:border-accent/50 resize-none transition-colors"
            />
          </div>

          {/* Code snippet */}
          <div>
            <label className="block text-xs font-mono text-muted mb-1.5">Relevant Code Snippet</label>
            <textarea
              value={form.code_snippet}
              onChange={e => update('code_snippet', e.target.value)}
              placeholder="Paste the relevant code section..."
              rows={5}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-xs text-text font-mono placeholder-muted/40 focus:outline-none focus:border-accent/50 resize-none transition-colors"
            />
          </div>

          {/* Language + Services */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-muted mb-1.5">Primary Language</label>
              <select
                value={form.language}
                onChange={e => update('language', e.target.value)}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent/50 transition-colors"
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-muted mb-1.5">Add Microservices</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newService}
                  onChange={e => setNewService(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())}
                  placeholder="service-name"
                  className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text font-mono placeholder-muted/40 focus:outline-none focus:border-accent/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={addService}
                  className="px-3 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent hover:bg-accent/20 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Service tags */}
          {form.services.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {form.services.map(s => (
                <span
                  key={s.name}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-info/10 border border-info/30 rounded-full text-xs text-info font-mono"
                >
                  {s.name}
                  <button type="button" onClick={() => removeService(s.name)} className="hover:text-white">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!hasInput || isLoading}
        className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-lg font-semibold text-sm transition-all duration-200
          ${hasInput && !isLoading
            ? 'bg-accent text-base hover:bg-accent/90 shadow-lg shadow-accent/20'
            : 'bg-surface border border-border text-muted cursor-not-allowed'
          }`}
      >
        <Play size={15} />
        {isLoading ? 'Analyzing...' : 'Run Root Cause Analysis'}
      </button>
    </form>
  )
}
