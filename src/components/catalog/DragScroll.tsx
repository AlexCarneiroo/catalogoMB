import { useRef, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/utils/format'

export function DragScroll({ children, className, axis = 'x' }: { children: ReactNode; className?: string; axis?: 'x' | 'y' }) {
  const scroller = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, start: 0, scroll: 0, moved: false })

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'touch' || !scroller.current) return
    if (event.target instanceof Element && event.target.closest('a, button, input, textarea, select, label')) return
    event.preventDefault()
    event.stopPropagation()
    drag.current = {
      active: true,
      start: axis === 'y' ? event.clientY : event.clientX,
      scroll: axis === 'y' ? scroller.current.scrollTop : scroller.current.scrollLeft,
      moved: false,
    }
    scroller.current.setPointerCapture(event.pointerId)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current.active || !scroller.current) return
    const point = axis === 'y' ? event.clientY : event.clientX
    const distance = point - drag.current.start
    if (Math.abs(distance) > 5) drag.current.moved = true
    if (axis === 'y') scroller.current.scrollTop = drag.current.scroll - distance
    else scroller.current.scrollLeft = drag.current.scroll - distance
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current.active) return
    drag.current.active = false
    if (scroller.current?.hasPointerCapture(event.pointerId)) scroller.current.releasePointerCapture(event.pointerId)
    if (!drag.current.moved || !scroller.current) return
    const blockClick = (click: Event) => {
      click.preventDefault()
      click.stopPropagation()
      scroller.current?.removeEventListener('click', blockClick, true)
    }
    scroller.current.addEventListener('click', blockClick, true)
  }

  return (
    <div
      ref={scroller}
      className={cn(
        'drag-scroll cursor-grab select-none active:cursor-grabbing',
        axis === 'y' ? 'touch-pan-y overflow-y-auto overscroll-contain' : 'overflow-x-auto overscroll-x-contain',
        className,
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {children}
    </div>
  )
}
