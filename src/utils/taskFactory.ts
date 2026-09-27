import { nanoid } from 'nanoid'
import type { AppData, AppSettings, Priority, Project, Subtask, Task } from '../types'
import { DEFAULT_SETTINGS, PROJECT_COLORS } from '../types'
import * as db from '../db'

const SEED_KEY = 'odak-seeded-v1'

function now() {
  return new Date().toISOString()
}

export function normalizeDuration(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.min(365, Math.floor(n))
}

export function createProject(
  name: string,
  order: number,
  color?: string,
): Project {
  return {
    id: nanoid(),
    name,
    color: color ?? PROJECT_COLORS[order % PROJECT_COLORS.length],
    icon: 'folder',
    createdAt: now(),
    order,
  }
}

export function createTask(partial: Partial<Task> & { title: string }): Task {
  const timestamp = now()
  return {
    id: nanoid(),
    title: partial.title,
    notes: partial.notes ?? '',
    completed: partial.completed ?? false,
    priority: partial.priority ?? 'medium',
    dueDate: partial.dueDate ?? null,
    durationDays: normalizeDuration(partial.durationDays),
    projectId: partial.projectId ?? null,
    tags: partial.tags ?? [],
    subtasks: partial.subtasks ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
    order: partial.order ?? Date.now(),
    recurring: partial.recurring ?? null,
  }
}

export function createSubtask(title: string): Subtask {
  return { id: nanoid(), title, completed: false }
}

export async function seedIfEmpty(): Promise<{
  projects: Project[]
  tasks: Task[]
  settings: AppSettings
}> {
  const [existingProjects, existingTasks, settings] = await Promise.all([
    db.loadProjects(),
    db.loadTasks(),
    db.loadSettings(),
  ])

  if (existingProjects.length || existingTasks.length || localStorage.getItem(SEED_KEY)) {
    return { projects: existingProjects, tasks: existingTasks, settings }
  }

  const work = createProject('İş', 0, PROJECT_COLORS[1])
  const personal = createProject('Kişisel', 1, PROJECT_COLORS[0])
  const learning = createProject('Öğrenme', 2, PROJECT_COLORS[4])

  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 5)

  const tasks: Task[] = [
    createTask({
      title: 'Odak uygulamasını keşfet',
      notes: 'Klavye kısayolları: Ctrl+K arama, N yeni görev, / odaklan.',
      priority: 'high',
      dueDate: today.toISOString(),
      projectId: personal.id,
      tags: ['başlangıç'],
      order: 1,
      subtasks: [
        createSubtask('Bir proje oluştur'),
        createSubtask('Göreve etiket ekle'),
        createSubtask('Uygulamayı ana ekrana ekle'),
      ],
    }),
    createTask({
      title: 'Haftalık planı gözden geçir',
      priority: 'medium',
      dueDate: tomorrow.toISOString(),
      projectId: work.id,
      tags: ['planlama'],
      order: 2,
    }),
    createTask({
      title: 'TypeScript ve PWA notlarını oku',
      priority: 'low',
      dueDate: nextWeek.toISOString(),
      projectId: learning.id,
      tags: ['öğrenme', 'tech'],
      order: 3,
    }),
    createTask({
      title: 'Alışveriş listesi',
      priority: 'medium',
      projectId: null,
      tags: ['ev'],
      order: 4,
      subtasks: [
        createSubtask('Süt'),
        createSubtask('Ekmek'),
        createSubtask('Kahve'),
      ],
    }),
  ]

  const projects = [work, personal, learning]
  await Promise.all([
    ...projects.map((p) => db.saveProject(p)),
    ...tasks.map((t) => db.saveTask(t)),
    db.saveSettings(settings),
  ])
  localStorage.setItem(SEED_KEY, '1')

  return { projects, tasks, settings }
}

export function exportData(
  projects: Project[],
  tasks: Task[],
  settings: AppSettings,
): AppData {
  return {
    version: 1,
    projects,
    tasks,
    settings,
    exportedAt: now(),
  }
}

export function parseImport(raw: unknown): {
  projects: Project[]
  tasks: Task[]
  settings: AppSettings
} {
  if (!raw || typeof raw !== 'object') throw new Error('Geçersiz dosya')
  const data = raw as Partial<AppData>
  if (!Array.isArray(data.projects) || !Array.isArray(data.tasks)) {
    throw new Error('Dosyada projects/tasks bulunamadı')
  }
  return {
    projects: data.projects,
    tasks: data.tasks,
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
  }
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}
