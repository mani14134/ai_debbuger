import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, Trash2, Lightbulb } from 'lucide-react'
import { useDebugStore } from '../store/debugStore'
import { sendChat } from '../services/api'
import toast from 'react-hot-toast'

export default function ChatPanel({ sessionId }) {
  const { chatHistory, isChatLoading, addChatMessage, setChatLoading, clearChat } = useDebugStore()
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const send = async (message) => {
    const msg = message || input.trim()
    if (!msg || isChatLoading) return
    setInput('')
    addChatMessage('user', msg)
    setChatLoading(true)

    try {
      const history = chatHistory.map(m => ({ role: m.role, content: m.content }))
      const { reply, suggestions } = await sendChat(sessionId, msg, history)
      addChatMessage('assistant', reply, suggestions)
    } catch (e) {
      toast.error('Chat failed. Check backend connection.')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-accent" />
          <span className="text-sm font-semibold text-text">Debug Assistant</span>
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
        </div>
        <button
          onClick={clearChat}
          className="p-1.5 rounded text-muted hover:text-crit transition-colors"
          title="Clear chat"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 && (
          <div className="text-center py-8">
            <Bot size={32} className="text-muted/30 mx-auto mb-3" />
            <p className="text-xs text-muted font-mono">Ask follow-up questions about your debug analysis</p>
            <div className="mt-4 space-y-2">
              {[
                'What is the most likely root cause?',
                'How do I prevent this in the future?',
                'Are there related performance issues?',
              ].map(q => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="block w-full text-left px-3 py-2 text-xs text-muted hover:text-accent border border-border hover:border-accent/30 rounded-lg transition-all font-mono"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0
              ${msg.role === 'user' ? 'bg-accent/10 border border-accent/20' : 'bg-surface border border-border'}`}
            >
              {msg.role === 'user'
                ? <User size={12} className="text-accent" />
                : <Bot size={12} className="text-info" />
              }
            </div>
            <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
              <div className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-accent/10 border border-accent/20 text-text'
                  : 'bg-base border border-border text-text/90'
                }`}
              >
                {msg.content}
              </div>

              {/* Follow-up suggestions */}
              {msg.role === 'assistant' && msg.suggestions?.length > 0 && (
                <div className="space-y-1 w-full">
                  {msg.suggestions.map((s, j) => (
                    <button
                      key={j}
                      onClick={() => send(s)}
                      className="flex items-center gap-1.5 text-[11px] text-muted hover:text-accent font-mono transition-colors"
                    >
                      <Lightbulb size={10} />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isChatLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center">
              <Bot size={12} className="text-info" />
            </div>
            <div className="bg-base border border-border rounded-xl px-3 py-2.5">
              <Loader2 size={13} className="text-accent animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Ask about the debug analysis..."
          className="flex-1 bg-base border border-border rounded-lg px-3 py-2 text-xs text-text placeholder-muted/50 focus:outline-none focus:border-accent/50 font-mono transition-colors"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || isChatLoading}
          className="p-2 rounded-lg bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
