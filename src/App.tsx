import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StoreProvider } from './store'
import { CompareStart, CompareView } from './routes/Compare'
import Curate from './routes/Curate'
import Demo from './routes/Demo'
import Guide from './routes/Guide'
import Share from './routes/Share'
import Snapshot from './routes/Snapshot'
import Upload from './routes/Upload'
import Viewer, { ShortViewer } from './routes/Viewer'
import Welcome from './routes/Welcome'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollTop />
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/demo" element={<Demo />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/snapshot" element={<Snapshot />} />
          <Route path="/curate" element={<Curate />} />
          <Route path="/share" element={<Share />} />
          <Route path="/v/*" element={<Viewer />} />
          <Route path="/g/:id" element={<ShortViewer />} />
          <Route path="/compare" element={<CompareStart />} />
          <Route path="/c/:a/:b" element={<CompareView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
