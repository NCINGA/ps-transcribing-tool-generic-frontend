import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

interface SelectProps<T extends string | number> {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
  placeholder?: string
  disabled?: boolean
  fullWidth?: boolean
  small?: boolean
}

export default function Select<T extends string | number>({
  label, value, options, onChange, placeholder = 'Select an option',
  disabled = false, fullWidth = false, small = false,
}: SelectProps<T>) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef({ text: '', time: 0 })
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 280 })
  const selectedIndex = options.findIndex(option => option.value === value)
  const expanded = open && !disabled && options.length > 0

  function positionMenu() {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const width = Math.min(Math.max(rect.width, 160), window.innerWidth - 16)
    const desiredHeight = Math.min(280, options.length * 40 + 12)
    const below = window.innerHeight - rect.bottom - 16
    const above = rect.top - 16
    const upwards = below < desiredHeight && above > below
    const maxHeight = Math.max(40, Math.min(280, upwards ? above : below))
    const height = Math.min(desiredHeight, maxHeight)
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      top: upwards ? rect.top - height - 6 : rect.bottom + 6,
      width,
      maxHeight,
    })
  }

  function openMenu(index = Math.max(0, selectedIndex)) {
    positionMenu()
    searchRef.current = { text: '', time: 0 }
    setActiveIndex(index)
    setOpen(true)
  }

  function choose(index: number) {
    onChange(options[index].value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  useEffect(() => {
    if (!expanded) return
    function onPointerDown(event: PointerEvent) {
      if (!triggerRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function closeOnViewportChange(event: Event) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', closeOnViewportChange)
    window.addEventListener('scroll', closeOnViewportChange, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', closeOnViewportChange)
      window.removeEventListener('scroll', closeOnViewportChange, true)
    }
  }, [expanded])

  useEffect(() => {
    if (expanded) document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [expanded, activeIndex, id])

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Tab') {
      setOpen(false)
      return
    }
    if (event.key === 'Escape') {
      if (expanded) {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
      }
      return
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault()
      event.stopPropagation()
      let index: number
      if (event.key === 'Home') index = 0
      else if (event.key === 'End') index = options.length - 1
      else if (!expanded) index = Math.max(0, selectedIndex)
      else index = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
      if (expanded) setActiveIndex(index)
      else openMenu(index)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      event.stopPropagation()
      if (expanded) choose(activeIndex)
      else openMenu()
      return
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      event.stopPropagation()
      const now = Date.now()
      const previous = now - searchRef.current.time < 700 ? searchRef.current.text : ''
      const query = previous + event.key.toLowerCase()
      searchRef.current = { text: query, time: now }
      const start = expanded ? activeIndex + 1 : Math.max(0, selectedIndex)
      const index = options.findIndex((_, offset) =>
        options[(start + offset) % options.length].label.toLowerCase().startsWith(query),
      )
      if (index >= 0) {
        const match = (start + index) % options.length
        if (expanded) setActiveIndex(match)
        else openMenu(match)
        searchRef.current = { text: query, time: now }
      }
    }
  }

  return (
    <div className={`select-control${fullWidth ? ' select-full' : ''}${small ? ' select-small' : ''}`}>
      <button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={expanded ? `${id}-listbox` : undefined}
        aria-activedescendant={expanded ? `${id}-option-${activeIndex}` : undefined}
        className={`select-trigger${selectedIndex < 0 ? ' select-placeholder' : ''}`}
        disabled={disabled || options.length === 0}
        onClick={() => expanded ? setOpen(false) : openMenu()}
        onKeyDown={onKeyDown}
        onBlur={() => setOpen(false)}
      >
        <span>{selectedIndex >= 0 ? options[selectedIndex].label : placeholder}</span>
        <ChevronDown size={15} aria-hidden="true" className={expanded ? 'select-chevron is-open' : 'select-chevron'} />
      </button>
      {expanded && createPortal(
        <div
          ref={menuRef}
          id={`${id}-listbox`}
          role="listbox"
          aria-label={label}
          className="select-menu"
          style={position}
          onMouseDown={event => event.preventDefault()}
        >
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              className={`select-option${index === activeIndex ? ' is-active' : ''}`}
              onPointerMove={() => setActiveIndex(index)}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {option.value === value && <Check size={15} aria-hidden="true" />}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
