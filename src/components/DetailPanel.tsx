import { Check, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Priority } from '../types'
import { PRIORITY_LABELS } from '../types'
import { useTodo } from '../store/TodoContext'
import { fromDateInputValue, toDateInputValue } from '../utils/dates'

export function DetailPanel() {
  const {
    tasks,
    projects,
    selectedTaskId,
    setSelectedTaskId,
    updateTask,
    removeTask,
    addSubtask,
    toggleSubtask,
    removeSubtask,
  } = useTodo()

  const task = tasks.find((t) => t.id === selectedTaskId)
  const [tagInput, setTagInput] = useState('')
  const [subInput, setSubInput] = useState('')

  useEffect(() => {
    setTagInput('')
    setSubInput('')
  }, [selectedTaskId])

  if (!task) return null

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase()
    if (!tag || task.tags.includes(tag)) return
    void updateTask(task.id, { tags: [...task.tags, tag] })
    setTagInput('')
  }

  const saveAndClose = () => setSelectedTaskId(null)

  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <span className="field-label" style={{ padding: 0 }}>
          Görev detayı
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className="icon-btn danger"
            onClick={() => {
              if (confirm('Görev silinsin mi?')) void removeTask(task.id)
            }}
            aria-label="Sil"
          >
            <Trash2 size={18} />
          </button>
          <button
            className="icon-btn"
            onClick={saveAndClose}
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="detail-body">
        <textarea
          className="detail-title"
          rows={2}
          value={task.title}
          onChange={(e) => void updateTask(task.id, { title: e.target.value })}
        />

        <div className="field">
          <span className="field-label">Öncelik</span>
          <div className="priority-grid">
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
              <button
                key={p}
                type="button"
                data-p={p}
                className={`priority-btn ${task.priority === p ? 'active' : ''}`}
                onClick={() => void updateTask(task.id, { priority: p })}
              >
                {PRIORITY_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="due">
            Son tarih
          </label>
          <input
            id="due"
            type="date"
            value={toDateInputValue(task.dueDate)}
            onChange={(e) =>
              void updateTask(task.id, {
                dueDate: fromDateInputValue(e.target.value),
              })
            }
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="project">
            Proje
          </label>
          <select
            id="project"
            className="field-control"
            value={task.projectId ?? ''}
            onChange={(e) =>
              void updateTask(task.id, {
                projectId: e.target.value || null,
              })
            }
          >
            <option value="">Gelen Kutusu</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span className="field-label">Alt görevler</span>
          <ul className="subtask-list">
            {task.subtasks.map((s) => (
              <li
                key={s.id}
                className={`subtask-item ${s.completed ? 'done' : ''}`}
              >
                <button
                  className={`check ${s.completed ? 'done' : ''}`}
                  onClick={() => void toggleSubtask(task.id, s.id)}
                >
                  {s.completed && <Check size={12} strokeWidth={3} />}
                </button>
                <span style={{ flex: 1 }}>{s.title}</span>
                <button
                  className="icon-btn"
                  onClick={() => void removeSubtask(task.id, s.id)}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
          <div className="subtask-add">
            <input
              type="text"
              value={subInput}
              placeholder="Alt görev…"
              onChange={(e) => setSubInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (subInput.trim()) {
                    void addSubtask(task.id, subInput.trim())
                    setSubInput('')
                  }
                }
              }}
            />
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                if (subInput.trim()) {
                  void addSubtask(task.id, subInput.trim())
                  setSubInput('')
                }
              }}
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="notes">
            Notlar
          </label>
          <textarea
            id="notes"
            value={task.notes}
            placeholder="Detaylar, bağlantılar…"
            onChange={(e) => void updateTask(task.id, { notes: e.target.value })}
          />
        </div>

        <div className="field">
          <span className="field-label">Etiketler</span>
          <div className="tag-list">
            {task.tags.map((tag) => (
              <span key={tag} className="tag-chip">
                #{tag}
                <button
                  type="button"
                  aria-label={`${tag} kaldır`}
                  onClick={() =>
                    void updateTask(task.id, {
                      tags: task.tags.filter((t) => t !== tag),
                    })
                  }
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="subtask-add">
            <input
              type="text"
              value={tagInput}
              placeholder="etiket ekle"
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
            />
            <button type="button" className="btn btn-ghost" onClick={addTag}>
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="detail-footer">
        <button type="button" className="btn btn-primary btn-block" onClick={saveAndClose}>
          Kaydet
        </button>
      </div>
    </aside>
  )
}
