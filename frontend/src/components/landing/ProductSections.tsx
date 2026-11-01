import React, { useRef, useState } from 'react';
import { Reorder, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { Check, GripVertical, X } from 'lucide-react';
import { Reveal, RiseTitle, Spot } from './reveal';

/* ------------------------------ Manifesto ------------------------------ */

const WORDS =
  'Most finance apps ask you to trust a number. Aura shows you the row it came from, and does the math with exact decimals, so cents never drift.'.split(
    ' ',
  );

const Word: React.FC<{ word: string; i: number; progress: MotionValue<number> }> = ({ word, i, progress }) => {
  const start = i / WORDS.length;
  const opacity = useTransform(progress, [start, start + 1.6 / WORDS.length], [0.16, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block mr-[0.26em]">
      {word}
    </motion.span>
  );
};

export const Manifesto: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.55'] });
  return (
    <section className="theme-night bg-night text-vellum relative">
      <div ref={ref} className="max-w-[1180px] mx-auto px-5 sm:px-8 md:px-12 py-[22vh]">
        <p className="font-display text-[clamp(34px,5.6vw,84px)] leading-[1.02] tracking-[-0.02em]">
          {reduce ? WORDS.join(' ') : WORDS.map((w, i) => <Word key={i} word={w} i={i} progress={scrollYProgress} />)}
        </p>
      </div>
    </section>
  );
};

/* ------------------------------ Product bento ------------------------------ */

const CardTitle: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div>
    <h3 className="font-display text-[30px] leading-[1.02] tracking-[-0.01em] text-[var(--s-fg)]">{title}</h3>
    <p className="mt-2.5 text-[14.5px] leading-relaxed text-[var(--s-muted)] max-w-[34rem]">{body}</p>
  </div>
);

const DecimalCard: React.FC = () => (
  <div className="p-7 sm:p-8 h-full flex flex-col justify-between gap-8">
    <CardTitle
      title="Cents don't drift."
      body="Totals, budgets and month-over-month changes use Decimal arithmetic and NUMERIC(14, 2) columns. No floating-point rounding, and trends never divide by zero."
    />
    <div className="grid sm:grid-cols-2 gap-3 font-mono text-[13px]">
      <div className="rounded-2xl border border-[var(--s-line)] bg-[var(--s-card-hi)] p-4">
        <div className="flex items-center gap-2 text-[var(--s-faint)] mb-3 font-sans text-[12.5px]">
          <X className="w-3.5 h-3.5 text-bad" /> Floating point
        </div>
        <div className="text-[var(--s-muted)]">0.1 + 0.2</div>
        <div className="mt-1 text-bad break-all">0.30000000000000004</div>
      </div>
      <div className="rounded-2xl border border-ok/30 bg-[var(--s-card-hi)] p-4">
        <div className="flex items-center gap-2 text-[var(--s-faint)] mb-3 font-sans text-[12.5px]">
          <Check className="w-3.5 h-3.5 text-ok" /> Aura, Decimal
        </div>
        <div className="text-[var(--s-muted)]">0.10 + 0.20</div>
        <div className="mt-1 text-ok">0.30</div>
      </div>
    </div>
  </div>
);

const DuplicateCard: React.FC = () => {
  const [state, setState] = useState<'open' | 'dup' | 'both'>('open');
  return (
    <div className="p-7 sm:p-8 h-full flex flex-col justify-between gap-6">
      <CardTitle title="Double charges, caught." body="Same amount, same merchant, within three days gets flagged for you to decide." />
      <div className="rounded-2xl border border-[var(--s-line)] bg-[var(--s-card-hi)] overflow-hidden text-[13px]">
        {[
          ['Metro Gym', 'Oct 3', '-$39.00'],
          ['Metro Gym', 'Oct 4', '-$39.00'],
        ].map(([m, d, a], i) => (
          <div
            key={i}
            className={`flex items-center justify-between px-4 py-3 border-b border-[var(--s-line)] last:border-0 transition-opacity ${
              state === 'dup' && i === 1 ? 'opacity-40 line-through' : ''
            }`}
          >
            <span>
              <span className="text-[var(--s-fg)] font-medium">{m}</span>
              <span className="text-[var(--s-faint)] ml-2">{d}</span>
            </span>
            <span className="font-mono">{a}</span>
          </div>
        ))}
        <div className="flex gap-2 p-3 bg-[var(--s-card)]">
          {state === 'open' ? (
            <>
              <button
                onClick={() => setState('dup')}
                className="flex-1 rounded-full bg-[var(--s-fg)] text-[var(--s-bg)] py-2 text-[12.5px] font-medium active:scale-[0.97] transition-transform"
              >
                Confirm duplicate
              </button>
              <button
                onClick={() => setState('both')}
                className="flex-1 rounded-full border border-[var(--s-line)] py-2 text-[12.5px] font-medium hover:bg-[var(--s-card-hi)] active:scale-[0.97] transition"
              >
                Distinct charges
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full px-1 py-1 text-[12.5px]">
              <span className="flex items-center gap-2 text-ok font-medium">
                <Check className="w-4 h-4" />
                {state === 'dup' ? 'Marked as a duplicate' : 'Kept both charges'}
              </span>
              <button onClick={() => setState('open')} className="text-[var(--s-muted)] underline underline-offset-2">
                Undo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SubsCard: React.FC = () => (
  <div className="p-7 h-full flex flex-col justify-between gap-6">
    <CardTitle title="Subscriptions, found." body="Weekly and monthly patterns surface on their own." />
    <ul className="text-[13px] divide-y divide-[var(--s-line)] rounded-2xl border border-[var(--s-line)] bg-[var(--s-card-hi)]">
      {[
        ['Netflix Premium', 'Monthly', '22.99'],
        ['Metro Gym', 'Monthly', '39.00'],
        ['Meal kit', 'Weekly', '54.00'],
      ].map(([n, c, a]) => (
        <li key={n} className="flex items-center justify-between px-4 py-3">
          <span className="text-[var(--s-fg)] font-medium">{n}</span>
          <span className="flex items-center gap-3">
            <span className="rounded-full border border-[var(--s-line)] px-2 py-0.5 text-[11.5px] text-[var(--s-muted)]">{c}</span>
            <span className="font-mono">${a}</span>
          </span>
        </li>
      ))}
    </ul>
  </div>
);

const RulesCard: React.FC = () => {
  const [rules, setRules] = useState([
    { id: 'a', p: 'COSTCO', c: 'Groceries' },
    { id: 'b', p: 'SHELL|CHEVRON', c: 'Transport' },
    { id: 'c', p: 'NETFLIX', c: 'Subscriptions' },
  ]);
  return (
    <div className="p-7 h-full flex flex-col justify-between gap-6">
      <CardTitle title="Rules run in your order." body="Drag to change which rule wins." />
      <Reorder.Group axis="y" values={rules} onReorder={setRules} className="space-y-2">
        {rules.map((r, i) => (
          <Reorder.Item
            key={r.id}
            value={r}
            whileDrag={{ scale: 1.03, boxShadow: '0 18px 40px -16px rgba(0,0,0,.35)' }}
            className="flex items-center gap-3 rounded-2xl border border-[var(--s-line)] bg-[var(--s-card-hi)] px-3 py-2.5 text-[13px] cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-[var(--s-faint)]" />
            <span className="grid place-items-center w-5 h-5 rounded-full bg-[var(--s-fg)] text-[var(--s-bg)] text-[11px] font-mono">{i + 1}</span>
            <span className="font-mono text-[12px] text-[var(--s-muted)] truncate">{r.p}</span>
            <span className="ml-auto text-[var(--s-fg)] font-medium">{r.c}</span>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
};

const ReceiptCard: React.FC = () => {
  const [done, setDone] = useState(false);
  return (
    <div className="p-7 h-full flex flex-col justify-between gap-6">
      <CardTitle title="Receipts, reviewed first." body="OCR reads the receipt. Nothing hits your ledger until you confirm." />
      <div className="rounded-2xl border border-[var(--s-line)] bg-[var(--s-card-hi)] p-4 text-[13px]">
        {[
          ['Merchant', 'Trader Joe\u2019s'],
          ['Date', 'Oct 21, 2026'],
          ['Total', '$100.00'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between py-1.5">
            <span className="text-[var(--s-faint)]">{k}</span>
            <span className="font-mono text-[var(--s-fg)]">{v}</span>
          </div>
        ))}
        <button
          onClick={() => setDone((d) => !d)}
          className={`mt-3 w-full rounded-full py-2 text-[12.5px] font-medium transition-all active:scale-[0.97] ${
            done ? 'bg-ok/15 text-ok' : 'bg-[var(--s-fg)] text-[var(--s-bg)]'
          }`}
        >
          {done ? 'Added to your ledger' : 'Confirm and add'}
        </button>
      </div>
    </div>
  );
};

const AuditCard: React.FC = () => (
  <div className="p-7 sm:p-8 h-full grid lg:grid-cols-[1fr_1.1fr] gap-8 items-center">
    <CardTitle
      title="Every change leaves a trace."
      body="Imports, category edits, exports and deletions are written to an audit log you can read."
    />
    <ul className="font-mono text-[12px] rounded-2xl border border-[var(--s-line)] bg-[var(--s-card-hi)] divide-y divide-[var(--s-line)]">
      {[
        ['09:14', 'import.confirm', '42 rows, 1 held back'],
        ['09:16', 'transaction.update', '#118 → Groceries'],
        ['09:21', 'export.csv', 'sanitized, 61 rows'],
      ].map(([t, a, d]) => (
        <li key={t} className="flex items-center gap-4 px-4 py-2.5">
          <span className="text-[var(--s-faint)]">{t}</span>
          <span className="text-[var(--s-accent)]">{a}</span>
          <span className="text-[var(--s-muted)] truncate">{d}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const ProductSection: React.FC = () => (
  <section id="product" className="theme-paper relative bg-[var(--s-bg)] text-[var(--s-fg)] rounded-t-[44px] -mt-10 z-10">
    <div className="max-w-[1240px] mx-auto px-5 sm:px-8 md:px-12 py-24 md:py-32">
      <RiseTitle
        lines={['Built so the math', 'can be checked.']}
        className="font-display text-[clamp(44px,6.4vw,96px)] leading-[0.95] tracking-[-0.025em]"
      />
      <Reveal delay={0.15}>
        <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-[var(--s-muted)]">
          Every feature does one job and shows its work. Try the small ones below; they behave like the real thing.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <Reveal className="lg:col-span-7"><Spot className="h-full"><DecimalCard /></Spot></Reveal>
        <Reveal delay={0.08} className="lg:col-span-5"><Spot className="h-full"><DuplicateCard /></Spot></Reveal>
        <Reveal className="lg:col-span-4"><Spot className="h-full"><SubsCard /></Spot></Reveal>
        <Reveal delay={0.08} className="lg:col-span-4"><Spot className="h-full"><RulesCard /></Spot></Reveal>
        <Reveal delay={0.16} className="lg:col-span-4"><Spot className="h-full"><ReceiptCard /></Spot></Reveal>
        <Reveal className="lg:col-span-12"><Spot><AuditCard /></Spot></Reveal>
      </div>
    </div>
  </section>
);
