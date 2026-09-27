import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Inbox,
  Menu,
  Moon,
  Plus,
  Search,
  Settings2,
  Sun,
  Upload,
  Monitor,
} from 'lucide-react'
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { ViewId } from '../types'
import { PROJECT_COLORS } from '../types'
import { useTodo } from '../store/TodoContext'
import { getViewTitle, taskCoversDateKey, todayKey } from '../utils/dates'
import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { DayCalendar } from './DayCalendar'

interface SidebarProps {
  open: boolean
  onClose: () => void
  onOpenSettings: () => void
  onNewProject: () => void
}

export function Sidebar({
  open,
  onClose,
  onOpenSettings,
  onNewProject,
}: SidebarProps) {
  const { projects, tasks, view, setView, tags, settings, updateSettings } =
    useTodo()

  const counts = useMemo(() => {
    const active = tasks.filter((t) => !t.completed)
    const tomorrow = startOfDay(addDays(new Date(), 1))
    return {
      inbox: active.filter((t) => !t.projectId).length,
      today: active.filter((t) => taskCoversDateKey(t, todayKey())).length,
      upcoming: active.filter((t) => {
        if (!t.dueDate) return false
        const end = startOfDay(
          addDays(parseISO(t.dueDate), Math.max(1, t.durationDays || 1) - 1),
        )
        return end >= tomorrow
      }).length,
      completed: tasks.filter((t) => t.completed).length,
      total: tasks.length,
      done: tasks.filter((t) => t.completed).length,
    }
  }, [tasks])

  const progress =
    counts.total === 0 ? 0 : Math.round((counts.done / counts.total) * 100)

  const go = (next: ViewId) => {
    setView(next)
    onClose()
  }

  const cycleTheme = () => {
    const order = ['system', 'light', 'dark'] as const
    const idx = order.indexOf(settings.theme)
    void updateSettings({ theme: order[(idx + 1) % order.length] })
  }

  const ThemeIcon =
    settings.theme === 'light' ? Sun : settings.theme === 'dark' ? Moon : Monitor

  return (
    <>
      {open && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            <CheckCircle2 size={22} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <span className="brand-name">Odak</span>
            <span className="brand-tag">Görevlerini yakala</span>
          </div>
        </div>

        <nav className="nav-section" aria-label="Görünümler">
          <NavBtn
            active={view === 'inbox'}
            onClick={() => go('inbox')}
            icon={<Inbox size={18} />}
            label="Gelen Kutusu"
            count={counts.inbox}
          />
          <NavBtn
            active={view === 'today'}
            onClick={() => go('today')}
            icon={<CalendarDays size={18} />}
            label="Bugün"
            count={counts.today}
          />
          <NavBtn
            active={view === 'upcoming'}
            onClick={() => go('upcoming')}
            icon={<CalendarDays size={18} />}
            label="Yaklaşan"
            count={counts.upcoming}
          />
          <NavBtn
            active={view === 'completed'}
            onClick={() => go('completed')}
            icon={<CheckCircle2 size={18} />}
            label="Tamamlanan"
            count={counts.completed}
          />
        </nav>

        <div className="nav-section">
          <div className="nav-label" style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ flex: 1 }}>Projeler</span>
            <button
              className="icon-btn"
              onClick={onNewProject}
              aria-label="Yeni proje"
              title="Yeni proje"
            >
              <Plus size={16} />
            </button>
          </div>
          {projects.map((p) => (
            <NavBtn
              key={p.id}
              active={view === `project:${p.id}`}
              onClick={() => go(`project:${p.id}`)}
              icon={<span className="dot" style={{ background: p.color }} />}
              label={p.name}
              count={tasks.filter((t) => t.projectId === p.id && !t.completed).length}
            />
          ))}
        </div>

        {tags.length > 0 && (
          <div className="nav-section">
            <div className="nav-label">Etiketler</div>
            {tags.map((tag) => (
              <NavBtn
                key={tag}
                active={view === `tag:${tag}`}
                onClick={() => go(`tag:${tag}`)}
                icon={<span style={{ fontSize: 14, opacity: 0.7 }}>#</span>}
                label={tag}
                count={tasks.filter((t) => t.tags.includes(tag) && !t.completed).length}
              />
            ))}
          </div>
        )}

        <div className="sidebar-footer">
          <div className="stats-card">
            <div className="stats-row">
              <div className="stat">
                <div className="stat-value">{counts.done}</div>
                <div className="stat-label">Biten</div>
              </div>
              <div className="stat">
                <div className="stat-value">{counts.total - counts.done}</div>
                <div className="stat-label">Açık</div>
              </div>
              <div className="stat">
                <div className="stat-value">{progress}%</div>
                <div className="stat-label">İlerleme</div>
              </div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <button className="icon-btn" onClick={cycleTheme} title="Tema">
              <ThemeIcon size={18} />
            </button>
            <button className="icon-btn" onClick={onOpenSettings} title="Ayarlar">
              <Settings2 size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  count: number
}) {
  return (
    <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      <span className="count">{count}</span>
    </button>
  )
}

export function ProjectModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const { addProject, setView } = useTodo()
  const [name, setName] = useState('')
  const [color, setColor] = useState<string>(PROJECT_COLORS[0])
  const inputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const project = await addProject(name.trim(), color)
    setName('')
    setColor(PROJECT_COLORS[0])
    setView(`project:${project.id}`)
    onClose()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <div className="modal-header">
          <h2>Yeni proje</h2>
          <button type="button" className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label className="field-label" htmlFor="project-name">
              İsim
            </label>
            <input
              id="project-name"
              ref={inputRef}
              className="field-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn. Lansman"
              autoFocus
            />
          </div>
          <div className="field">
            <span className="field-label">Renk</span>
            <div className="color-picker">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            İptal
          </button>
          <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
            Oluştur
          </button>
        </div>
      </form>
    </div>
  )
}

export function SettingsModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const {
    settings,
    updateSettings,
    downloadExport,
    importFromFile,
    clearCompleted,
    removeProject,
    projects,
  } = useTodo()
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ayarlar</h2>
          <button className="icon-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="field">
            <span className="field-label">Tema</span>
            <select
              className="field-control"
              value={settings.theme}
              onChange={(e) =>
                void updateSettings({
                  theme: e.target.value as typeof settings.theme,
                })
              }
            >
              <option value="system">Sistem</option>
              <option value="dark">Koyu</option>
              <option value="light">Açık</option>
            </select>
          </div>

          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              checked={settings.showCompleted}
              onChange={(e) =>
                void updateSettings({ showCompleted: e.target.checked })
              }
            />
            <span>Proje görünümlerinde tamamlananları göster</span>
          </label>

          <div className="field">
            <span className="field-label">Veri</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={downloadExport}>
                <Download size={16} /> Dışa aktar
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={16} /> İçe aktar
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void importFromFile(file).then(onClose)
                }}
              />
            </div>
          </div>

          <div className="field">
            <span className="field-label">Tehlikeli alan</span>
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (confirm('Tüm tamamlanan görevler silinsin mi?')) {
                  void clearCompleted()
                }
              }}
            >
              Tamamlananları temizle
            </button>
            {projects.length > 0 && (
              <select
                className="field-control"
                defaultValue=""
                onChange={(e) => {
                  const id = e.target.value
                  if (!id) return
                  const p = projects.find((x) => x.id === id)
                  if (p && confirm(`“${p.name}” projesi silinsin mi?`)) {
                    void removeProject(id)
                  }
                  e.target.value = ''
                }}
              >
                <option value="" disabled>
                  Proje sil…
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Tamam
          </button>
        </div>
      </div>
    </div>
  )
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const { view, projects, tasks, setSearchOpen, setView } = useTodo()
  const [calendarOpen, setCalendarOpen] = useState(false)

  const project =
    view.startsWith('project:')
      ? projects.find((p) => p.id === view.slice(8))
      : undefined

  const dayKey =
    view === 'today'
      ? todayKey()
      : view.startsWith('day:')
        ? view.slice(4)
        : null

  const title =
    view === 'inbox'
      ? 'Gelen Kutusu'
      : view === 'today' || view.startsWith('day:')
        ? getViewTitle(view)
        : view === 'upcoming'
          ? 'Yaklaşan'
          : view === 'completed'
            ? 'Tamamlanan'
            : view.startsWith('tag:')
              ? `#${view.slice(4)}`
              : (project?.name ?? 'Görevler')

  const dayTasks =
    dayKey != null
      ? tasks.filter((t) => taskCoversDateKey(t, dayKey))
      : null
  const openCount =
    dayTasks != null
      ? dayTasks.filter((t) => !t.completed).length
      : tasks.filter((t) => !t.completed).length

  const showCalendar = view === 'today' || view.startsWith('day:')

  const selectDay = (key: string) => {
    if (key === todayKey()) setView('today')
    else setView(`day:${key}`)
  }

  const shiftDay = (delta: number) => {
    if (!dayKey) return
    const next = format(
      addDays(parseISO(`${dayKey}T12:00:00`), delta),
      'yyyy-MM-dd',
    )
    selectDay(next)
  }

  return (
    <>
      <header className="main-header">
        <div>
          <div className="title-row">
            <button className="icon-btn mobile-menu" onClick={onMenu} aria-label="Menü">
              <Menu size={20} />
            </button>
            {showCalendar && (
              <button
                type="button"
                className="icon-btn day-nav"
                onClick={() => shiftDay(-1)}
                aria-label="Önceki gün"
                title="Önceki gün"
              >
                <ChevronLeft size={22} />
              </button>
            )}
            <h1 className="main-title">{title}</h1>
            {showCalendar && (
              <>
                <button
                  type="button"
                  className="icon-btn day-nav"
                  onClick={() => shiftDay(1)}
                  aria-label="Sonraki gün"
                  title="Sonraki gün"
                >
                  <ChevronRight size={22} />
                </button>
                <button
                  type="button"
                  className="icon-btn calendar-trigger"
                  onClick={() => setCalendarOpen(true)}
                  aria-label="Takvimi aç"
                  title="Takvim"
                >
                  <CalendarDays size={22} />
                </button>
              </>
            )}
          </div>
          <p className="main-subtitle">
            {dayTasks != null
              ? `${dayTasks.length} görev · ${openCount} açık · Ctrl+K ile ara`
              : `${openCount} açık görev · Ctrl+K ile ara`}
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-ghost"
            onClick={() => setSearchOpen(true)}
            title="Ara (Ctrl+K)"
          >
            <Search size={16} />
            Ara
          </button>
        </div>
      </header>

      <DayCalendar
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        selectedKey={dayKey}
        onSelect={selectDay}
      />
    </>
  )
}
