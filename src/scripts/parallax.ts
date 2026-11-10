const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

function layers(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
}

function clear(): void {
  for (const node of layers()) node.style.transform = '';
}

let pending = 0;

function paint(): void {
  pending = 0;
  const y = window.scrollY;
  const limit = y + window.innerHeight + 240;
  for (const node of layers()) {
    const speed = Number(node.dataset.parallax);
    if (!speed) continue;
    const top = node.getBoundingClientRect().top + y;
    if (top > limit) continue;
    node.style.transform = `translate3d(0, ${(y * speed).toFixed(2)}px, 0)`;
  }
}

function onScroll(): void {
  if (pending) return;
  pending = requestAnimationFrame(paint);
}

function enable(): void {
  if (layers().length === 0) return;
  window.addEventListener('scroll', onScroll, { passive: true });
  paint();
}

function disable(): void {
  window.removeEventListener('scroll', onScroll);
  if (pending) cancelAnimationFrame(pending);
  pending = 0;
  clear();
}

if (!motion.matches) enable();
motion.addEventListener('change', () => {
  if (motion.matches) disable();
  else enable();
});
