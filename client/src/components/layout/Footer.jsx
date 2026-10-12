import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';

export default function Footer() {
  return (
    <footer className="mt-24 px-4 pb-8 sm:px-6">
      <div className="glass mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 rounded-2xl px-6 py-5 text-sm text-slate-400 sm:flex-row">
        <div className="flex items-center gap-2">
          <Icon name="shield" className="h-4 w-4 text-cyber-cyan" />
          <span>
            <span className="font-display text-slate-200">CyberShield</span> · Smart Threat Detection
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/awareness" className="hover:text-cyber-cyan">Scam Awareness</Link>
          <Link to="/scan" className="hover:text-cyber-cyan">Scanner</Link>
          <span className="text-slate-500">B.Sc. CS Final Year Project · {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
