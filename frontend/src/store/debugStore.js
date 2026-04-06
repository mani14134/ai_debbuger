import { create } from 'zustand'

export const useDebugStore = create((set, get) => ({
  // Analysis state
  result: null,
  isAnalyzing: false,
  analysisSteps: [],
  currentStep: '',
  error: null,
  sessionId: `session-${Date.now()}`,

  // Chat state
  chatHistory: [],
  isChatLoading: false,

  // UI state
  activeTab: 'analyze',

  setActiveTab: (tab) => set({ activeTab: tab }),

  startAnalysis: () => set({
    isAnalyzing: true,
    result: null,
    analysisSteps: [],
    currentStep: '',
    error: null,
  }),

  addStep: (step) => set((s) => ({
    analysisSteps: [...s.analysisSteps, step],
    currentStep: step,
  })),

  setResult: (result) => set({
    result,
    isAnalyzing: false,
    currentStep: '',
  }),

  setError: (error) => set({ error, isAnalyzing: false }),

  resetAnalysis: () => set({
    result: null,
    isAnalyzing: false,
    analysisSteps: [],
    currentStep: '',
    error: null,
  }),

  addChatMessage: (role, content, suggestions = []) => set((s) => ({
    chatHistory: [...s.chatHistory, { role, content, suggestions, ts: Date.now() }],
  })),

  setChatLoading: (v) => set({ isChatLoading: v }),
  clearChat: () => set({ chatHistory: [] }),
}))
