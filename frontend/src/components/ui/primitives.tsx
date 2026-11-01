import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE_OUT, useCountUp } from '../../lib/motion';

/** Aura mark: three offset plates, the same object as the 3D scene. */
export const Mark: React.FC<{ size?: number; dark?: boolean; className?: string }> = ({
  size = 32,
  dark = false,
  className,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect width="32" height="32" rx="9" fill={dark ? '#F4EDE0' : '#0D0B09'} />
    <g transform="translate(16 16)">
      <path d="M-8 3.2 0 7.4l8-4.2L0-1z" fill={dark ? '#0D0B09' : '#F4EDE0'} opacity=".35" />
      <path d="M-8-0.6 0 3.6l8-4.2L0-4.8z" fill={dark ? '#0D0B09' : '#F4EDE0'} opacity=".65" />
      <path d="M-8-4.4 0-.2l8-4.2L0-8.6z" fill="#FF6908" />
    </g>
  </svg>
);

export const PageHeader: React.FC<{
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}> = ({ title, description, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
    <div className="min-w-0">
      <h1 className="font-display text-[34px] sm:text-[40px] leading-[1.02] tracking-[-0.01em] text-ink">
        {title}
      </h1>
      {description && <p className="text-sm text-muted mt-2 max-w-xl leading-relaxed">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2.5 flex-wrap">{actions}</div>}
  </div>
);

/** Staggered entrance for a group of blocks on a page. */
export const Stagger: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className,
  delay = 0,
}) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : 'hidden'}
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
};

export const Item: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 14 },
      show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT } },
    }}
  >
    {children}
  </motion.div>
);

export const CountUp: React.FC<{
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}> = ({ value, decimals = 2, prefix = '', suffix = '', className }) => {
  const { ref, text } = useCountUp(value, { decimals });
  return (
    <span ref={ref} className={`num ${className ?? ''}`}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-6 w-full' }) => (
  <div className={`skeleton ${className}`} aria-hidden="true" />
);

export const Segmented: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}> = ({ value, onChange, options, label }) => (
  <div
    role="radiogroup"
    aria-label={label}
    className="relative inline-flex p-1 rounded-full bg-sand border border-line"
  >
    {options.map((o) => {
      const active = o.value === value;
      return (
        <button
          key={o.value}
          role="radio"
          aria-checked={active}
          onClick={() => onChange(o.value)}
          className={`relative z-10 px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors ${
            active ? 'text-white' : 'text-muted hover:text-ink'
          }`}
        >
          {active && (
            <motion.span
              layoutId={`seg-${label}`}
              className="absolute inset-0 rounded-full bg-night -z-10"
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            />
          )}
          {o.label}
        </button>
      );
    })}
  </div>
);
