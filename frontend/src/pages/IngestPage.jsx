import React, { useState } from 'react'
import { PlusCircle, CheckCircle } from 'lucide-react'
import { ingestIssue } from '../services/api'
import toast from 'react-hot-toast'

export default function IngestPage() {
  const [form, setForm] = useState({
    title: '', description: '', resolution: '', tags: '', language: 'python'
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title || !form.description || !form.resolution) {
      toast.error('Title, description, and resolution are required')
      return
    }
    setLoading(true)
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      await ingestIssue({ ...form, tags })
      setSuccess(true)
      setForm({ title: '', description: '', resolution: '', tags: '', language: 'python' })
      toast.success('Issue stored in knowledge base!')
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      toast.error('Failed to store issue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <PlusCircle size={20} className="text-accent" />
          <h1 className="font-display text-2xl font-bold text-white">Add Resolved Issue</h1>
        </div>
        <p className="text-sm text-muted">
          Contribute a resolved bug to the knowledge base. Future analyses will use it as reference via semantic search.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-mono text-muted mb-1.5">Issue Title *</label>
          <input
            value={form.title}
            onChange={e => update('title', e.target.value)}
            placeholder="e.g. Redis connection pool exhaustion under high load"
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-muted mb-1.5">Problem Description *</label>
          <textarea
            value={form.description}
            onChange={e => update('description', e.target.value)}
            placeholder="Describe the symptoms, error messages, and context..."
            rows={4}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-muted/50 focus:outline-none focus:border-accent/50 resize-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-muted mb-1.5">Resolution *</label>
          <textarea
            value={form.resolution}
            onChange={e => update('resolution', e.target.value)}
            placeholder="What fixed the issue? Include code changes, config updates, or architectural changes..."
            rows={5}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-muted/50 focus:outline-none focus:border-accent/50 resize-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-muted mb-1.5">Language</label>
            <select
              value={form.language}
              onChange={e => update('language', e.target.value)}
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-accent/50 transition-colors"
            >
              {['python', 'java', 'javascript', 'go', 'rust', 'other'].map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-mono text-muted mb-1.5">Tags (comma-separated)</label>
            <input
              value={form.tags}
              onChange={e => update('tags', e.target.value)}
              placeholder="redis, microservices, cache"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text font-mono placeholder-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-semibold text-sm transition-all
            ${success
              ? 'bg-accent/20 border border-accent text-accent'
              : 'bg-accent text-base hover:bg-accent/90 shadow-lg shadow-accent/20 disabled:opacity-60'
            }`}
        >
          {success ? <><CheckCircle size={16} /> Stored Successfully!</> : loading ? 'Storing...' : <><PlusCircle size={16} /> Add to Knowledge Base</>}
        </button>
      </form>
    </div>
  )
}
