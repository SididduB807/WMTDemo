import { FlaskConical } from 'lucide-react';
import { account } from '../config/account';

export function SimulationDisclosure() {
  return <footer className="simulation-disclosure"><span><FlaskConical size={13} />{account.disclosure}</span><span className="disclosure-note">An exploration, with human review at every handoff.</span></footer>;
}
