const root = document.querySelector<HTMLElement>('[data-character-index]');
if (root) {
  const scope = root;
  const grid = scope.querySelector<HTMLElement>('[data-catalog-grid]');
  const cards = grid ? [...grid.querySelectorAll<HTMLElement>(':scope > li')] : [];
  const status = scope.querySelector<HTMLElement>('[data-filter-status]');
  const empty = scope.querySelector<HTMLElement>('[data-filter-empty]');
  const search = document.querySelector<HTMLInputElement>('#site-search');
  const catalogSearch = scope.querySelector<HTMLInputElement>('#catalog-search');
  const pager = scope.querySelector<HTMLElement>('[data-pager]');
  const pageList = scope.querySelector<HTMLElement>('[data-page-list]');
  const prevButton = scope.querySelector<HTMLButtonElement>('[data-page-prev]');
  const nextButton = scope.querySelector<HTMLButtonElement>('[data-page-next]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let page = 1;
  let appliedPage = 1;

  function currentLang(): 'ru' | 'en' {
    return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'ru';
  }

  function pageSize(): number {
    const size = Number(scope.dataset.pageSize || '24');
    return Number.isFinite(size) && size > 0 ? size : 24;
  }

  function readPage(searchParams: URLSearchParams): number {
    const value = Number(searchParams.get('page') || '1');
    return Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
  }

  function readTags(card: HTMLElement): Map<string, string> {
    const tags = new Map<string, string>();
    for (const part of (card.dataset.tags ?? '').split(/\s+/)) {
      const index = part.indexOf(':');
      if (index > 0) tags.set(part.slice(0, index), part.slice(index + 1));
    }
    return tags;
  }

  function selected(): Map<string, Set<string>> {
    const groups = new Map<string, Set<string>>();
    scope.querySelectorAll<HTMLInputElement>('input[data-filter]:checked').forEach((input) => {
      const key = input.dataset.filter;
      if (!key) return;
      const values = groups.get(key) ?? new Set<string>();
      values.add(input.value);
      groups.set(key, values);
    });
    return groups;
  }

  function markTag(key: string, value: string) {
    scope.querySelectorAll<HTMLInputElement>('input[data-filter]').forEach((input) => {
      if (input.dataset.filter === key && input.value === value) input.checked = true;
    });
  }

  function syncFromUrl(searchParams: URLSearchParams) {
    const query = searchParams.get('q') ?? '';
    if (search) search.value = query;
    if (catalogSearch) catalogSearch.value = query;
    scope.querySelectorAll<HTMLInputElement>('input[data-filter]').forEach((input) => {
      input.checked = false;
    });
    scope.querySelectorAll<HTMLInputElement>('input[data-filter]').forEach((input) => {
      const key = input.dataset.filter;
      if (!key) return;
      input.checked = searchParams.getAll(key).includes(input.value);
    });
    for (const token of searchParams.getAll('tag')) {
      const index = token.indexOf(':');
      if (index > 0) markTag(token.slice(0, index), token.slice(index + 1));
    }
    scope.querySelectorAll<HTMLElement>('[data-acc]').forEach((button) => {
      const panel = document.getElementById(button.getAttribute('aria-controls') || '');
      setAccordion(button, Boolean(panel?.querySelector('input:checked')));
    });
    page = readPage(searchParams);
  }

  function writeUrl(historyMode: 'push' | 'replace', query: string, groups: Map<string, Set<string>>) {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    for (const [key, values] of groups) {
      for (const value of values) next.append('tag', `${key}:${value}`);
    }
    if (page > 1) next.set('page', String(page));
    const text = next.toString();
    const url = text ? `${location.pathname}?${text}` : location.pathname;
    if (`${location.pathname}${location.search}` === url) return;
    const state = historyMode === 'push' ? history.pushState : history.replaceState;
    state.call(history, null, '', url);
  }

  function pageItems(current: number, total: number): Array<number | '…'> {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    const wanted = new Set<number>([1, total, current, current - 1, current + 1]);
    if (current <= 3) {
      wanted.add(2);
      wanted.add(3);
      wanted.add(4);
    }
    if (current >= total - 2) {
      wanted.add(total - 1);
      wanted.add(total - 2);
      wanted.add(total - 3);
    }
    const pages = [...wanted].filter((item) => item >= 1 && item <= total).sort((a, b) => a - b);
    const items: Array<number | '…'> = [];
    for (let index = 0; index < pages.length; index += 1) {
      const value = pages[index];
      if (value === undefined) continue;
      if (index > 0) {
        const previous = pages[index - 1];
        if (previous !== undefined && value - previous > 1) items.push('…');
      }
      items.push(value);
    }
    return items;
  }

  function labelPager() {
    if (!pager) return;
    const language = currentLang();
    pager.setAttribute('aria-label', pager.getAttribute(language === 'en' ? 'data-label-en' : 'data-label-ru') || '');
    prevButton?.setAttribute('aria-label', pager.getAttribute(language === 'en' ? 'data-prev-en' : 'data-prev-ru') || '');
    nextButton?.setAttribute('aria-label', pager.getAttribute(language === 'en' ? 'data-next-en' : 'data-next-ru') || '');
  }

  function renderPager(total: number) {
    if (!pager || !pageList) return;
    labelPager();
    pager.hidden = total < 2;
    if (prevButton) prevButton.disabled = page <= 1;
    if (nextButton) nextButton.disabled = page >= total;
    pageList.replaceChildren();
    if (total < 2) return;
    for (const item of pageItems(page, total)) {
      const entry = document.createElement('li');
      if (item === '…') {
        const gap = document.createElement('span');
        gap.className = 'pager-gap';
        gap.textContent = '…';
        gap.setAttribute('aria-hidden', 'true');
        entry.append(gap);
      } else {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(item);
        if (item === page) button.setAttribute('aria-current', 'page');
        button.addEventListener('click', () => {
          page = item;
          apply({ history: 'push', scroll: true });
        });
        entry.append(button);
      }
      pageList.append(entry);
    }
  }

  function scrollToGrid() {
    grid?.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' });
  }

  function apply(options: { resetPage?: boolean; history: 'push' | 'replace' | 'none'; scroll: boolean }) {
    if (options.resetPage) page = 1;
    const groups = selected();
    const query = (catalogSearch?.value || search?.value || '').trim().toLowerCase();
    const language = currentLang();
    const size = pageSize();
    let matched = 0;
    const ranked = [...cards].sort((a, b) => {
      const featured = Number(b.dataset.featured === 'true') - Number(a.dataset.featured === 'true');
      if (featured !== 0) return featured;
      const left = language === 'en' ? a.dataset.nameEn : a.dataset.nameRu;
      const right = language === 'en' ? b.dataset.nameEn : b.dataset.nameRu;
      return (left ?? '').localeCompare(right ?? '', language);
    });
    const matches: HTMLElement[] = [];
    for (const card of ranked) {
      const tags = readTags(card);
      const facets = [...groups.entries()].every(([key, values]) => values.has(tags.get(key) ?? ''));
      const haystack = [
        card.dataset.nameRu,
        card.dataset.nameEn,
        card.dataset.workRu,
        card.dataset.workEn,
        card.dataset.labels,
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      if (facets && matchesQuery) {
        matched += 1;
        matches.push(card);
      } else {
        card.hidden = true;
      }
    }
    const pages = Math.max(1, Math.ceil(matched / size));
    if (page > pages) page = pages;
    if (page < 1) page = 1;
    const start = (page - 1) * size;
    matches.forEach((card, index) => {
      card.hidden = index < start || index >= start + size;
    });
    if (grid) {
      for (const card of ranked) grid.append(card);
    }
    if (status) {
      const template = status.getAttribute(language === 'en' ? 'data-template-en' : 'data-template-ru') ?? '';
      const visibleCount = Math.min(size, Math.max(0, matched - start));
      status.textContent = template.replace('{shown}', String(visibleCount)).replace('{total}', String(matched));
    }
    if (empty) empty.hidden = matched !== 0;
    renderPager(pages);
    if (options.history !== 'none') writeUrl(options.history, query, groups);
    if (options.scroll && page !== appliedPage) scrollToGrid();
    appliedPage = page;
  }

  function setAccordion(button: HTMLElement, open: boolean) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    const panel = document.getElementById(button.getAttribute('aria-controls') || '');
    panel?.classList.toggle('is-open', open);
  }

  syncFromUrl(new URLSearchParams(location.search));
  scope.addEventListener('change', () => apply({ resetPage: true, history: 'push', scroll: true }));
  function mirrorSearch(source: HTMLInputElement | null) {
    const value = source?.value ?? '';
    if (search && source !== search) search.value = value;
    if (catalogSearch && source !== catalogSearch) catalogSearch.value = value;
    apply({ resetPage: true, history: 'replace', scroll: true });
  }
  search?.addEventListener('input', () => mirrorSearch(search));
  catalogSearch?.addEventListener('input', () => mirrorSearch(catalogSearch));
  search?.form?.addEventListener('submit', (event) => {
    if (!location.pathname.includes('/characters')) return;
    event.preventDefault();
    apply({ resetPage: true, history: 'replace', scroll: true });
  });
  scope.querySelector('[data-filter-clear]')?.addEventListener('click', () => {
    scope.querySelectorAll<HTMLInputElement>('input[data-filter]').forEach((input) => {
      input.checked = false;
    });
    if (search) search.value = '';
    if (catalogSearch) catalogSearch.value = '';
    apply({ resetPage: true, history: 'push', scroll: true });
  });
  document.addEventListener('langchange', () => {
    labelPager();
    apply({ history: 'none', scroll: false });
  });
  prevButton?.addEventListener('click', () => {
    if (page <= 1) return;
    page -= 1;
    apply({ history: 'push', scroll: true });
  });
  nextButton?.addEventListener('click', () => {
    page += 1;
    apply({ history: 'push', scroll: true });
  });
  window.addEventListener('popstate', () => {
    syncFromUrl(new URLSearchParams(location.search));
    apply({ history: 'none', scroll: page !== appliedPage });
  });

  scope.querySelectorAll<HTMLButtonElement>('[data-acc]').forEach((button) => {
    button.addEventListener('click', () => {
      setAccordion(button, button.getAttribute('aria-expanded') !== 'true');
    });
  });

  apply({ history: 'replace', scroll: false });
}
