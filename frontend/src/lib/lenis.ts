import Lenis from 'lenis';

let instance: Lenis | null = null;

export function startLenis() {
  if (instance) return instance;
  instance = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), wheelMultiplier: 0.95 });
  let raf = 0;
  const loop = (time: number) => {
    instance?.raf(time);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const inst = instance;
  const destroy = inst.destroy.bind(inst);
  inst.destroy = () => {
    cancelAnimationFrame(raf);
    destroy();
    instance = null;
  };
  return inst;
}

export function stopLenis() {
  instance?.destroy();
}

export function scrollToY(y: number) {
  if (instance) instance.scrollTo(y, { duration: 1.6 });
  else window.scrollTo({ top: y, behavior: 'smooth' });
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const y = el.getBoundingClientRect().top + window.scrollY - 24;
  scrollToY(y);
}
