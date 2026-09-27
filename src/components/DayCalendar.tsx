import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  addMonths,
  subMonths,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTodo } from '../store/TodoContext'
import { taskDayKeys } from '../utils/dates'

interface DayCalendarProps {
  open: boolean
  onClose: () => void
  selectedKey: string | null
  onSelect: (dateKey: string) => void
}

export function DayCalendar({
  open,
  onClose,
  selectedKey,
  onSelect,
}: DayCalendarProps) {
  const { tasks } = useTodo()
  const [cursor, setCursor] = useState(() => {
    if (selectedKey) return parseISO(`${selectedKey}T12:00:00`)
    return new Date()
  })

  useEffect(() => {
    if (!open) return
    setCursor(
      selectedKey ? parseISO(`${selectedKey}T12:00:00`) : new Date(),
    )
  }, [open, selectedKey])

  const taskDays = useMemo(() => {
    const map = new Map<string, { total: number; open: number }>()
    for (const t of tasks) {
      for (const key of taskDayKeys(t)) {
        const cur = map.get(key) ?? { total: 0, open: 0 }
        cur.total += 1
        if (!t.completed) cur.open += 1
        map.set(key, cur)
      }
    }
    return map
  }, [tasks])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  if (!open) return null

  const selectedDate = selectedKey
    ? parseISO(`${selectedKey}T12:00:00`)
    : null

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="calendar-popover"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Takvim"
      >
        <div className="calendar-header">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCursor((d) => subMonths(d, 1))}
            aria-label="Önceki ay"
          >
            <ChevronLeft size={18} />
          </button>
          <h2>{format(cursor, 'LLLL yyyy', { locale: tr })}</h2>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCursor((d) => addMonths(d, 1))}
            aria-label="Sonraki ay"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            className="icon-btn calendar-close"
            onClick={onClose}
            aria-label="Kapat"
          >
            <X size={18} />
          </button>
        </div>

        <div className="calendar-weekdays">
          {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="calendar-grid">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd')
            const stats = taskDays.get(key)
            const inMonth = isSameMonth(day, cursor)
            const isSelected = selectedDate
              ? isSameDay(day, selectedDate)
              : false
            return (
              <button
                key={key}
                type="button"
                className={[
                  'calendar-day',
                  inMonth ? '' : 'outside',
                  isToday(day) ? 'today' : '',
                  isSelected ? 'selected' : '',
                  stats ? 'has-tasks' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  onSelect(key)
                  onClose()
                }}
              >
                <span className="calendar-day-num">{format(day, 'd')}</span>
                {stats && (
                  <span
                    className={`calendar-dot ${stats.open > 0 ? 'open' : 'done'}`}
                    title={`${stats.total} görev`}
                  />
                )}
              </button>
            )
          })}
        </div>

        <div className="calendar-footer">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              onSelect(format(new Date(), 'yyyy-MM-dd'))
              onClose()
            }}
          >
            Bugüne git
          </button>
        </div>
      </div>
    </div>
  )
}
