import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { ArrowDown, ArrowRight } from 'lucide-react';
const LedgerCanvas = lazy(() => import('./LedgerScene'));
import { EASE_OUT } from '../../lib/motion';
import { scrollToY } from '../../lib/lenis';

const CHAPTERS = [
  {
    id: 'import',
    label: 'Import',
    title: 'Drop in a statement. Keep every line.',
    body: 'CSV from any bank works. Aura reads the date format, splits debits from credits, and holds back rows it has already seen, before anything is saved.',
    facts: [
      ['Dates', 'MM/DD/YYYY detected'],
      ['Amounts', 'Debit and credit split'],
      ['Repeats', '1 row held back'],
    ],
    range: [0.16, 0.22, 0.31, 0.37],
  },
  {
    id: 'sort',
    label: 'Categorize',
    title: 'Your rules sort it, in your order.',
    body: 'Rules run by priority and file each transaction the same way every time. AI only suggests a category for what no rule catches, and never edits a record.',
    facts: [
      ['Rule 1', 'COSTCO → Groceries'],
      ['Rule 2', 'NETFLIX → Subscriptions'],
      ['No match', 'Suggested, you confirm'],
    ],
    range: [0.42, 0.48, 0.58, 0.64],
  },
  {
    id: 'ask',
    label: 'Ask',
    title: 'Ask in English. Get the receipts.',
    body: 'Your question becomes a query. The database does the arithmetic, and the answer links to the exact transactions it used.',
    facts: [
      ['Answer', '$502.80 on Groceries'],
      ['Evidence', 'Transactions #4, #5, #6'],
      ['Math', 'Exact decimals, in SQL'],
    ],
    range: [0.69, 0.75, 0.97, 1.0],
  },
] as const;

type Range = readonly [number, number, number, number];

function usePanel(progress: MotionValue<number>, r: Range) {
  const opacity = useTransform(progress, [r[0], r[1], r[2], r[3]], [0, 1, 1, 0]);
  const y = useTransform(progress, [r[0], r[1], r[2], r[3]], [28, 0, 0, -28]);
  const blur = useTransform(progress, [r[0], r[1], r[2], r[3]], [10, 0, 0, 10]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const pointerEvents = useTransform(opacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  return { opacity, y, filter, pointerEvents };
}

const Facts: React.FC<{ rows: readonly (readonly [string, string])[] }> = ({ rows }) => (
  <dl className="mt-7 border-t border-vellum/12 max-w-md">
    {rows.map(([k, v]) => (
      <div key={k} className="flex items-baseline justify-between gap-6 py-2.5 border-b border-vellum/10">
        <dt className="text-[13px] text-vellum/50">{k}</dt>
        <dd className="font-mono text-[12.5px] text-vellum/90 text-right">{v}</dd>
      </div>
    ))}
  </dl>
);

const Chapter: React.FC<{ c: (typeof CHAPTERS)[number]; index: number; progress: MotionValue<number> }> = ({
  c,
  index,
  progress,
}) => {
  const p = usePanel(progress, c.range);
  return (
    <motion.div style={p} className="[grid-area:1/1] self-center md:self-center">
      <p className="text-[13px] text-vellum/55 mb-4">
        Step {index + 1} of {CHAPTERS.length}: {c.label}
      </p>
      <h2 className="font-display text-[clamp(38px,5vw,72px)] leading-[0.98] tracking-[-0.02em] text-vellum">
        {c.title}
      </h2>
      <p className="mt-5 max-w-md text-[15.5px] leading-relaxed text-vellum/68">{c.body}</p>
      <Facts rows={c.facts} />
    </motion.div>
  );
};

const HERO_LINES = ['Every number', 'has a row', 'behind it.'];

export const StageSection: React.FC<{
  signedIn: boolean;
  onPrimary: () => void;
}> = ({ signedIn, onPrimary }) => {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  // Never leave the headline hidden if WebGL is slow, blocked or unavailable
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 2200);
    return () => window.clearTimeout(t);
  }, []);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.07, 0.14], [1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.07, 0.14], [0, 0, -40]);
  const heroBlur = useTransform(scrollYProgress, [0, 0.07, 0.14], [0, 0, 12]);
  const heroFilter = useTransform(heroBlur, (b) => `blur(${b}px)`);
  const heroEvents = useTransform(heroOpacity, (o) => (o > 0.5 ? 'auto' : 'none'));
  const hero = { opacity: heroOpacity, y: heroY, filter: heroFilter, pointerEvents: heroEvents };
  const railFill = useTransform(scrollYProgress, [0.2, 0.78], [0, 1]);

  const seeHow = () => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + (el.offsetHeight - window.innerHeight) * 0.26);
  };

  const show = ready || reduce;

  return (
    <section
      ref={ref}
      id="method"
      aria-label="How Aura turns a statement into an answer"
      className="theme-night relative bg-night text-vellum"
      style={{ height: reduce ? 'auto' : '520svh' }}
    >
      <div
        className="sticky top-0 overflow-hidden"
        style={{ height: reduce ? '100svh' : '100svh', minHeight: 560 }}
      >
        {/* The real 3D scene */}
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: show ? 1 : 0 }}
          transition={{ duration: 1.4, ease: EASE_OUT }}
        >
          <Suspense fallback={null}>
            <LedgerCanvas progress={scrollYProgress} reduced={!!reduce} onReady={() => setReady(true)} />
          </Suspense>
        </motion.div>

        {/* legibility veil, left on desktop / bottom on mobile */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_top,#0d0b09_8%,rgba(13,11,9,0.72)_38%,transparent_62%)] md:bg-[linear-gradient(to_right,#0d0b09_6%,rgba(13,11,9,0.78)_34%,transparent_62%)]"
        />

        {/* Copy */}
        <div className="relative z-10 h-full max-w-[1320px] mx-auto px-5 sm:px-8 md:px-12 grid items-end md:items-center pb-10 md:pb-0">
          <div className="grid w-full md:w-[52%] lg:w-[46%] pt-24 md:pt-0">
            {/* Hero */}
            <motion.div style={reduce ? undefined : hero} className="[grid-area:1/1] self-end md:self-center">
              <h1 className="font-display text-[clamp(52px,9.4vw,132px)] md:text-[clamp(52px,7.4vw,124px)] leading-[0.92] tracking-[-0.028em] text-vellum">
                {HERO_LINES.map((line, i) => (
                  <span key={line} className="line-mask">
                    <motion.span
                      className="block"
                      initial={reduce ? false : { y: '112%' }}
                      animate={{ y: show ? '0%' : '112%' }}
                      transition={{ duration: 1.05, ease: EASE_OUT, delay: 0.15 + i * 0.12 }}
                    >
                      {line}
                    </motion.span>
                  </span>
                ))}
              </h1>

              <motion.p
                initial={reduce ? false : { opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={show ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.65 }}
                className="mt-6 max-w-[30rem] text-[16px] md:text-[17px] leading-relaxed text-vellum/68"
              >
                Aura Finance does your budgeting math with exact decimals, then answers questions in
                plain English and cites the transactions it used.
              </motion.p>

              <motion.div
                initial={reduce ? false : { opacity: 0, y: 18, filter: 'blur(8px)' }}
                animate={show ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
                transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.8 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <button
                  onClick={onPrimary}
                  className="group flex items-center gap-3 rounded-full bg-vellum text-night pl-6 pr-2 py-2 text-[15px] font-medium hover:bg-white transition-colors active:scale-[0.97]"
                >
                  <span>{signedIn ? 'Open workspace' : 'Get started'}</span>
                  <span className="grid place-items-center w-9 h-9 rounded-full bg-night text-vellum transition-transform duration-300 group-hover:-rotate-45">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </button>
                <button
                  onClick={seeHow}
                  className="flex items-center gap-2 rounded-full px-5 py-3 text-[15px] text-vellum/85 border border-vellum/16 bg-vellum/5 backdrop-blur-md hover:bg-vellum/10 transition-colors"
                >
                  See how it works
                  <ArrowDown className="w-4 h-4" />
                </button>
              </motion.div>
            </motion.div>

            {/* Chapters (scroll-driven) */}
            {!reduce && CHAPTERS.map((c, i) => <Chapter key={c.id} c={c} index={i} progress={scrollYProgress} />)}
          </div>
        </div>

        {/* Progress rail */}
        {!reduce && (
          <div aria-hidden="true" className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 z-10 h-44 w-px bg-vellum/15">
            <motion.div className="absolute inset-x-0 top-0 h-full bg-ember origin-top" style={{ scaleY: railFill }} />
            {CHAPTERS.map((c, i) => (
              <span
                key={c.id}
                className="absolute right-4 -translate-y-1/2 text-[12px] text-vellum/50 whitespace-nowrap"
                style={{ top: `${i * 50}%` }}
              >
                {c.label}
                <span className="absolute -right-[21px] top-1/2 -translate-y-1/2 w-[9px] h-[9px] rounded-full bg-night border border-vellum/40" />
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Reduced motion: chapters become plain stacked content */}
      {reduce && (
        <div className="relative z-10 max-w-[1320px] mx-auto px-5 sm:px-8 md:px-12 py-20 grid gap-16">
          {CHAPTERS.map((c, i) => (
            <div key={c.id}>
              <p className="text-[13px] text-vellum/55 mb-3">
                Step {i + 1} of {CHAPTERS.length}: {c.label}
              </p>
              <h2 className="font-display text-5xl leading-none text-vellum">{c.title}</h2>
              <p className="mt-4 max-w-md text-vellum/68">{c.body}</p>
              <Facts rows={c.facts} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
