import { ArrowLeft, ArrowUpRight, MessageSquareText } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function DiscussionState({ onBack }: { onBack: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const questions = ['Where is evidence gathering still manual?', 'What do existing tools already cover?', 'Which small case would be worth testing?'];
  return <section className="discussion-state"><button onClick={onBack} className="back-button"><ArrowLeft size={15} /> Back to demo</button>
    <div className="discussion-content"><span className="discussion-icon"><MessageSquareText size={25} strokeWidth={1.5} /></span><p className="eyebrow">START WITH THE PROBLEM</p><h1 tabIndex={-1} ref={heading}>What would be most<br className="desktop-break" /> useful to solve?</h1><p className="discussion-description">These workflows are starting points for a conversation.<br />Existing internal tools may already cover all three.</p>
      <ol className="discussion-questions">{questions.map((question, index) => <li key={question}><span>0{index + 1}</span><p>{question}</p><ArrowUpRight size={17} aria-hidden="true" /></li>)}</ol>
      <p className="discussion-footnote">A small test starts with a real question and the right evidence.</p>
    </div>
  </section>;
}
