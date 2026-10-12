import { motion } from 'framer-motion';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import AnimatedShield from './AnimatedShield';
import LiveStats from './LiveStats';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export default function Hero() {
  return (
    <section className="grid items-center gap-12 pt-12 pb-8 lg:grid-cols-2 lg:pt-20">
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-7">
        <motion.span
          variants={item}
          className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-cyber-cyan"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyber-cyan opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyber-cyan" />
          </span>
          Real-time threat intelligence · Free to use
        </motion.span>

        <motion.h1
          variants={item}
          className="font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl lg:text-6xl"
        >
          Is that link, file or
          <br />
          message <span className="text-cyber-cyan text-glow">dangerous?</span>
        </motion.h1>

        <motion.p variants={item} className="max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
          CyberShield checks links, files, SMS/email messages, QR codes, IP addresses and
          passwords against 70+ antivirus engines, Google Safe Browsing and AI — then explains
          the result in plain language with a 0–100 threat score.
        </motion.p>

        <motion.div variants={item} className="flex flex-wrap items-center gap-3">
          <Button to="/scan" size="lg">
            <Icon name="scan" className="h-5 w-5" />
            Scan Now
          </Button>
          <Button to="/awareness" variant="secondary" size="lg">
            <Icon name="book" className="h-5 w-5" />
            Learn about scams
          </Button>
        </motion.div>

        <motion.div variants={item}>
          <LiveStats />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <AnimatedShield />
      </motion.div>
    </section>
  );
}
