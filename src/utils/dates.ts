import {
  addDays,
  format,
  isBefore,
  isSameDay,
  isToday,
  isTomorrow,
  parseISO,
  startOfDay,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import type { Task, ViewId } from '../types'

export function formatDueDate(iso: string | null): string {
  if (!iso) return ''
  const date = parseISO(iso)
  if (isToday(date)) return 'Bugün'
  if (isTomorrow(date)) return 'Yarın'
  return format(date, 'd MMM', { locale: tr })
}

export function formatFullDate(iso: string): string {
  return format(parseISO(iso), 'd MMMM yyyy', { locale: tr })
}

export function isOverdue(iso: string | null, completed: boolean): boolean {
  if (!iso || completed) return false
  return isBefore(startOfDay(parseISO(iso)), startOfDay(new Date()))
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
      // Only tasks due today — completed or not. No past/future.
      filtered = tasks.filter(
        (t) => t.dueDate && isToday(parseISO(t.dueDate)),
      )
      break
    case view.startsWith('day:'): {
      const key = view.slice('day:'.length)
      filtered = tasks.filter(
        (t) => t.dueDate && toDateKey(t.dueDate) === key,
      )
      break
    }
    case view === 'upcoming':
      filtered = tasks.filter(
        (t) =>
          !t.completed &&
          t.dueDate &&
          !isToday(parseISO(t.dueDate)) &&
          !isOverdue(t.dueDate, false),
      )
      break
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
    const dayTasks = tasks.filter(
      (t) => t.dueDate && isSameDay(parseISO(t.dueDate), day),
    )
    if (dayTasks.length) {
      groups.push({
        label: i === 1 ? 'Yarın' : format(day, 'EEEE, d MMM', { locale: tr }),
        tasks: dayTasks,
      })
    }
  }

  const later = tasks.filter((t) => {
    if (!t.dueDate) return false
    return startOfDay(parseISO(t.dueDate)) >= addDays(today, 8)
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
