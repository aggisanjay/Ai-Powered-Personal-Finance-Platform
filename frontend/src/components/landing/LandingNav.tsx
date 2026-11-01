import React, { useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Mark } from '../ui/primitives';
import { scrollToId } from '../../lib/lenis';
import { EASE_OUT } from '../../lib/motion';

const LINKS = [
  { id: 'method', label: 'Method' },
  { id: 'product', label: 'Product' },
  { id: 'assistant', label: 'Assistant' },
  { id: 'security', label: 'Security' },
  { id: 'faq', label: 'FAQ' },
];

export const LandingNav: React.FC<{
  signedIn: boolean;
  onPrimary: () => void;
  onSignIn: () => void;
}> = ({ signedIn, onPrimary, onSignIn }) => {
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 160 && !open);
  });

  const go = (id: string) => {
    setOpen(false);
    scrollToId(id);
  };

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: hidden ? -90 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: hidden ? 0 : 0.1 }}
      className="fixed top-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-[920px]">
        <nav
          aria-label="Primary"
          className="flex items-center justify-between gap-3 rounded-full border border-vellum/12 bg-night/60 backdrop-blur-xl pl-3 pr-2 py-2 shadow-[0_10px_40px_-16px_rgba(0,0,0,0.8)]"
        >
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 pl-1 pr-2" aria-label="Aura Finance, back to top">
            <Mark size={28} dark />
            <span className="font-display text-[22px] leading-none text-vellum tracking-tight">Aura</span>
          </button>

          <ul className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => go(l.id)}
                  className="px-3.5 py-2 rounded-full text-[13px] text-vellum/70 hover:text-vellum hover:bg-vellum/8 transition-colors"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            {!signedIn && (
              <button
                onClick={onSignIn}
                className="hidden sm:block px-3.5 py-2 rounded-full text-[13px] text-vellum/80 hover:text-vellum transition-colors"
              >
                Sign in
              </button>
            )}
            <button
              onClick={onPrimary}
              className="group flex items-center gap-2 rounded-full bg-vellum text-night pl-4 pr-1.5 py-1.5 text-[13px] font-medium hover:bg-white transition-colors active:scale-[0.97]"
            >
              <span>{signedIn ? 'Open workspace' : 'Get started'}</span>
              <span className="grid place-items-center w-6 h-6 rounded-full bg-night text-vellum transition-transform duration-300 group-hover:-rotate-45">
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </button>
            <button
              onClick={() => setOpen((o) => !o)}
              className="md:hidden grid place-items-center w-9 h-9 rounded-full text-vellum hover:bg-vellum/10"
              aria-expanded={open}
              aria-label={open ? 'Close menu' : 'Open menu'}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
              className="md:hidden mt-2 rounded-3xl border border-vellum/12 bg-night/90 backdrop-blur-xl p-2"
            >
              {LINKS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => go(l.id)}
                  className="w-full text-left px-4 py-3 rounded-2xl text-vellum/85 hover:bg-vellum/8 text-[15px]"
                >
                  {l.label}
                </button>
              ))}
              {!signedIn && (
                <button
                  onClick={() => {
                    setOpen(false);
                    onSignIn();
                  }}
                  className="w-full text-left px-4 py-3 rounded-2xl text-vellum/85 hover:bg-vellum/8 text-[15px]"
                >
                  Sign in
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};
