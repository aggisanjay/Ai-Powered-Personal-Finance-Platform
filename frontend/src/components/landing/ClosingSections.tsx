import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronDown, Send } from 'lucide-react';
import { Reveal, RiseTitle } from './reveal';
import { Mark } from '../ui/primitives';
import { EASE_OUT } from '../../lib/motion';
import { scrollToId } from '../../lib/lenis';

/* ------------------------------ Assistant demo ------------------------------ */

const QA = [
  {
    q: 'How much did I spend on groceries in October compared to last month?',
    a: 'You spent $502.80 on Groceries in Oct 2026 across 3 transactions. Compared with September ($427.70), that is $75.10 more.',
    ev: [
      ['Costco Wholesale', 'Oct 18', '-$230.15'],
      ['Whole Foods', 'Oct 11', '-$172.65'],
      ['Trader Joe\u2019s', 'Oct 4', '-$100.00'],
    ],
    t: { ms: 812, tokens: '318 + 94', cost: '$0.0003' },
  },
  {
    q: 'Which subscriptions am I paying for?',
    a: 'I found 3 monthly subscriptions totaling $64.98: Netflix Premium ($22.99), Metro Gym ($39.00) and Cloud storage ($2.99).',
    ev: [
      ['Netflix Premium', 'Oct 5', '-$22.99'],
      ['Metro Gym', 'Oct 3', '-$39.00'],
      ['Cloud storage', 'Oct 2', '-$2.99'],
    ],
    t: { ms: 704, tokens: '281 + 76', cost: '$0.0002' },
  },
  {
    q: 'What changed most from September to October?',
    a: 'Dining out fell the most, from $412.30 to $186.40, which is $225.90 less. Housing stayed flat at $2,100.00.',
    ev: [
      ['Dining, Sep total', 'Sep', '$412.30'],
      ['Dining, Oct total', 'Oct', '$186.40'],
    ],
    t: { ms: 931, tokens: '344 + 102', cost: '$0.0003' },
  },
];

export const AssistantSection: React.FC<{ onPrimary: () => void; signedIn: boolean }> = ({ onPrimary, signedIn }) => {
  const [sel, setSel] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [done, setDone] = useState(false);
  const reduce = useReducedMotion();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearInterval(timer.current);
    if (sel === null) return;
    const full = QA[sel].a;
    if (reduce) {
      setTyped(full);
      setDone(true);
      return;
    }
    setTyped('');
    setDone(false);
    let i = 0;
    const start = window.setTimeout(() => {
      timer.current = window.setInterval(() => {
        i += 2;
        setTyped(full.slice(0, i));
        if (i >= full.length) {
          window.clearInterval(timer.current);
          setDone(true);
        }
      }, 16);
    }, 380);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(timer.current);
    };
  }, [sel, reduce]);

  const cur = sel === null ? null : QA[sel];

  return (
    <section id="assistant" className="theme-night bg-night text-vellum relative">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 md:px-12 py-24 md:py-36 grid lg:grid-cols-[0.9fr_1.1fr] gap-14 lg:gap-20 items-center">
        <div>
          <RiseTitle
            lines={['Ask it like', 'you would ask', 'a person.']}
            className="font-display text-[clamp(42px,5.6vw,84px)] leading-[0.96] tracking-[-0.025em]"
          />
          <Reveal delay={0.15}>
            <p className="mt-6 max-w-md text-[16.5px] leading-relaxed text-vellum/68">
              The assistant never does the arithmetic. It works out what you asked, the database computes it,
              and every answer arrives with the transactions behind it and what it cost to produce.
            </p>
            <button
              onClick={onPrimary}
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-vellum text-night pl-6 pr-2 py-2 text-[15px] font-medium hover:bg-white transition-colors active:scale-[0.97]"
            >
              {signedIn ? 'Open workspace' : 'Get started'}
              <span className="grid place-items-center w-9 h-9 rounded-full bg-night text-vellum transition-transform duration-300 group-hover:-rotate-45">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="rounded-[28px] border border-vellum/12 bg-night-2 p-5 sm:p-6 shadow-[0_40px_90px_-40px_rgba(255,105,8,0.25)]">
            <div className="flex items-center justify-between mb-5">
              <span className="text-[13px] text-vellum/60">Sample conversation</span>
              <span className="rounded-full border border-vellum/15 px-2.5 py-1 text-[11.5px] text-vellum/55">
                Illustrative numbers
              </span>
            </div>

            <div className="min-h-[300px] flex flex-col gap-3" aria-live="polite">
              {cur === null ? (
                <p className="text-[14px] text-vellum/50 my-auto text-center py-10">Pick a question to see how it answers.</p>
              ) : (
                <>
                  <motion.div
                    key={'q' + sel}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, ease: EASE_OUT }}
                    className="self-end max-w-[85%] rounded-2xl rounded-br-md bg-vellum text-night px-4 py-2.5 text-[14px]"
                  >
                    {cur.q}
                  </motion.div>
                  <div className="self-start max-w-[92%] rounded-2xl rounded-bl-md bg-vellum/6 border border-vellum/10 px-4 py-3 text-[14.5px] leading-relaxed">
                    {typed}
                    {!done && <span className="inline-block w-[2px] h-[1em] bg-ember align-[-2px] ml-0.5" />}
                  </div>
                  <AnimatePresence>
                    {done && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: EASE_OUT }}
                        className="mt-1 space-y-3"
                      >
                        <ul className="rounded-2xl border border-vellum/10 divide-y divide-vellum/10 text-[12.5px]">
                          {cur.ev.map(([m, d, a]) => (
                            <li key={m} className="flex items-center justify-between px-4 py-2.5">
                              <span>
                                {m} <span className="text-vellum/40 ml-1.5">{d}</span>
                              </span>
                              <span className="font-mono">{a}</span>
                            </li>
                          ))}
                        </ul>
                        <dl className="grid grid-cols-4 gap-2 font-mono text-[11.5px]">
                          {[
                            ['Latency', `${cur.t.ms} ms`],
                            ['Tokens', cur.t.tokens],
                            ['Cost', cur.t.cost],
                            ['Model', 'Gemini Flash'],
                          ].map(([k, v]) => (
                            <div key={k} className="rounded-xl bg-vellum/5 px-2.5 py-2">
                              <dt className="text-vellum/45 font-sans text-[11px]">{k}</dt>
                              <dd className="mt-0.5 text-vellum/90">{v}</dd>
                            </div>
                          ))}
                        </dl>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {QA.map((x, i) => (
                <button
                  key={i}
                  onClick={() => setSel(i)}
                  aria-pressed={sel === i}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[12.5px] text-left transition-colors ${
                    sel === i
                      ? 'border-ember bg-ember/12 text-vellum'
                      : 'border-vellum/15 text-vellum/70 hover:border-vellum/35 hover:text-vellum'
                  }`}
                >
                  <Send className="w-3 h-3 shrink-0" />
                  <span className="line-clamp-1">{x.q}</span>
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

/* ------------------------------ Security ------------------------------ */

const POINTS = [
  ['No bank logins.', 'Aura works from CSV statements and receipts you upload. It never asks for online banking credentials.'],
  ['Your rows, only yours.', 'Every query is scoped to your user id at the route and ORM level.'],
  ['Hashed and signed.', 'Passwords use salted PBKDF2-HMAC-SHA256. Sessions use time-limited JWTs.'],
  ['Leave any time.', 'Export everything as CSV, or permanently delete your account and data from Settings.'],
];

export const SecuritySection: React.FC = () => {
  const [safe, setSafe] = useState(true);
  const cell = '=HYPERLINK("http://evil.example/steal","Click for refund")';
  return (
    <section id="security" className="theme-night bg-night text-vellum relative border-t border-vellum/10">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 md:px-12 py-24 md:py-32">
        <RiseTitle
          lines={['Your statements,', 'not your logins.']}
          className="font-display text-[clamp(42px,5.6vw,84px)] leading-[0.96] tracking-[-0.025em]"
        />
        <div className="mt-16 grid lg:grid-cols-2 gap-12 lg:gap-20">
          <ul className="divide-y divide-vellum/10 border-y border-vellum/10">
            {POINTS.map(([h, b], i) => (
              <Reveal key={h} delay={i * 0.06} y={16}>
                <li className="py-6 grid sm:grid-cols-[13rem_1fr] gap-2 sm:gap-8">
                  <span className="text-[16px] text-vellum">{h}</span>
                  <span className="text-[14.5px] leading-relaxed text-vellum/62">{b}</span>
                </li>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1}>
            <div className="rounded-[28px] border border-vellum/12 bg-night-2 p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-[28px] leading-none">Spreadsheet-safe exports</h3>
                  <p className="mt-2 text-[14px] text-vellum/60 max-w-sm">
                    A transaction description can hide a formula. Exports neutralize it before Excel or Sheets sees it.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={safe}
                  aria-label="Sanitize export"
                  onClick={() => setSafe((s) => !s)}
                  className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${safe ? 'bg-ember' : 'bg-vellum/20'}`}
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                    className={`absolute top-1 w-5 h-5 rounded-full bg-white ${safe ? 'right-1' : 'left-1'}`}
                  />
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-vellum/10 overflow-hidden font-mono text-[12.5px]">
                <div className="grid grid-cols-[1fr_auto] bg-vellum/5 px-4 py-2 text-vellum/45 font-sans text-[12px]">
                  <span>description</span>
                  <span>{safe ? 'safe to open' : 'will execute'}</span>
                </div>
                <div className={`px-4 py-4 break-all transition-colors duration-300 ${safe ? 'text-vellum/90' : 'text-[#ff8a7a]'}`}>
                  {safe && <span className="text-ember">&apos;</span>}
                  {cell}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

/* ------------------------------ FAQ ------------------------------ */

const FAQS = [
  ['Does Aura need my online banking login?', 'No. It works from CSV statements and receipts you upload. It never asks for or stores banking passwords.'],
  ['How does the assistant avoid made-up numbers?', 'It does no arithmetic itself. It extracts what you asked, the database computes the result with Decimal math, and the answer is shown with clickable citations to the transactions used.'],
  ['What happens to rows I have already imported?', 'Repeated rows are detected during the import preview and held back, so statements that overlap do not double count.'],
  ['How does receipt scanning work?', 'You upload an image or PDF. OCR extracts the merchant, date and total, and shows them for review. Nothing becomes a transaction until you confirm.'],
  ['Can I take my data with me?', 'Yes. Settings has a full CSV export, sanitized against spreadsheet formula injection, and a permanent account deletion.'],
  ['Is this financial advice?', 'No. Aura is an informational budgeting and analytics tool, not an investment, accounting or tax adviser.'],
];

export const FaqSection: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="theme-paper bg-[var(--s-bg)] text-[var(--s-fg)] rounded-t-[44px] relative z-10">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-8 md:px-12 py-24 md:py-32 grid lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
        <RiseTitle
          lines={['Questions,', 'answered.']}
          className="font-display text-[clamp(44px,5.4vw,80px)] leading-[0.96] tracking-[-0.025em]"
        />
        <div className="border-t border-[var(--s-line)]">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q} className="border-b border-[var(--s-line)]">
                <h3>
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-6 py-5 text-left text-[16.5px] font-medium"
                  >
                    {q}
                    <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.35, ease: EASE_OUT }}>
                      <ChevronDown className="w-5 h-5 text-[var(--s-muted)]" />
                    </motion.span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 pr-10 text-[15px] leading-relaxed text-[var(--s-muted)] max-w-xl">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------ Closing ------------------------------ */

export const ClosingCta: React.FC<{ onPrimary: () => void; signedIn: boolean }> = ({ onPrimary, signedIn }) => (
  <section className="theme-night bg-night text-vellum relative overflow-hidden -mt-10 rounded-t-[44px] z-20">
    <div
      aria-hidden="true"
      className="absolute left-1/2 -translate-x-1/2 bottom-[-40%] w-[120%] aspect-square rounded-full opacity-60 pointer-events-none"
      style={{ background: 'radial-gradient(closest-side, rgba(255,105,8,0.28), transparent 70%)' }}
    />
    <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 md:px-12 pt-32 pb-28 md:pt-44 md:pb-40 text-center">
      <RiseTitle
        lines={['See where your', 'money actually went.']}
        className="font-display text-[clamp(46px,8vw,128px)] leading-[0.92] tracking-[-0.03em]"
      />
      <Reveal delay={0.2}>
        <p className="mt-7 mx-auto max-w-md text-[17px] text-vellum/65">
          Import one statement and have a checked answer in minutes.
        </p>
        <button
          onClick={onPrimary}
          className="group mt-10 inline-flex items-center gap-4 rounded-full bg-ember text-night pl-8 pr-2.5 py-2.5 text-[17px] font-medium hover:bg-[#ff7d2a] transition-colors active:scale-[0.97]"
        >
          {signedIn ? 'Open workspace' : 'Get started'}
          <span className="grid place-items-center w-11 h-11 rounded-full bg-night text-vellum transition-transform duration-300 group-hover:-rotate-45">
            <ArrowRight className="w-5 h-5" />
          </span>
        </button>
      </Reveal>
    </div>
  </section>
);

export const LandingFooter: React.FC<{ onSignIn: () => void; signedIn: boolean }> = ({ onSignIn, signedIn }) => (
  <footer className="theme-night bg-night text-vellum border-t border-vellum/10 relative z-20">
    <div className="max-w-[1240px] mx-auto px-5 sm:px-8 md:px-12 py-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <Mark size={28} dark />
        <span className="font-display text-xl">Aura Finance</span>
      </div>
      <p className="text-[12.5px] text-vellum/50 max-w-md">
        Informational budgeting and analytics tool. Not an investment, accounting or tax adviser.
      </p>
      <nav aria-label="Footer" className="flex items-center gap-6 text-[13px] text-vellum/65">
        <button onClick={() => scrollToId('product')} className="hover:text-vellum">Product</button>
        <button onClick={() => scrollToId('security')} className="hover:text-vellum">Security</button>
        {!signedIn && <button onClick={onSignIn} className="hover:text-vellum">Sign in</button>}
      </nav>
    </div>
  </footer>
);
