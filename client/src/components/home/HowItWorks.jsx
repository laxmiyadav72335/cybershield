import { motion } from 'framer-motion';
import Icon from '../ui/Icon';

const steps = [
  {
    icon: 'scan',
    title: '1. Paste or upload',
    text: 'Enter a link, message, IP or password, or drop a file / QR image. Files are hashed in your browser first.',
  },
  {
    icon: 'bolt',
    title: '2. Multi-source analysis',
    text: 'Our backend queries Google Safe Browsing, VirusTotal, AbuseIPDB and RDAP, and asks Gemini AI to explain.',
  },
  {
    icon: 'shield',
    title: '3. Threat score & verdict',
    text: 'Weighted signals become a 0–100 score: Safe (0–30), Suspicious (31–60) or Dangerous (61–100).',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-10" aria-labelledby="how-heading">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyber-cyan">How it works</p>
        <h2 id="how-heading" className="mt-2 font-display text-2xl font-bold sm:text-3xl">
          From input to verdict in seconds
        </h2>
      </div>
      <div className="relative grid gap-5 md:grid-cols-3">
        {/* Connector line (desktop) */}
        <div className="pointer-events-none absolute left-[16%] right-[16%] top-10 hidden h-px bg-gradient-to-r from-transparent via-cyber-cyan/40 to-transparent md:block" />
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.45 }}
            className="glass relative rounded-2xl p-6"
          >
            <div className="mb-4 grid h-10 w-10 place-items-center rounded-full bg-cyber-cyan/15 text-cyber-cyan ring-1 ring-cyber-cyan/40">
              <Icon name={s.icon} className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
