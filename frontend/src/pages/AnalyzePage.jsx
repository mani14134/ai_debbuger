import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useDebugStore } from '../store/debugStore'
import { analyzeDebug } from '../services/api'
import DebugInputForm from '../components/DebugInputForm'
import AnalysisProgress from '../components/AnalysisProgress'
import ResultsPanel from '../components/ResultsPanel'
import ChatPanel from '../components/ChatPanel'

export default function AnalyzePage() {
  const {
    result, isAnalyzing, analysisSteps, currentStep, error,
    sessionId, startAnalysis, addStep, setResult, setError, resetAnalysis,
  } = useDebugStore()

  const handleSubmit = async (form) => {
    startAnalysis()
    addStep('🔍 Submitting to LangGraph pipeline...')

    try {
      const steps = [
        '📋 Parsing logs and stack traces...',
        '🔎 Searching Qdrant knowledge base...',
        '🏷️  Classifying severity...',
        '🎯 Running root cause analysis...',
        '🔧 Generating fix suggestions...',
        '📝 Writing executive summary...',
      ]
      let stepIdx = 0
      const stepTimer = setInterval(() => {
        if (stepIdx < steps.length) addStep(steps[stepIdx++])
        else clearInterval(stepTimer)
      }, 1200)

      const data = await analyzeDebug({ ...form, session_id: sessionId })
      clearInterval(stepTimer)
      setResult(data)
      toast.success('Analysis complete!')
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Analysis failed')
      toast.error('Analysis failed — check backend connection')
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel — input */}
      <div className="w-[420px] flex-shrink-0 border-r border-border bg-surface/50 overflow-y-auto">
        <div className="p-6">
          <div className="mb-5">
            <h1 className="font-display text-xl font-bold text-white mb-1">Root Cause Analysis</h1>
            <p className="text-xs text-muted">
              Paste logs, stack traces, or code. AI identifies root causes across microservices.
            </p>
          </div>
          <DebugInputForm onSubmit={handleSubmit} isLoading={isAnalyzing} />
        </div>
      </div>

      {/* Center panel — results */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {isAnalyzing && (
            <motion.div key="progress" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <AnalysisProgress steps={analysisSteps} currentStep={currentStep} />
            </motion.div>
          )}

          {error && !isAnalyzing && (
            <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-crit/5 border border-crit/30 rounded-xl p-5"
            >
              <p className="text-sm font-semibold text-crit mb-2">Analysis Failed</p>
              <p className="text-xs text-text/70 font-mono">{error}</p>
              <button onClick={resetAnalysis} className="mt-3 flex items-center gap-1.5 text-xs text-crit hover:text-white transition-colors font-mono">
                <RefreshCw size={11} /> Try again
              </button>
            </motion.div>
          )}

          {result && !isAnalyzing && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-white">Analysis Results</h2>
                <button onClick={resetAnalysis} className="flex items-center gap-1.5 text-xs text-muted hover:text-accent transition-colors font-mono">
                  <RefreshCw size={11} /> New Analysis
                </button>
              </div>
              <ResultsPanel result={result} />
            </motion.div>
          )}

          {!result && !isAnalyzing && !error && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-20"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-sm font-semibold text-text mb-2">No analysis yet</p>
              <p className="text-xs text-muted max-w-xs">
                Paste your logs or stack trace in the left panel and click "Run Root Cause Analysis"
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right panel — chat */}
      <div className="w-[340px] flex-shrink-0 border-l border-border p-4">
        <ChatPanel sessionId={sessionId} />
      </div>
    </div>
  )
}
