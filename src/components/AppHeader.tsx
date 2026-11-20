import { ArrowUpRight, PanelsTopLeft } from 'lucide-react';
import type { RefObject } from 'react';

export function AppHeader({ onDiscuss, discussRef }: { onDiscuss: () => void; discussRef: RefObject<HTMLButtonElement | null> }) {
  return <header className="app-header flex items-center justify-between">
    <div className="brand flex items-center gap-3"><span className="brand-mark"><PanelsTopLeft size={17} strokeWidth={1.7} /></span><span>Retail operations<span className="brand-divider" />Lab</span></div>
    <button ref={discussRef} className="discuss-button flex items-center gap-2" onClick={onDiscuss}>Let’s discuss <ArrowUpRight size={15} /></button>
  </header>;
}
