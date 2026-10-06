import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

/** Keeps one broken view from taking the whole studio down. */
export class Boundary extends Component<{ children: ReactNode; label: string }, { err: Error | null }> {
  state = { err: null as Error | null }
  static getDerivedStateFromError(err: Error) { return { err } }
  componentDidCatch(err: Error) { console.error(`[${this.props.label}]`, err) }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="card max-w-[460px] p-5">
          <div className="flex items-center gap-2 text-amber"><AlertTriangle size={18} /><b className="text-[16px] text-fg">The {this.props.label} hit a problem</b></div>
          <p className="mt-1.5 text-[13.5px] text-muted">Your picks and comments are safe. Try again; if it keeps happening, tell Claude what you clicked just before.</p>
          <p className="mono mt-2 break-words text-[12px] text-dim">{String(this.state.err.message).slice(0, 220)}</p>
          <button type="button" className="btn btn-sm mt-4" onClick={() => this.setState({ err: null })}><RotateCcw size={14} />Try again</button>
        </div>
      </div>
    )
  }
}
