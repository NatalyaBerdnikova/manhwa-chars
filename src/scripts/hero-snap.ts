const hero = document.querySelector<HTMLElement>('.atelier');
const dossier = document.querySelector<HTMLElement>('#dossier');
const snapMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (hero && dossier) {
  const heroEl: HTMLElement = hero;
  const nextEl: HTMLElement = dossier;
  const header = document.querySelector<HTMLElement>('.site-header');
  let locked = false;
  let direction = 0;
  let consumed = false;
  let idle = 0;

  function headerHeight(): number {
    return header?.getBoundingClientRect().height ?? 0;
  }

  function noteDirection(delta: number): void {
    if (Math.abs(delta) < 0.5) return;
    const nextDirection = delta > 0 ? 1 : -1;
    if (nextDirection !== direction) {
      direction = nextDirection;
      consumed = false;
    }
    window.clearTimeout(idle);
    idle = window.setTimeout(() => {
      direction = 0;
      consumed = false;
    }, 700);
  }

  function shouldSnapDown(): boolean {
    const top = nextEl.getBoundingClientRect().top;
    const limit = window.innerHeight - 50;
    return top < limit && top > headerHeight() + 24;
  }

  function shouldSnapUp(): boolean {
    const box = heroEl.getBoundingClientRect();
    const visible = Math.min(window.innerHeight, box.bottom) - Math.max(0, box.top);
    return box.top < -8 && visible >= 50 && visible < window.innerHeight * 0.45;
  }

  function release(): void {
    locked = false;
  }

  function snap(top: number): void {
    locked = true;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.addEventListener('scrollend', release, { once: true });
    window.setTimeout(release, 850);
  }

  function maybeSnap(delta: number): boolean {
    if (snapMotion.matches || locked) return false;
    noteDirection(delta);
    if (consumed || !direction) return false;
    if (direction > 0 && shouldSnapDown()) {
      consumed = true;
      snap(nextEl.getBoundingClientRect().top + window.scrollY - headerHeight());
      return true;
    }
    if (direction < 0 && shouldSnapUp()) {
      consumed = true;
      snap(0);
      return true;
    }
    return false;
  }

  window.addEventListener(
    'wheel',
    (event) => {
      if (snapMotion.matches) return;
      const sameGesture = Math.sign(event.deltaY) === direction && direction !== 0;
      if ((locked || consumed) && sameGesture) {
        event.preventDefault();
        noteDirection(event.deltaY);
        return;
      }
      if (maybeSnap(event.deltaY)) event.preventDefault();
    },
    { passive: false },
  );

  let lastY = window.scrollY;
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      const delta = y - lastY;
      lastY = y;
      if (locked) return;
      maybeSnap(delta);
    },
    { passive: true },
  );

  let touchY = 0;
  window.addEventListener(
    'touchstart',
    (event) => {
      touchY = event.touches[0]?.clientY ?? touchY;
    },
    { passive: true },
  );
  window.addEventListener(
    'touchmove',
    (event) => {
      const y = event.touches[0]?.clientY;
      if (y == null || locked) return;
      const delta = touchY - y;
      touchY = y;
      maybeSnap(delta);
    },
    { passive: true },
  );

  snapMotion.addEventListener('change', () => {
    if (snapMotion.matches) release();
  });
}
