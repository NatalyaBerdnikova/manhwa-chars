const fineHover = window.matchMedia('(hover: hover) and (pointer: fine)');

function arm(picture: HTMLElement): void {
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
}

function watch(tile: HTMLElement): void {
  const picture = tile.querySelector<HTMLElement>('[data-deferred-picture]');
  const image = picture?.querySelector('img');
  if (!picture || !image) return;

  const markReady = () => {
    if (image.complete && image.naturalWidth > 0) tile.classList.add('is-alt-ready');
  };

  const start = () => {
    arm(picture);
    image.addEventListener('load', markReady, { once: true });
    markReady();
  };

  tile.addEventListener('pointerenter', start);
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      start();
      observer.disconnect();
    },
    { rootMargin: '280px' },
  );
  observer.observe(tile);
}

if (fineHover.matches) {
  document.querySelectorAll<HTMLElement>('[data-lazy-alt]').forEach(watch);
}
