import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTodo } from '../store/TodoContext'
import { formatDueDate, searchTasks } from '../utils/dates'

export function CommandPalette() {
  const {
    searchOpen,
    setSearchOpen,
    tasks,
    projects,
    setSelectedTaskId,
    setView,
  } = useTodo()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      setQuery('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [searchOpen])

  const results = useMemo(() => searchTasks(tasks, query), [tasks, query])

  if (!searchOpen) return null

  const openResult = (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    if (task.projectId) setView(`project:${task.projectId}`)
    else if (task.completed) setView('completed')
    else setView('inbox')
    setSelectedTaskId(id)
    setSearchOpen(false)
  }

  return (
    <div className="overlay" onClick={() => setSearchOpen(false)}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 14 }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            placeholder="Görev, etiket veya not ara…"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((i) => Math.min(i + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((i) => Math.max(i - 1, 0))
              } else if (e.key === 'Enter' && results[active]) {
                openResult(results[active].id)
              }
            }}
          />
        </div>
        <div className="command-results">
          {!query.trim() && (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: 14 }}>
              Yazmaya başla… Esc ile kapat.
            </div>
          )}
          {query.trim() && results.length === 0 && (
            <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: 14 }}>
              Sonuç bulunamadı.
            </div>
          )}
          {results.map((task, i) => {
            const project = projects.find((p) => p.id === task.projectId)
            return (
              <button
                key={task.id}
                className={`command-item ${i === active ? 'active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => openResult(task.id)}
              >
                <span
                  style={{
                    textDecoration: task.completed ? 'line-through' : undefined,
                    opacity: task.completed ? 0.6 : 1,
                  }}
                >
                  {task.title}
                </span>
                <span className="meta">
                  {project?.name}
                  {task.dueDate ? ` · ${formatDueDate(task.dueDate)}` : ''}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
