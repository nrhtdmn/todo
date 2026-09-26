import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { AppSettings, Project, Task } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface OdakDB extends DBSchema {
  projects: {
    key: string
    value: Project
    indexes: { 'by-order': number }
  }
  tasks: {
    key: string
    value: Task
    indexes: { 'by-order': number; 'by-project': string; 'by-completed': number }
  }
  settings: {
    key: string
    value: AppSettings & { id: string }
  }
}

const DB_NAME = 'odak-todo'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<OdakDB>> | null = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OdakDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const projects = db.createObjectStore('projects', { keyPath: 'id' })
        projects.createIndex('by-order', 'order')

        const tasks = db.createObjectStore('tasks', { keyPath: 'id' })
        tasks.createIndex('by-order', 'order')
        tasks.createIndex('by-project', 'projectId')
        tasks.createIndex('by-completed', 'completed')

        db.createObjectStore('settings', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export async function loadProjects(): Promise<Project[]> {
  const db = await getDB()
  const all = await db.getAll('projects')
  return all.sort((a, b) => a.order - b.order)
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDB()
  await db.put('projects', project)
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('projects', id)
  const tasks = await db.getAllFromIndex('tasks', 'by-project', id)
  const tx = db.transaction('tasks', 'readwrite')
  await Promise.all([
    ...tasks.map((t) => tx.store.put({ ...t, projectId: null })),
    tx.done,
  ])
}

export async function loadTasks(): Promise<Task[]> {
  const db = await getDB()
  const all = await db.getAll('tasks')
  return all.sort((a, b) => a.order - b.order)
}

export async function saveTask(task: Task): Promise<void> {
  const db = await getDB()
  await db.put('tasks', task)
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tasks', id)
}

export async function saveAllTasks(tasks: Task[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('tasks', 'readwrite')
  await Promise.all([...tasks.map((t) => tx.store.put(t)), tx.done])
}

export async function loadSettings(): Promise<AppSettings> {
  const db = await getDB()
  const row = await db.get('settings', 'app')
  if (!row) return { ...DEFAULT_SETTINGS }
  const { id: _, ...settings } = row
  return { ...DEFAULT_SETTINGS, ...settings }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB()
  await db.put('settings', { id: 'app', ...settings })
}

export async function replaceAllData(
  projects: Project[],
  tasks: Task[],
  settings: AppSettings,
): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['projects', 'tasks', 'settings'], 'readwrite')
  await tx.objectStore('projects').clear()
  await tx.objectStore('tasks').clear()
  await Promise.all([
    ...projects.map((p) => tx.objectStore('projects').put(p)),
    ...tasks.map((t) => tx.objectStore('tasks').put(t)),
    tx.objectStore('settings').put({ id: 'app', ...settings }),
    tx.done,
  ])
}
