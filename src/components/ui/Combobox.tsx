import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: React.ReactNode
}

export default function Combobox({ options, value, onChange, placeholder = 'Search...', icon }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel = options.find(o => o.value === value)?.label || ''

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg border bg-white cursor-pointer',
          'focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500',
          open ? 'border-primary-500 ring-2 ring-primary-500' : 'border-gray-300'
        )}
        onClick={() => {
          setOpen(true)
          setTimeout(() => inputRef.current?.focus(), 0)
        }}
      >
        {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 bg-transparent outline-none placeholder-gray-400 min-w-0"
          placeholder={open ? 'Type to search...' : (selectedLabel || placeholder)}
          value={open ? query : selectedLabel}
          onChange={e => {
            setQuery(e.target.value)
            if (!open) setOpen(true)
          }}
          onFocus={() => setOpen(true)}
        />
        <ChevronDown className={cn('w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform', open && 'rotate-180')} />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-400">No results</div>
          ) : (
            filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-primary-50 transition-colors',
                  opt.value === value && 'bg-primary-50 text-primary-700 font-medium'
                )}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                  setQuery('')
                }}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
