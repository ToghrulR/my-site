import { useCallback, useEffect, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { HolderOutlined, PushpinFilled, PushpinOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'

export type DockPosition = 'left' | 'right' | 'top' | 'bottom'

const STORAGE_KEY = 'finsoft.navigation-dock'

interface StoredDock {
  dock: DockPosition
  pinned: boolean
}

const docks: DockPosition[] = ['left', 'right', 'top', 'bottom']

const dockLabels: Record<DockPosition, string> = {
  left: 'Sol',
  right: 'Sağ',
  top: 'Yuxarı',
  bottom: 'Aşağı',
}

function readStored(): StoredDock {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<StoredDock>
    return {
      dock: value.dock && docks.includes(value.dock) ? value.dock : 'left',
      pinned: typeof value.pinned === 'boolean' ? value.pinned : true,
    }
  } catch {
    return { dock: 'left', pinned: true }
  }
}

function nearestDock(x: number, y: number): DockPosition {
  const distances: Record<DockPosition, number> = {
    left: x / window.innerWidth,
    right: 1 - x / window.innerWidth,
    top: y / window.innerHeight,
    bottom: 1 - y / window.innerHeight,
  }
  return docks.reduce((best, key) => (distances[key] < distances[best] ? key : best), 'left' as DockPosition)
}

const arrowDocks: Record<string, DockPosition> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'top',
  ArrowDown: 'bottom',
}

export function useNavigationDock() {
  const [stored, setStored] = useState<StoredDock>(readStored)
  const [hovered, setHovered] = useState(false)
  const [dragTarget, setDragTarget] = useState<DockPosition | null>(null)
  const dragging = dragTarget !== null

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  }, [stored])

  const setDock = useCallback((dock: DockPosition) => setStored((value) => ({ ...value, dock })), [])
  const togglePinned = useCallback(() => setStored((value) => ({ ...value, pinned: !value.pinned })), [])

  useEffect(() => {
    if (!dragging) return
    const move = (event: globalThis.PointerEvent) => setDragTarget(nearestDock(event.clientX, event.clientY))
    const drop = (event: globalThis.PointerEvent) => {
      setDock(nearestDock(event.clientX, event.clientY))
      setDragTarget(null)
    }
    const abort = () => setDragTarget(null)
    const cancel = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') abort() }
    document.body.classList.add('is-dragging-dock')
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', drop)
    window.addEventListener('pointercancel', abort)
    window.addEventListener('keydown', cancel)
    return () => {
      document.body.classList.remove('is-dragging-dock')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', drop)
      window.removeEventListener('pointercancel', abort)
      window.removeEventListener('keydown', cancel)
    }
  }, [dragging, setDock])

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    setHovered(false)
    setDragTarget(stored.dock)
  }

  const moveWithKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    const target = arrowDocks[event.key]
    if (!target) return
    event.preventDefault()
    setDock(target)
  }

  return {
    dock: stored.dock,
    pinned: stored.pinned,
    expanded: stored.pinned || (hovered && !dragging),
    dragTarget,
    togglePinned,
    hoverProps: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      onFocusCapture: () => setHovered(true),
      onBlurCapture: () => setHovered(false),
    },
    gripProps: { onPointerDown: startDrag, onKeyDown: moveWithKeyboard },
  }
}

type DockControl = ReturnType<typeof useNavigationDock>

export function DockGrip({ gripProps }: Pick<DockControl, 'gripProps'>) {
  return (
    <Tooltip title="Tutub istənilən kənara sürüşdürün">
      <Button
        type="text"
        size="small"
        className="dock-grip"
        icon={<HolderOutlined rotate={90} />}
        aria-label="Menyunun yerini dəyiş. Sürüşdürün və ya istiqamət düymələrindən istifadə edin"
        {...gripProps}
      />
    </Tooltip>
  )
}

export function DockPin({ pinned, togglePinned }: Pick<DockControl, 'pinned' | 'togglePinned'>) {
  const label = pinned ? 'Menyunu sabitləməni ləğv et' : 'Menyunu sabitlə'
  return (
    <Tooltip title={label}>
      <Button
        type="text"
        className="dock-pin"
        icon={pinned ? <PushpinFilled /> : <PushpinOutlined />}
        aria-label={label}
        aria-pressed={pinned}
        onClick={togglePinned}
      />
    </Tooltip>
  )
}

export function DockDropZones({ target }: { target: DockPosition | null }) {
  if (!target) return null
  return (
    <div className="dock-zones" aria-hidden="true">
      {docks.map((key) => (
        <div key={key} className={`dock-zone dock-zone--${key}${key === target ? ' is-active' : ''}`}>
          {key === target && <span>{dockLabels[key]}</span>}
        </div>
      ))}
    </div>
  )
}
