const root = document.querySelector<HTMLElement>('[data-character-index]');
if (root) {
  const scope = root;
  const grid = scope.querySelector<HTMLElement>('[data-catalog-grid]');
  const cards = grid ? [...grid.querySelectorAll<HTMLElement>(':scope > li')] : [];
  const status = scope.querySelector<HTMLElement>('[data-filter-status]');
  const empty = scope.querySelector<HTMLElement>('[data-filter-empty]');
  const search = document.querySelector<HTMLInputElement>('#site-search');
  const catalogSearch = scope.querySelector<HTMLInputElement>('#catalog-search');
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

  function markTag(key: string, value: string) {
    scope.querySelectorAll<HTMLInputElement>('input[data-filter]').forEach((input) => {
      if (input.dataset.filter === key && input.value === value) input.checked = true;
    });
  }

  function syncFromUrl() {
    const query = params.get('q') ?? '';
    if (search) search.value = query;
    if (catalogSearch) catalogSearch.value = query;
    scope.querySelectorAll<HTMLInputElement>('input[data-filter]').forEach((input) => {
      const key = input.dataset.filter;
      if (!key) return;
      input.checked = params.getAll(key).includes(input.value);
    });
    for (const token of params.getAll('tag')) {
      const index = token.indexOf(':');
      if (index > 0) markTag(token.slice(0, index), token.slice(index + 1));
    }
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
      for (const value of values) next.append('tag', `${key}:${value}`);
    }
    const text = next.toString();
    history.replaceState(null, '', text ? `${location.pathname}?${text}` : location.pathname);
  }

  const moreButton = scope.querySelector<HTMLButtonElement>('[data-show-more]');
  let pageLimit = pageSize();

  function pageSize(): number {
    const size = Number(scope.dataset.pageSize || '24');
    return Number.isFinite(size) && size > 0 ? size : 24;
  }

  function apply(resetPage = false) {
    if (resetPage) pageLimit = pageSize();
    const groups = selected();
    const query = (catalogSearch?.value || search?.value || '').trim().toLowerCase();
    const language = currentLang();
    let matched = 0;
    const ranked = [...cards].sort((a, b) => {
      const featured = Number(b.dataset.featured === 'true') - Number(a.dataset.featured === 'true');
      if (featured !== 0) return featured;
      const left = language === 'en' ? a.dataset.nameEn : a.dataset.nameRu;
      const right = language === 'en' ? b.dataset.nameEn : b.dataset.nameRu;
      return (left ?? '').localeCompare(right ?? '', language);
    });
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
      const match = facets && matchesQuery;
      if (match) matched += 1;
      card.hidden = !match || matched > pageLimit;
    }
    if (grid) {
      for (const card of ranked) grid.append(card);
    }
    if (status) {
      const template = status.getAttribute(language === 'en' ? 'data-template-en' : 'data-template-ru') ?? '';
      status.textContent = template.replace('{shown}', String(matched)).replace('{total}', String(cards.length));
    }
    if (empty) empty.hidden = matched !== 0;
    if (moreButton) moreButton.hidden = matched <= pageLimit;
    writeUrl(query, 'featured', groups);
  }

  function setAccordion(button: HTMLElement, open: boolean) {
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    const panel = document.getElementById(button.getAttribute('aria-controls') || '');
    panel?.classList.toggle('is-open', open);
  }

  syncFromUrl();
  scope.addEventListener('change', () => apply(true));
  function mirrorSearch(source: HTMLInputElement | null) {
    const value = source?.value ?? '';
    if (search && source !== search) search.value = value;
    if (catalogSearch && source !== catalogSearch) catalogSearch.value = value;
    apply(true);
  }
  search?.addEventListener('input', () => mirrorSearch(search));
  catalogSearch?.addEventListener('input', () => mirrorSearch(catalogSearch));
  search?.form?.addEventListener('submit', (event) => {
    if (!location.pathname.includes('/characters')) return;
    event.preventDefault();
    apply(true);
  });
  scope.querySelector('[data-filter-clear]')?.addEventListener('click', () => {
    scope.querySelectorAll<HTMLInputElement>('input[data-filter]').forEach((input) => {
      input.checked = false;
    });
    if (search) search.value = '';
    if (catalogSearch) catalogSearch.value = '';
    apply(true);
  });
  document.addEventListener('langchange', () => apply(false));
  moreButton?.addEventListener('click', () => {
    pageLimit += pageSize();
    apply(false);
  });

  scope.querySelectorAll<HTMLButtonElement>('[data-acc]').forEach((button) => {
    button.addEventListener('click', () => {
      setAccordion(button, button.getAttribute('aria-expanded') !== 'true');
    });
  });

  apply();
}
