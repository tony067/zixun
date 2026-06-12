import { useEffect } from 'react'
import './app.scss'

function App({ children }: { children: React.ReactNode }) {
  useEffect(() => {}, [])
  return children
}

export default App
