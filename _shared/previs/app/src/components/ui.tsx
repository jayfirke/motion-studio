import * as RT from '@radix-ui/react-tooltip'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../lib/util'

/** Every control explains itself: a title, one plain sentence, and its shortcut. */
export function Tip({ title, desc, keys, side = 'top', children, disabled }: { title: string; desc?: string; keys?: string[]; side?: 'top' | 'bottom' | 'left' | 'right'; children: ReactNode; disabled?: boolean }) {
  if (disabled) return <>{children}</>
  return (
    <RT.Root>
      <RT.Trigger asChild>{children}</RT.Trigger>
      <RT.Portal>
        <RT.Content side={side} sideOffset={8} collisionPadding={10} className="tip">
          <b>{title}</b>
          {desc && <span>{desc}</span>}
          {keys && keys.length > 0 && <span className="mt-1.5 flex flex-wrap items-center gap-1">{keys.map(k => <kbd key={k} className="kbd">{k}</kbd>)}</span>}
          <RT.Arrow style={{ fill: 'var(--tip-bg)' }} />
        </RT.Content>
      </RT.Portal>
    </RT.Root>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { tip?: string; tipDesc?: string; keys?: string[]; tipSide?: 'top' | 'bottom' | 'left' | 'right'; variant?: 'default' | 'primary' | 'go' | 'ghost' | 'ember'; size?: 'md' | 'sm' }
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(function Btn({ tip, tipDesc, keys, tipSide, variant = 'default', size = 'md', className, children, ...rest }, ref) {
  const b = <button ref={ref} type="button" className={cx('btn', variant !== 'default' && `btn-${variant}`, size === 'sm' && 'btn-sm', className)} {...rest}>{children}</button>
  return tip ? <Tip title={tip} desc={tipDesc} keys={keys} side={tipSide}>{b}</Tip> : b
})

type IconProps = ButtonHTMLAttributes<HTMLButtonElement> & { label: string; desc?: string; keys?: string[]; on?: boolean; small?: boolean; tipSide?: 'top' | 'bottom' | 'left' | 'right' }
export const IconBtn = forwardRef<HTMLButtonElement, IconProps>(function IconBtn({ label, desc, keys, on, small, tipSide, className, children, ...rest }, ref) {
  return (
    <Tip title={label} desc={desc} keys={keys} side={tipSide}>
      <button ref={ref} type="button" aria-label={label} aria-pressed={on === undefined ? undefined : on} data-on={on ? 'true' : undefined} className={cx('icon-btn', small && 'icon-btn-sm', className)} {...rest}>{children}</button>
    </Tip>
  )
})

export function Kbd({ children }: { children: ReactNode }) { return <kbd className="kbd">{children}</kbd> }

export function Empty({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      {icon && <div className="text-dim">{icon}</div>}
      <b className="text-[14px]">{title}</b>
      {children && <p className="max-w-[34ch] text-[13px] text-muted">{children}</p>}
    </div>
  )
}
