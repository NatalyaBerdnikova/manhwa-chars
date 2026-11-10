const root = document.querySelector<HTMLElement>('[data-character-index]');
if (root) {
  const scope = root;
  const grid = scope.querySelector<HTMLElement>('[data-catalog-grid]');
  const cards = grid ? [...grid.querySelectorAll<HTMLElement>(':scope > li')] : [];
  const status = scope.querySelector<HTMLElement>('[data-filter-status]');
  const empty = scope.querySelector<HTMLElement>('[data-filter-empty]');
  const sort = document.querySelector<HTMLSelectElement>('#catalog-sort');
  const search = document.querySelector<HTMLInputElement>('#site-search');
  const params = new URLSearchParams(location.search);

  function currentLang(): 'ru' | 'en' {
    return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'ru';
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

  function syncFromUrl() {
    if (search && params.get('q')) search.value = params.get('q') ?? '';
    if (sort && params.get('sort')) sort.value = params.get('sort') ?? 'featured';
    scope.querySelectorAll<HTMLInputElement>('input[data-filter]').forEach((input) => {
      const key = input.dataset.filter;
      if (!key) return;
      input.checked = params.getAll(key).includes(input.value);
    });
    scope.querySelectorAll<HTMLElement>('[data-acc]').forEach((button) => {
      const panel = document.getElementById(button.getAttribute('aria-controls') || '');
      if (panel?.querySelector('input:checked')) setAccordion(button, true);
    });
  }

  function writeUrl(query: string, sortValue: string, groups: Map<string, Set<string>>) {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (sortValue && sortValue !== 'featured') next.set('sort', sortValue);
    for (const [key, values] of groups) {
      for (const value of values) next.append(key, value);
    }
    const text = next.toString();
    history.replaceState(null, '', text ? `${location.pathname}?${text}` : location.pathname);
  }

  function apply() {
    const groups = selected();
    const query = (search?.value ?? '').trim().toLowerCase();
    const sortValue = sort?.value || 'featured';
    const language = currentLang();
    let shown = 0;
    for (const card of cards) {
      const tags = readTags(card);
      const facets = [...groups.entries()].every(([key, values]) => values.has(tags.get(key) ?? ''));
      const haystack = [card.dataset.nameRu, card.dataset.nameEn, card.dataset.workRu, card.dataset.workEn]
        .join(' ')
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const match = facets && matchesQuery;
      card.hidden = !match;
      if (match) shown += 1;
    }
    const ranked = [...cards].sort((a, b) => {
      if (sortValue === 'newest') return (b.dataset.added ?? '').localeCompare(a.dataset.added ?? '');
      if (sortValue === 'name' || sortValue === 'name-desc') {
        const left = language === 'en' ? a.dataset.nameEn : a.dataset.nameRu;
        const right = language === 'en' ? b.dataset.nameEn : b.dataset.nameRu;
        const order = (left ?? '').localeCompare(right ?? '', language);
        return sortValue === 'name-desc' ? -order : order;
      }
      const featured = Number(b.dataset.featured === 'true') - Number(a.dataset.featured === 'true');
      if (featured !== 0) return featured;
      return (b.dataset.added ?? '').localeCompare(a.dataset.added ?? '');
    });
    if (grid) {
      for (const card of ranked) grid.append(card);
    }
    if (status) {
      const template = status.getAttribute(language === 'en' ? 'data-template-en' : 'data-template-ru') ?? '';
      status.textContent = template.replace('{shown}', String(shown)).replace('{total}', String(cards.length));
    }
    if (empty) empty.hidden = shown !== 0;
    scope.querySelectorAll<HTMLElement>('[data-sort-face]').forEach((face) => {
      face.hidden = face.dataset.sortFace !== sortValue;
    });
    scope.querySelectorAll<HTMLElement>('[data-sort-option]').forEach((option) => {
      option.setAttribute('aria-selected', option.dataset.sortOption === sortValue ? 'true' : 'false');
    });
    writeUrl(query, sortValue, groups);
  }

  function setAccordion(button: HTMLElement, open: boolean) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    const panel = document.getElementById(button.getAttribute('aria-controls') || '');
    panel?.classList.toggle('is-open', open);
  }

  syncFromUrl();
  scope.addEventListener('change', apply);
  search?.addEventListener('input', apply);
  search?.form?.addEventListener('submit', (event) => {
    if (!location.pathname.includes('/characters')) return;
    event.preventDefault();
    apply();
  });
  scope.querySelector('[data-filter-clear]')?.addEventListener('click', () => {
    scope.querySelectorAll<HTMLInputElement>('input[data-filter]').forEach((input) => {
      input.checked = false;
    });
    if (search) search.value = '';
    if (sort) sort.value = 'featured';
    apply();
  });
  document.addEventListener('langchange', apply);

  const sortMenu = scope.querySelector<HTMLElement>('[data-sort-menu]');
  const sortToggle = scope.querySelector<HTMLButtonElement>('[data-sort-toggle]');
  const sortList = scope.querySelector<HTMLElement>('#sort-list');
  function closeSort() {
    sortList?.setAttribute('hidden', '');
    sortToggle?.setAttribute('aria-expanded', 'false');
  }
  sortToggle?.addEventListener('click', () => {
    const open = sortToggle.getAttribute('aria-expanded') === 'true';
    if (open) closeSort();
    else {
      sortList?.removeAttribute('hidden');
      sortToggle.setAttribute('aria-expanded', 'true');
    }
  });
  sortList?.querySelectorAll<HTMLButtonElement>('[data-sort-option]').forEach((option) => {
    option.addEventListener('click', () => {
      if (!sort) return;
      sort.value = option.dataset.sortOption || 'featured';
      closeSort();
      apply();
    });
  });
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Node) || !sortMenu?.contains(target)) closeSort();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSort();
  });

  scope.querySelectorAll<HTMLButtonElement>('[data-acc]').forEach((button) => {
    button.addEventListener('click', () => {
      setAccordion(button, button.getAttribute('aria-expanded') !== 'true');
    });
  });

  apply();
}
