import {
  Calendar,
  Check,
  Flag,
  Folder,
  GripVertical,
  Hash,
  ListTodo,
} from 'lucide-react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useMemo, useState, type FormEvent } from 'react'
import type { Task } from '../types'
import { PRIORITY_LABELS } from '../types'
import { useTodo } from '../store/TodoContext'
import {
  filterTasksByView,
  formatDueDate,
  getViewTitle,
  groupUpcoming,
  isOverdue,
} from '../utils/dates'

export function QuickAdd() {
  const { addTask, view, setSelectedTaskId } = useTodo()
  const [value, setValue] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const title = value.trim()
    if (!title) return
    await addTask(title)
    setValue('')
  }

  const saveAndClose = async () => {
    const title = value.trim()
    if (title) {
      await addTask(title)
      setValue('')
    }
    setSelectedTaskId(null)
  }

  if (view === 'completed') return null

  return (
    <form className="quick-add" onSubmit={submit}>
      <ListTodo size={18} color="var(--accent)" />
      <input
        id="quick-add-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Yeni görev ekle…"
        autoComplete="off"
      />
      <div className="hint-keys">
        <kbd className="kbd">N</kbd>
      </div>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => void saveAndClose()}
      >
        Kaydet
      </button>
      <button type="submit" className="btn btn-primary" disabled={!value.trim()}>
        Ekle
      </button>
    </form>
  )
}

function TaskRow({ task }: { task: Task }) {
  const {
    projects,
    selectedTaskId,
    setSelectedTaskId,
    toggleTask,
  } = useTodo()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const project = projects.find((p) => p.id === task.projectId)
  const overdue = isOverdue(task.dueDate, task.completed)
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const subDone = task.subtasks.filter((s) => s.completed).length

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`task-item ${selectedTaskId === task.id ? 'selected' : ''} ${
        task.completed ? 'completed' : ''
      } ${isDragging ? 'dragging' : ''}`}
    >
      <button
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Sürükle"
        tabIndex={-1}
      >
        <GripVertical size={16} />
      </button>

      <button
        className={`check ${task.completed ? 'done' : ''}`}
        onClick={() => void toggleTask(task.id)}
        aria-label={task.completed ? 'Tamamlanmadı işaretle' : 'Tamamla'}
      >
        {task.completed && <Check size={14} strokeWidth={3} />}
      </button>

      <button
        className="task-body"
        onClick={() => setSelectedTaskId(task.id)}
      >
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {task.priority !== 'medium' && (
            <span className={`chip priority-${task.priority}`}>
              <Flag size={11} />
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}
          {task.dueDate && (
            <span className={`chip ${overdue ? 'overdue' : ''}`}>
              <Calendar size={11} />
              {formatDueDate(task.dueDate)}
            </span>
          )}
          {project && (
            <span className="chip">
              <span className="dot" style={{ background: project.color, width: 6, height: 6 }} />
              {project.name}
            </span>
          )}
          {task.tags.map((tag) => (
            <span key={tag} className="chip">
              <Hash size={11} />
              {tag}
            </span>
          ))}
          {task.subtasks.length > 0 && (
            <span className="chip">
              <Folder size={11} />
              {subDone}/{task.subtasks.length}
            </span>
          )}
        </div>
      </button>
    </li>
  )
}

function SortableList({ tasks }: { tasks: Task[] }) {
  const { reorderTasks } = useTodo()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = tasks.map((t) => t.id)
    const oldIndex = ids.indexOf(String(active.id))
    const newIndex = ids.indexOf(String(over.id))
    if (oldIndex < 0 || newIndex < 0) return
    void reorderTasks(arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

export function TaskBoard() {
  const { tasks, view, settings, projects } = useTodo()

  const filtered = useMemo(
    () => filterTasksByView(tasks, view, settings.showCompleted),
    [tasks, view, settings.showCompleted],
  )

  const projectName = view.startsWith('project:')
    ? projects.find((p) => p.id === view.slice(8))?.name
    : undefined

  if (filtered.length === 0) {
    return (
      <div className="empty">
        <h3>Burada henüz bir şey yok</h3>
        <p>
          {getViewTitle(view, projectName)} görünümüne hızlı ekleme ile görev
          ekleyebilirsin.
        </p>
      </div>
    )
  }

  if (view === 'upcoming') {
    const groups = groupUpcoming(filtered)
    return (
      <div>
        {groups.map((g) => (
          <div key={g.label}>
            <div className="task-group-label">{g.label}</div>
            <SortableList tasks={g.tasks} />
          </div>
        ))}
        {groups.length === 0 && (
          <div className="empty">
            <h3>Yaklaşan görev yok</h3>
            <p>Tarih ekleyerek görevlerini planla.</p>
          </div>
        )}
      </div>
    )
  }

  return <SortableList tasks={filtered} />
}
