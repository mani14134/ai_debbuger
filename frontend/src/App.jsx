import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import AnalyzePage from './pages/AnalyzePage'
import KnowledgePage from './pages/KnowledgePage'
import IngestPage from './pages/IngestPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111218',
            color: '#e2e8f0',
            border: '1px solid #1e2030',
            fontFamily: 'DM Sans, sans-serif',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AnalyzePage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="ingest" element={<IngestPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
