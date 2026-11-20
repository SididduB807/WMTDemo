import { account } from '../config/account';

export function DemoIntroduction() {
  return <section className="introduction" aria-labelledby="page-title">
    <div className="eyebrow flex items-center gap-2"><span className="tiny-line" /> A WORKSPACE FOR EXPLORATION</div>
    <h1 id="page-title">{account.headline}</h1>
    <div className="intro-bottom flex items-center justify-between gap-4"><p>{account.subtitle}</p><span className="intro-note">Traceable records. Human judgment.</span></div>
  </section>;
}
