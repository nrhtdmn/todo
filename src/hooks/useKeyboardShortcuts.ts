import { useEffect } from 'react'
import { useTodo } from '../store/TodoContext'

export function useKeyboardShortcuts() {
  const { setSearchOpen, setSelectedTaskId, setView, searchOpen } = useTodo()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const typing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        return
      }

      if (e.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false)
          return
        }
        setSelectedTaskId(null)
        return
      }

      if (typing) return

      if (e.key === '/' || e.key.toLowerCase() === 'n') {
        e.preventDefault()
        const input = document.getElementById(
          'quick-add-input',
        ) as HTMLInputElement | null
        input?.focus()
        return
      }

      if (e.key === '1') setView('inbox')
      if (e.key === '2') setView('today')
      if (e.key === '3') setView('upcoming')
      if (e.key === '4') setView('completed')
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [searchOpen, setSearchOpen, setSelectedTaskId, setView])
}
