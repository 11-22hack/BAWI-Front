import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Preview from './pages/Preview'
import Status from './pages/Status'
import Result from './pages/Result'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/status" element={<Status />} />
        <Route path="/result/:id" element={<Result />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

