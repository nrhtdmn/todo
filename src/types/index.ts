export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type ViewId =
  | 'inbox'
  | 'today'
  | 'upcoming'
  | 'completed'
  | `project:${string}`
  | `tag:${string}`
  | `day:${string}`

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Project {
  id: string
  name: string
  color: string
  icon: string
  createdAt: string
  order: number
}

export interface Task {
  id: string
  title: string
  notes: string
  completed: boolean
  priority: Priority
  dueDate: string | null
  /** Kaç gün süreceği. Boş/eksik = 1 gün. Başlangıç dueDate. */
  durationDays: number
  projectId: string | null
  tags: string[]
  subtasks: Subtask[]
  createdAt: string
  updatedAt: string
  order: number
  recurring: RecurringRule | null
}

export interface RecurringRule {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
}

export interface AppSettings {
  theme: 'dark' | 'light' | 'system'
  compactMode: boolean
  showCompleted: boolean
}

export interface AppData {
  version: 1
  projects: Project[]
  tasks: Task[]
  settings: AppSettings
  exportedAt: string
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  urgent: 'Acil',
}

export const PROJECT_COLORS = [
  '#3ecf8e',
  '#5b8def',
  '#f0a05a',
  '#e86a6a',
  '#c084fc',
  '#22d3ee',
  '#f472b6',
  '#a3e635',
] as const

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  compactMode: false,
  showCompleted: true,
}
