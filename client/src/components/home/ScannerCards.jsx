import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SCANNERS } from '../../config/scanners';
import TiltCard from '../ui/TiltCard';
import Icon from '../ui/Icon';

/** Six floating scanner cards with 3D tilt. Each links to /scan/:type. */
export default function ScannerCards() {
  return (
    <section className="py-14" aria-labelledby="scanners-heading">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyber-cyan">Choose a scanner</p>
        <h2 id="scanners-heading" className="mt-2 font-display text-2xl font-bold sm:text-3xl">
          Six ways to stay safe
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {SCANNERS.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
          >
            <TiltCard className="group h-full">
              <Link
                to={`/scan/${s.id}`}
                className="glass relative block h-full overflow-hidden rounded-2xl p-6 transition-colors duration-300 hover:border-cyber-cyan/50"
              >
                <span className="scanline top-0 opacity-0 transition-opacity group-hover:opacity-100" />
                <div
                  className="mb-5 grid h-12 w-12 place-items-center rounded-xl ring-1"
                  style={{
                    color: s.accent,
                    background: `${s.accent}1A`,
                    boxShadow: `0 0 24px ${s.accent}33`,
                    '--tw-ring-color': `${s.accent}55`,
                  }}
                >
                  <Icon name={s.icon} className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider" style={{ color: s.accent }}>
                  {s.tagline}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{s.description}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-cyber-cyan">
                  Open scanner
                  <Icon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
