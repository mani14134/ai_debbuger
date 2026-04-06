import React, { useState } from 'react'
import { Search, BookOpen, Tag } from 'lucide-react'
import { searchKnowledge } from '../services/api'
import toast from 'react-hot-toast'

export default function KnowledgePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await searchKnowledge(query.trim(), 8)
      setResults(data.results || [])
    } catch {
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2.5 mb-2">
          <BookOpen size={20} className="text-accent" />
          <h1 className="font-display text-2xl font-bold text-white">Knowledge Base</h1>
        </div>
        <p className="text-sm text-muted">
          Search the vector database for similar bugs and resolved issues. Powered by Qdrant semantic search.
        </p>
      </div>

      <form onSubmit={search} className="flex gap-3 mb-8">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g. NullPointerException Spring Boot, Redis cache miss storm, asyncio event loop..."
          className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-sm text-text placeholder-muted/50 focus:outline-none focus:border-accent/50 font-mono transition-colors"
        />
        <button
          type="submit"
          disabled={!query.trim() || loading}
          className="flex items-center gap-2 px-5 py-3 bg-accent/10 border border-accent/30 text-accent rounded-xl hover:bg-accent/20 disabled:opacity-40 transition-all text-sm font-semibold"
        >
          <Search size={15} />
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted font-mono">{results.length} results for "{query}"</p>
          {results.map((r, i) => (
            <div key={i} className="bg-surface border border-border rounded-xl p-5 card-glow transition-all">
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-sm font-semibold text-text">{r.title}</h3>
                <span className="flex-shrink-0 text-xs font-mono text-info bg-info/10 px-2 py-0.5 rounded border border-info/20">
                  {Math.round((r.similarity_score || 0) * 100)}% match
                </span>
              </div>
              <p className="text-xs text-muted/80 mb-3 leading-relaxed">{r.description}</p>
              {r.resolution && (
                <div className="bg-accent/5 border border-accent/15 rounded-lg p-3">
                  <p className="text-[10px] font-mono text-accent/60 mb-1">RESOLUTION</p>
                  <p className="text-xs text-text/80 leading-relaxed">{r.resolution}</p>
                </div>
              )}
              {r.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {r.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-white/5 border border-border rounded-full text-muted font-mono">
                      <Tag size={9} /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {searched && results.length === 0 && !loading && (
        <div className="text-center py-16">
          <Search size={32} className="text-muted/30 mx-auto mb-3" />
          <p className="text-sm text-muted">No matching issues found.</p>
          <p className="text-xs text-muted/60 mt-1">Try different keywords or add new issues via "Add Issue"</p>
        </div>
      )}

      {!searched && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {['Connection pool exhaustion', 'Kafka consumer lag', 'OOMKilled kubernetes', 'asyncio event loop closed'].map(q => (
            <button
              key={q}
              onClick={() => { setQuery(q); }}
              className="text-left px-4 py-3 bg-surface border border-border rounded-xl text-xs text-muted hover:text-accent hover:border-accent/30 transition-all font-mono"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
