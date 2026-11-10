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

  function offsetOf(slideIndex: number): number {
    let delta = slideIndex - index;
    const half = count / 2;
    if (delta > half) delta -= count;
    if (delta < -half) delta += count;
    return delta;
  }

  function update() {
    slides.forEach((slide, slideIndex) => {
      const delta = offsetOf(slideIndex);
      slide.classList.toggle('is-active', delta === 0);
      slide.classList.toggle('is-prev', delta === -1);
      slide.classList.toggle('is-next', delta === 1);
      slide.classList.toggle('is-far-prev', delta < -1);
      slide.classList.toggle('is-far-next', delta > 1);
      const visible = Math.abs(delta) <= 1;
      slide.setAttribute('aria-hidden', visible ? 'false' : 'true');
      const link = slide.querySelector('a');
      if (link) link.tabIndex = delta === 0 ? 0 : -1;
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
    slides.forEach((slide, slideIndex) => {
      if (Math.abs(offsetOf(slideIndex)) > 1) return;
      slide.querySelectorAll<HTMLElement>('[data-deferred-picture]').forEach((picture) => {
        if (picture.dataset.armed === 'true') return;
        picture.querySelectorAll<HTMLSourceElement>('[data-srcset]').forEach((node) => {
          const value = node.getAttribute('data-srcset');
          if (value) node.srcset = value;
        });
        picture.querySelectorAll<HTMLImageElement>('img[data-src]').forEach((node) => {
          const value = node.getAttribute('data-src');
          if (value) node.src = value;
        });
        picture.dataset.armed = 'true';
      });
    });
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
    if (!motion.matches) {
      root.classList.add('is-instant', 'is-flying');
      void root.offsetWidth;
      root.classList.remove('is-instant');
    }
    index = (index + direction + count) % count;
    update();
    moving = true;
    window.setTimeout(() => root.classList.remove('is-flying'), motion.matches ? 0 : 40);
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

  viewport.addEventListener('dragstart', (event) => event.preventDefault());
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
  root.classList.add('is-instant', 'is-ready');
  update();
  window.requestAnimationFrame(() => root.classList.remove('is-instant'));
  start();
});
