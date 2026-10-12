import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { QUIZ } from '../../config/quiz';
import GlassCard from '../ui/GlassCard';
import Button from '../ui/Button';
import Icon from '../ui/Icon';

const STORAGE_KEY = 'cybershield:quizBest';

/**
 * 10-question multiple-choice quiz with instant feedback and a final score.
 * Best score is remembered in localStorage (per-browser convenience only).
 */
export default function Quiz() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState(() => {
    try { return Number(localStorage.getItem(STORAGE_KEY)) || 0; } catch { return 0; }
  });

  const total = QUIZ.length;
  const current = QUIZ[index];
  const correct = picked != null && picked === current?.answer;

  const choose = (i) => {
    if (picked != null) return;
    setPicked(i);
    if (i === current.answer) setScore((s) => s + 1);
  };
  const finish = () => {
    if (score > best) {
      setBest(score);
      try { localStorage.setItem(STORAGE_KEY, String(score)); } catch { /* ignore */ }
    }
    setFinished(true);
  };
  const next = () => {
    if (index + 1 >= total) return finish();
    setIndex((i) => i + 1);
    setPicked(null);
  };
  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? { label: 'Scam-proof!', color: '#22C55E', text: 'Excellent. You spot the tricks scammers rely on.' }
      : pct >= 60 ? { label: 'Alert citizen', color: '#22D3EE', text: 'Good instincts — review the ones you missed above.' }
        : { label: 'Easy target', color: '#EF4444', text: 'Scammers would love you. Read the scam cards again and retake the quiz.' };
    return (
      <GlassCard glow className="p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full ring-4" style={{ color: grade.color, '--tw-ring-color': `${grade.color}66`, background: `${grade.color}1A` }}>
            <span className="font-display text-3xl font-bold">{score}/{total}</span>
          </div>
          <h3 className="mt-5 font-display text-2xl font-bold" style={{ color: grade.color }}>{grade.label}</h3>
          <p className="mt-2 text-sm text-slate-300">{grade.text}</p>
          <p className="mt-1 text-xs text-slate-500">Score {pct}% · Best {Math.max(best, score)}/{total}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={restart}><Icon name="bolt" className="h-4 w-4" /> Try again</Button>
            <Button to="/scan" variant="secondary"><Icon name="scan" className="h-4 w-4" /> Scan something</Button>
          </div>
        </motion.div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 sm:p-8">
      {/* Progress */}
      <div className="mb-5 flex items-center justify-between text-xs text-slate-400">
        <span>Question {index + 1} of {total}</span>
        <span>Score {score}{best ? ` · Best ${best}` : ''}</span>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={total}>
        <motion.div className="h-full rounded-full bg-cyber-cyan" animate={{ width: `${((index + (picked != null ? 1 : 0)) / total) * 100}%` }} transition={{ duration: 0.4 }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
          <h3 className="text-lg font-semibold leading-snug text-white">{current.q}</h3>
          <ul className="mt-5 space-y-2.5" role="listbox" aria-label="Answer options">
            {current.options.map((opt, i) => {
              const isAnswer = i === current.answer;
              const isPicked = i === picked;
              let cls = 'border-white/10 bg-bg-900/40 hover:border-cyber-cyan/50';
              if (picked != null) {
                if (isAnswer) cls = 'border-safe bg-safe/10';
                else if (isPicked) cls = 'border-danger bg-danger/10';
                else cls = 'border-white/5 opacity-60';
              }
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => choose(i)}
                    disabled={picked != null}
                    role="option"
                    aria-selected={isPicked}
                    className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm text-slate-200 transition-colors ${cls}`}
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 text-[11px] font-semibold text-slate-400">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {picked != null && isAnswer && <Icon name="check" className="h-5 w-5 text-safe" strokeWidth={2.5} />}
                    {picked != null && isPicked && !isAnswer && <Icon name="close" className="h-5 w-5 text-danger" strokeWidth={2.5} />}
                  </button>
                </li>
              );
            })}
          </ul>

          <AnimatePresence>
            {picked != null && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-5 rounded-xl border p-4 text-sm ${correct ? 'border-safe/40 bg-safe/10' : 'border-danger/40 bg-danger/10'}`}
                role="status"
              >
                <p className={`font-semibold ${correct ? 'text-safe' : 'text-danger'}`}>{correct ? 'Correct!' : 'Not quite.'}</p>
                <p className="mt-1 text-slate-300">{current.why}</p>
                <div className="mt-3">
                  <Button size="sm" onClick={next}>
                    {index + 1 >= total ? 'See my score' : 'Next question'}
                    <Icon name="arrow" className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  );
}
