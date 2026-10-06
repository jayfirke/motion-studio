import { useEffect } from 'react'
import { useStudio } from '../state/store'

/** The theme actually shown: the reviewer's setting, else the claude.ai viewer's theme, else the OS. */
export function effectiveTheme(pref: 'system' | 'light' | 'dark'): 'light' | 'dark' {
  if (pref !== 'system') return pref
  const host = document.documentElement.getAttribute('data-theme')
  if (host === 'light' || host === 'dark') return host
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** Keeps <html data-studio-theme> in step with the setting, the viewer's theme switch and the OS. */
export function useThemeSync() {
  const pref = useStudio(s => s.prefs.theme)
  useEffect(() => {
    const apply = () => { document.documentElement.setAttribute('data-studio-theme', effectiveTheme(pref)) }
    apply()
    const mq = matchMedia('(prefers-color-scheme: light)')
    mq.addEventListener('change', apply)
    const mo = new MutationObserver(apply)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => { mq.removeEventListener('change', apply); mo.disconnect() }
  }, [pref])
}
