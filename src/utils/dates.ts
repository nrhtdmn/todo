import {
  addDays,
  format,
  isBefore,
  isToday,
  isTomorrow,
  isWithinInterval,
  parseISO,
  startOfDay,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Task, ViewId } from '../types'

export function getDuration(task: Pick<Task, 'durationDays'>): number {
  const n = task.durationDays
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(365, Math.floor(n))
}

export function formatDueDate(iso: string | null): string {
  if (!iso) return ''
  const date = parseISO(iso)
  if (isToday(date)) return 'Bugün'
  if (isTomorrow(date)) return 'Yarın'
  return format(date, 'd MMM', { locale: tr })
}

export function formatTaskSchedule(task: Task): string {
  if (!task.dueDate) return ''
  const days = getDuration(task)
  const start = formatDueDate(task.dueDate)
  if (days <= 1) return start
  const end = addDays(parseISO(task.dueDate), days - 1)
  const endLabel = isToday(end)
    ? 'Bugün'
    : isTomorrow(end)
      ? 'Yarın'
      : format(end, 'd MMM', { locale: tr })
  return `${start} → ${endLabel} · ${days} gün`
}

export function formatFullDate(iso: string): string {
  return format(parseISO(iso), 'd MMMM yyyy', { locale: tr })
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) return false
  const end = startOfDay(addDays(parseISO(task.dueDate), getDuration(task) - 1))
  return isBefore(end, startOfDay(new Date()))
}

export function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  return format(parseISO(iso), 'yyyy-MM-dd')
}

export function fromDateInputValue(value: string): string | null {
  if (!value) return null
  return new Date(`${value}T12:00:00`).toISOString()
}

/** Local calendar day key from ISO datetime, e.g. 2026-09-28 */
export function toDateKey(iso: string): string {
  return format(parseISO(iso), 'yyyy-MM-dd')
}

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function parseDayView(view: ViewId): string | null {
  if (view === 'today') return todayKey()
  if (view.startsWith('day:')) return view.slice('day:'.length)
  return null
}

export function formatDayTitle(dateKey: string): string {
  const date = parseISO(`${dateKey}T12:00:00`)
  if (isToday(date)) return 'Bugün'
  if (isTomorrow(date)) return 'Yarın'
  return format(date, 'd MMMM yyyy', { locale: tr })
}

/** Task covers this calendar day (inclusive start + duration). */
export function taskCoversDateKey(task: Task, dateKey: string): boolean {
  if (!task.dueDate) return false
  const start = startOfDay(parseISO(task.dueDate))
  const end = startOfDay(addDays(start, getDuration(task) - 1))
  const day = startOfDay(parseISO(`${dateKey}T12:00:00`))
  return isWithinInterval(day, { start, end })
}

export function taskCoversDate(task: Task, date: Date): boolean {
  return taskCoversDateKey(task, format(date, 'yyyy-MM-dd'))
}

/** All day keys a task spans. */
export function taskDayKeys(task: Task): string[] {
  if (!task.dueDate) return []
  const days = getDuration(task)
  const start = parseISO(task.dueDate)
  return Array.from({ length: days }, (_, i) =>
    format(addDays(start, i), 'yyyy-MM-dd'),
  )
}

export function filterTasksByView(
  tasks: Task[],
  view: ViewId,
  showCompleted: boolean,
): Task[] {
  let filtered = tasks

  switch (true) {
    case view === 'inbox':
      filtered = tasks.filter((t) => !t.projectId && !t.completed)
      break
    case view === 'today':
      filtered = tasks.filter((t) => taskCoversDateKey(t, todayKey()))
      break
    case view.startsWith('day:'): {
      const key = view.slice('day:'.length)
      filtered = tasks.filter((t) => taskCoversDateKey(t, key))
      break
    }
    case view === 'upcoming': {
      const tomorrow = startOfDay(addDays(new Date(), 1))
      filtered = tasks.filter((t) => {
        if (t.completed || !t.dueDate) return false
        const start = startOfDay(parseISO(t.dueDate))
        const end = startOfDay(addDays(start, getDuration(t) - 1))
        return end >= tomorrow
      })
      break
    }
    case view === 'completed':
      filtered = tasks.filter((t) => t.completed)
      break
    case view.startsWith('project:'): {
      const projectId = view.slice('project:'.length)
      filtered = tasks.filter((t) => t.projectId === projectId)
      if (!showCompleted) filtered = filtered.filter((t) => !t.completed)
      break
    }
    case view.startsWith('tag:'): {
      const tag = view.slice('tag:'.length)
      filtered = tasks.filter((t) => t.tags.includes(tag))
      if (!showCompleted) filtered = filtered.filter((t) => !t.completed)
      break
    }
    default:
      break
  }

  if (view === 'completed') {
    return filtered.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
  }

  return filtered.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return a.order - b.order
  })
}

export function getViewTitle(view: ViewId, projectName?: string): string {
  if (view === 'inbox') return 'Gelen Kutusu'
  if (view === 'today') return 'Bugün'
  if (view === 'upcoming') return 'Yaklaşan'
  if (view === 'completed') return 'Tamamlanan'
  if (view.startsWith('day:')) return formatDayTitle(view.slice(4))
  if (view.startsWith('project:')) return projectName ?? 'Proje'
  if (view.startsWith('tag:')) return `#${view.slice(4)}`
  return 'Görevler'
}

export function groupUpcoming(tasks: Task[]): { label: string; tasks: Task[] }[] {
  const groups: { label: string; tasks: Task[] }[] = []
  const today = startOfDay(new Date())

  for (let i = 1; i <= 7; i++) {
    const day = addDays(today, i)
    const dayTasks = tasks.filter((t) => taskCoversDate(t, day))
    if (dayTasks.length) {
      groups.push({
        label: i === 1 ? 'Yarın' : format(day, 'EEEE, d MMM', { locale: tr }),
        tasks: dayTasks,
      })
    }
  }

  const weekEnd = addDays(today, 7)
  const later = tasks.filter((t) => {
    if (!t.dueDate) return false
    return startOfDay(parseISO(t.dueDate)) > weekEnd
  })

  if (later.length) {
    groups.push({ label: 'Daha sonra', tasks: later })
  }

  return groups
}

export function collectTags(tasks: Task[]): string[] {
  const set = new Set<string>()
  for (const t of tasks) for (const tag of t.tags) set.add(tag)
  return [...set].sort((a, b) => a.localeCompare(b, 'tr'))
}

export function searchTasks(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.notes.toLowerCase().includes(q) ||
      t.tags.some((tag) => tag.toLowerCase().includes(q)),
  )
}
