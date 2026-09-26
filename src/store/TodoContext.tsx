import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppSettings, Project, Task, ViewId } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import * as db from '../db'
import {
  createProject,
  createSubtask,
  createTask,
  exportData,
  parseImport,
  seedIfEmpty,
} from '../utils/taskFactory'
import { collectTags } from '../utils/dates'

interface TodoContextValue {
  ready: boolean
  projects: Project[]
  tasks: Task[]
  settings: AppSettings
  view: ViewId
  selectedTaskId: string | null
  searchOpen: boolean
  tags: string[]
  setView: (view: ViewId) => void
  setSelectedTaskId: (id: string | null) => void
  setSearchOpen: (open: boolean) => void
  addProject: (name: string, color?: string) => Promise<Project>
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>
  removeProject: (id: string) => Promise<void>
  addTask: (title: string, extras?: Partial<Task>) => Promise<Task>
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>
  toggleTask: (id: string) => Promise<void>
  removeTask: (id: string) => Promise<void>
  reorderTasks: (orderedIds: string[]) => Promise<void>
  addSubtask: (taskId: string, title: string) => Promise<void>
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>
  removeSubtask: (taskId: string, subtaskId: string) => Promise<void>
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  downloadExport: () => void
  importFromFile: (file: File) => Promise<void>
  clearCompleted: () => Promise<void>
}

const TodoContext = createContext<TodoContextValue | null>(null)

export function TodoProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [view, setView] = useState<ViewId>('today')
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    seedIfEmpty().then(({ projects, tasks, settings }) => {
      setProjects(projects)
      setTasks(tasks)
      setSettings(settings)
      setReady(true)
    })
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const apply = (theme: AppSettings['theme']) => {
      let resolved = theme
      if (theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: light)').matches
          ? 'light'
          : 'dark'
      }
      root.dataset.theme = resolved
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) {
        meta.setAttribute(
          'content',
          resolved === 'light' ? '#f4f7f5' : '#0b1210',
        )
      }
    }
    apply(settings.theme)
    if (settings.theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const listener = () => apply('system')
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [settings.theme])

  const tags = useMemo(() => collectTags(tasks), [tasks])

  const addProject = useCallback(async (name: string, color?: string) => {
    const project = createProject(name, projects.length, color)
    await db.saveProject(project)
    setProjects((prev) => [...prev, project])
    return project
  }, [projects.length])

  const updateProject = useCallback(async (id: string, patch: Partial<Project>) => {
    const current = projects.find((p) => p.id === id)
    if (!current) return
    const next = { ...current, ...patch }
    await db.saveProject(next)
    setProjects((prev) => prev.map((p) => (p.id === id ? next : p)))
  }, [projects])

  const removeProject = useCallback(async (id: string) => {
    await db.deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    setTasks((prev) =>
      prev.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)),
    )
    if (view === `project:${id}`) setView('inbox')
  }, [view])

  const addTask = useCallback(
    async (title: string, extras?: Partial<Task>) => {
      const projectId =
        extras?.projectId !== undefined
          ? extras.projectId
          : view.startsWith('project:')
            ? view.slice('project:'.length)
            : null
      const tagsFromView =
        view.startsWith('tag:') ? [view.slice('tag:'.length)] : []
      const task = createTask({
        title,
        projectId,
        tags: extras?.tags ?? tagsFromView,
        ...extras,
        order: Date.now(),
      })
      await db.saveTask(task)
      setTasks((prev) => [...prev, task])
      setSelectedTaskId(task.id)
      return task
    },
    [view],
  )

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    setTasks((prev) => {
      const current = prev.find((t) => t.id === id)
      if (!current) return prev
      const next = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString(),
      }
      void db.saveTask(next)
      return prev.map((t) => (t.id === id ? next : t))
    })
  }, [])

  const toggleTask = useCallback(async (id: string) => {
    setTasks((prev) => {
      const current = prev.find((t) => t.id === id)
      if (!current) return prev
      const next = {
        ...current,
        completed: !current.completed,
        updatedAt: new Date().toISOString(),
      }
      void db.saveTask(next)
      return prev.map((t) => (t.id === id ? next : t))
    })
  }, [])

  const removeTask = useCallback(async (id: string) => {
    await db.deleteTask(id)
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setSelectedTaskId((cur) => (cur === id ? null : cur))
  }, [])

  const reorderTasks = useCallback(async (orderedIds: string[]) => {
    setTasks((prev) => {
      const map = new Map(prev.map((t) => [t.id, t]))
      const updated: Task[] = []
      orderedIds.forEach((id, index) => {
        const task = map.get(id)
        if (task) {
          const next = { ...task, order: index + 1 }
          updated.push(next)
          map.delete(id)
        }
      })
      const rest = [...map.values()]
      const all = [...updated, ...rest]
      void db.saveAllTasks(updated)
      return all
    })
  }, [])

  const addSubtask = useCallback(async (taskId: string, title: string) => {
    setTasks((prev) => {
      const current = prev.find((t) => t.id === taskId)
      if (!current) return prev
      const next = {
        ...current,
        subtasks: [...current.subtasks, createSubtask(title)],
        updatedAt: new Date().toISOString(),
      }
      void db.saveTask(next)
      return prev.map((t) => (t.id === taskId ? next : t))
    })
  }, [])

  const toggleSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    setTasks((prev) => {
      const current = prev.find((t) => t.id === taskId)
      if (!current) return prev
      const next = {
        ...current,
        subtasks: current.subtasks.map((s) =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s,
        ),
        updatedAt: new Date().toISOString(),
      }
      void db.saveTask(next)
      return prev.map((t) => (t.id === taskId ? next : t))
    })
  }, [])

  const removeSubtask = useCallback(async (taskId: string, subtaskId: string) => {
    setTasks((prev) => {
      const current = prev.find((t) => t.id === taskId)
      if (!current) return prev
      const next = {
        ...current,
        subtasks: current.subtasks.filter((s) => s.id !== subtaskId),
        updatedAt: new Date().toISOString(),
      }
      void db.saveTask(next)
      return prev.map((t) => (t.id === taskId ? next : t))
    })
  }, [])

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      void db.saveSettings(next)
      return next
    })
  }, [])

  const downloadExport = useCallback(() => {
    const data = exportData(projects, tasks, settings)
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `odak-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [projects, tasks, settings])

  const importFromFile = useCallback(async (file: File) => {
    const text = await file.text()
    const parsed = parseImport(JSON.parse(text))
    await db.replaceAllData(parsed.projects, parsed.tasks, parsed.settings)
    setProjects(parsed.projects)
    setTasks(parsed.tasks)
    setSettings(parsed.settings)
    setSelectedTaskId(null)
    setView('today')
  }, [])

  const clearCompleted = useCallback(async () => {
    const completed = tasks.filter((t) => t.completed)
    await Promise.all(completed.map((t) => db.deleteTask(t.id)))
    setTasks((prev) => prev.filter((t) => !t.completed))
    setSelectedTaskId((cur) =>
      cur && completed.some((t) => t.id === cur) ? null : cur,
    )
  }, [tasks])

  const value: TodoContextValue = {
    ready,
    projects,
    tasks,
    settings,
    view,
    selectedTaskId,
    searchOpen,
    tags,
    setView,
    setSelectedTaskId,
    setSearchOpen,
    addProject,
    updateProject,
    removeProject,
    addTask,
    updateTask,
    toggleTask,
    removeTask,
    reorderTasks,
    addSubtask,
    toggleSubtask,
    removeSubtask,
    updateSettings,
    downloadExport,
    importFromFile,
    clearCompleted,
  }

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>
}

export function useTodo() {
  const ctx = useContext(TodoContext)
  if (!ctx) throw new Error('useTodo must be used within TodoProvider')
  return ctx
}
