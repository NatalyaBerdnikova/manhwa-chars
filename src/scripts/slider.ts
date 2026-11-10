const sliders = document.querySelectorAll<HTMLElement>('[data-cast-slider]');

sliders.forEach((root) => {
  const viewport = root.querySelector<HTMLElement>('[data-slider-viewport]');
  const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
  const status = root.querySelector<HTMLElement>('[data-slider-status]');
  const current = root.querySelector<HTMLElement>('[data-slider-current]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-slider-toggle]');
  const count = slides.length;
  if (!viewport || count === 0) return;

  let index = 0;
  let timer = 0;
  let moving = false;
  let paused = false;
  let hovered = false;
  let focused = false;
  let seen = true;
  let pointerId = -1;
  let startX = 0;
  let startY = 0;
  let dragged = false;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  function lang(): 'ru' | 'en' {
    return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'ru';
  }

  function slideName(slide: HTMLElement): string {
    return slide.getAttribute(lang() === 'en' ? 'data-name-en' : 'data-name-ru') || '';
  }

  function labelToggle() {
    if (!toggle) return;
    const key = `${paused ? 'play' : 'pause'}-${lang()}`;
    toggle.setAttribute('aria-label', toggle.getAttribute(`data-label-${key}`) || '');
    toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
  }

  function update() {
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      const link = slide.querySelector('a');
      if (link) link.tabIndex = active ? 0 : -1;
    });
    if (current) current.textContent = String(index + 1).padStart(2, '0');
    if (status) {
      const template = status.getAttribute(lang() === 'en' ? 'data-template-en' : 'data-template-ru') || '';
      status.textContent = template
        .replace('{name}', slideName(slides[index]))
        .replace('{index}', String(index + 1))
        .replace('{total}', String(count));
    }
    labelToggle();
  }

  function stop() {
    if (timer) window.clearInterval(timer);
    timer = 0;
  }

  function start() {
    stop();
    if (count < 2 || paused || hovered || focused || motion.matches || document.hidden || !seen) return;
    timer = window.setInterval(() => go(1), 4600);
  }

  function go(direction: 1 | -1) {
    if (count < 2 || moving) return;
    const next = (index + direction + count) % count;
    const incoming = slides[next];
    const outgoing = slides[index];
    const fromSide = direction > 0 ? 'is-right' : 'is-left';
    const toSide = direction > 0 ? 'is-left' : 'is-right';
    root.classList.add('is-instant');
    incoming.classList.remove('is-active', 'is-left', 'is-right');
    incoming.classList.add(fromSide);
    void incoming.offsetWidth;
    root.classList.remove('is-instant');
    outgoing.classList.remove('is-active', 'is-left', 'is-right');
    outgoing.classList.add(toSide);
    incoming.classList.remove(fromSide);
    incoming.classList.add('is-active');
    index = next;
    update();
    moving = true;
    window.setTimeout(() => {
      moving = false;
    }, motion.matches ? 0 : 780);
    start();
  }

  root.querySelector('[data-slider-prev]')?.addEventListener('click', () => go(-1));
  root.querySelector('[data-slider-next]')?.addEventListener('click', () => go(1));
  toggle?.addEventListener('click', () => {
    paused = !paused;
    labelToggle();
    if (paused) stop();
    else start();
  });

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    }
  });

  if (finePointer.matches) {
    root.addEventListener('pointerenter', () => {
      hovered = true;
      stop();
    });
    root.addEventListener('pointerleave', () => {
      hovered = false;
      start();
    });
  }

  root.addEventListener('focusin', () => {
    focused = true;
    stop();
  });
  root.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !root.contains(next)) {
      focused = false;
      start();
    }
  });

  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const target = event.target;
    if (target instanceof Element && target.closest('button')) return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    dragged = false;
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) dragged = true;
  });
  viewport.addEventListener('pointerup', (event) => {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    pointerId = -1;
    if (dragged && Math.abs(dx) >= 48) go(dx < 0 ? 1 : -1);
  });
  viewport.addEventListener('pointercancel', () => {
    pointerId = -1;
    dragged = false;
  });
  viewport.addEventListener(
    'click',
    (event) => {
      if (!dragged) return;
      event.preventDefault();
      event.stopPropagation();
      dragged = false;
    },
    true,
  );

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
  document.addEventListener('langchange', update);
  motion.addEventListener('change', () => {
    if (motion.matches) stop();
    else start();
  });

  const observer = new IntersectionObserver(
    (entries) => {
      seen = entries.some((entry) => entry.isIntersecting);
      if (seen) start();
      else stop();
    },
    { threshold: 0.35 },
  );
  observer.observe(root);

  if (count < 2) root.classList.add('is-single');
  root.classList.add('is-ready');
  update();
  start();
});
