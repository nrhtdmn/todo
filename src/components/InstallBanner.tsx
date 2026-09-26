import { Download } from 'lucide-react'
import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export function InstallBanner() {
  const { canInstall, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('odak-install-dismissed') === '1',
  )

  if (!canInstall || dismissed) return null

  return (
    <div className="install-banner">
      <Download size={22} color="var(--accent)" />
      <div style={{ flex: 1 }}>
        <strong>Odak’ı yükle</strong>
        <p>Ana ekrana ekle, çevrimdışı kullan.</p>
      </div>
      <button
        className="btn btn-ghost"
        onClick={() => {
          localStorage.setItem('odak-install-dismissed', '1')
          setDismissed(true)
        }}
      >
        Sonra
      </button>
      <button className="btn btn-primary" onClick={() => void install()}>
        Yükle
      </button>
    </div>
  )
}
