# Aura Finance: front-end design notes

**Worlds.** Landing = warm ink (`#0D0B09`) + vellum (`#F4EDE0`). Workspace = warm paper (`#FFFCF5`) with an ink sidebar. One accent: ember `#FF6908` (`#C74A00` for text on light).
**Type.** Instrument Serif (display), Geist (UI), JetBrains Mono (ledger numerals). All self-hosted via @fontsource.
**Signature.** `components/landing/LedgerScene.tsx`: a procedural Three.js sculpture (30 plates = 30 statement rows) driven by scroll. Tower -> fanned statements (Import) -> sorted columns (Categorize) -> answer plate with evidence lines (Ask). No external model or HDR files; lit with built-in light panels. Lazy-loaded as its own chunk, paused off-screen, static fallback without WebGL, and a still frame under `prefers-reduced-motion`.
**Motion rules.** One orchestrated load sequence (hero), scroll-driven story, masked headline rises, blur-rise reveals once per element, interactive demos that respond to input. Everything honours reduced motion.
**Shared pieces.** `components/ui/primitives.tsx` (Mark, PageHeader, CountUp, Segmented, Skeleton, Stagger/Item), `lib/motion.ts`, `lib/lenis.ts`, tokens in `src/index.css`.
