import { useState } from 'react'
import { TodoProvider, useTodo } from './store/TodoContext'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import {
  ProjectModal,
  SettingsModal,
  Sidebar,
  TopBar,
} from './components/Sidebar'
import { QuickAdd, TaskBoard } from './components/TaskBoard'
import { DetailPanel } from './components/DetailPanel'
import { CommandPalette } from './components/CommandPalette'
import { InstallBanner } from './components/InstallBanner'

function AppInner() {
  const { ready, selectedTaskId } = useTodo()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [projectOpen, setProjectOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useKeyboardShortcuts()

  if (!ready) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <div style={{ color: 'var(--text-muted)' }}>Odak yükleniyor…</div>
      </div>
    )
  }

  return (
    <>
      <div className={`app-shell ${selectedTaskId ? 'panel-open' : ''}`}>
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
          onNewProject={() => setProjectOpen(true)}
        />
        <main className="main">
          <TopBar onMenu={() => setSidebarOpen(true)} />
          <div className="content">
            <QuickAdd />
            <TaskBoard />
          </div>
        </main>
        {selectedTaskId && <DetailPanel />}
      </div>

      <CommandPalette />
      <ProjectModal open={projectOpen} onClose={() => setProjectOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InstallBanner />
    </>
  )
}

export default function App() {
  return (
    <TodoProvider>
      <AppInner />
    </TodoProvider>
  )
}
