import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { FinSoftIntro } from '../finsoft-intro/FinSoftIntro'
import './styles.css'

export function Root() {
  const [ready, setReady] = useState(false)

  return ready ? <App /> : (
    <FinSoftIntro
      onComplete={() => setReady(true)}
      steps={['İş sahəsi hazırlanır', 'Bağlantı yoxlanılır', 'Məlumatlar yüklənir', 'Hazırdır']}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
