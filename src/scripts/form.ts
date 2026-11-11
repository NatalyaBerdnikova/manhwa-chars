const form = document.querySelector<HTMLFormElement>('#submission-form');
if (form) {
  const submission = form;
  const status = document.querySelector<HTMLElement>('#form-status');
  const fields = [...submission.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-field]')];
  const localeField = submission.querySelector<HTMLInputElement>('[data-locale]');

  function lang(): 'ru' | 'en' {
    return document.documentElement.getAttribute('data-lang') === 'en' ? 'en' : 'ru';
  }

  function message(name: string): string {
    return submission.getAttribute(`data-${name}-${lang()}`) || submission.getAttribute(`data-${name}-ru`) || '';
  }

  function showStatus(kind: 'ok' | 'err', text: string) {
    if (!status) return;
    status.hidden = false;
    status.classList.toggle('ok', kind === 'ok');
    status.classList.toggle('err', kind === 'err');
    status.textContent = text;
  }

  function showError(field: HTMLInputElement | HTMLTextAreaElement, text: string) {
    const error = document.getElementById(`${field.id}-error`);
    field.setAttribute('aria-invalid', text ? 'true' : 'false');
    if (!error) return;
    error.textContent = text;
    error.hidden = !text;
  }

  function syncKind() {
    const selected = submission.querySelector<HTMLInputElement>('input[name="kind"]:checked');
    const character = selected?.value !== 'work';
    for (const field of fields) {
      if (!field.dataset.requiredFor) continue;
      field.required = character && field.dataset.requiredFor === 'character';
      if (!field.required) showError(field, '');
    }
    if (localeField) localeField.value = lang();
  }

  function invalidMessage(field: HTMLInputElement | HTMLTextAreaElement): string {
    if (field.validity.valueMissing) return message('missing');
    if (field.validity.typeMismatch) return field.type === 'email' ? message('email') : message('url');
    if (field.validity.tooShort || field.validity.tooLong) return message('missing');
    return message('missing');
  }

  submission.querySelectorAll('input[name="kind"]').forEach((input) => {
    input.addEventListener('change', syncKind);
  });
  document.addEventListener('langchange', () => {
    syncKind();
    renderTitles();
  });
  syncKind();

  const titleInput = submission.querySelector<HTMLInputElement>('[data-title-combo]');
  const titleList = document.querySelector<HTMLElement>('#work-title-list');
  const titleData = document.querySelector<HTMLScriptElement>('#work-title-data');
  let titleItems: { ru: string; en: string }[] = [];
  try {
    titleItems = JSON.parse(titleData?.textContent || '[]') as { ru: string; en: string }[];
  } catch {
    titleItems = [];
  }
  let activeTitle = -1;

  function titleChoices(): string[] {
    const seen = new Set<string>();
    const choices: string[] = [];
    for (const item of titleItems) {
      const value = (lang() === 'en' ? item.en : item.ru).trim();
      const key = value.toLocaleLowerCase(lang() === 'en' ? 'en' : 'ru');
      if (!value || seen.has(key)) continue;
      seen.add(key);
      choices.push(value);
    }
    return choices;
  }

  function closeTitles() {
    if (!titleList || !titleInput) return;
    titleList.hidden = true;
    titleList.replaceChildren();
    titleInput.setAttribute('aria-expanded', 'false');
    titleInput.removeAttribute('aria-activedescendant');
    activeTitle = -1;
  }

  function renderTitles() {
    if (!titleList || !titleInput) return;
    const query = titleInput.value.trim().toLocaleLowerCase(lang() === 'en' ? 'en' : 'ru');
    const matches = titleChoices()
      .filter((value) => !query || value.toLocaleLowerCase(lang() === 'en' ? 'en' : 'ru').includes(query))
      .slice(0, 8);
    titleList.replaceChildren();
    if (matches.length === 0 || document.activeElement !== titleInput) {
      closeTitles();
      return;
    }
    matches.forEach((value, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.id = `work-title-option-${index}`;
      button.setAttribute('role', 'option');
      button.textContent = value;
      button.addEventListener('mousedown', (event) => {
        event.preventDefault();
        titleInput.value = value;
        closeTitles();
      });
      item.append(button);
      titleList.append(item);
    });
    if (activeTitle >= matches.length) activeTitle = matches.length - 1;
    markTitle(activeTitle);
    titleList.hidden = false;
    titleInput.setAttribute('aria-expanded', 'true');
  }

  function markTitle(index: number) {
    if (!titleList || !titleInput) return;
    const buttons = [...titleList.querySelectorAll<HTMLButtonElement>('button')];
    buttons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.setAttribute('aria-selected', selected ? 'true' : 'false');
      if (selected) titleInput.setAttribute('aria-activedescendant', button.id);
    });
    if (index < 0) titleInput.removeAttribute('aria-activedescendant');
  }

  titleInput?.addEventListener('input', () => {
    activeTitle = -1;
    renderTitles();
  });
  titleInput?.addEventListener('focus', () => {
    activeTitle = -1;
    renderTitles();
  });
  titleInput?.addEventListener('blur', () => {
    closeTitles();
  });
  titleInput?.addEventListener('keydown', (event) => {
    const buttons = [...(titleList?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    if (event.key === 'ArrowDown' && buttons.length) {
      event.preventDefault();
      activeTitle = Math.min(buttons.length - 1, activeTitle + 1);
      markTitle(activeTitle);
    } else if (event.key === 'ArrowUp' && buttons.length) {
      event.preventDefault();
      activeTitle = Math.max(-1, activeTitle - 1);
      markTitle(activeTitle);
    } else if (event.key === 'Enter' && activeTitle >= 0 && buttons[activeTitle]) {
      event.preventDefault();
      titleInput.value = buttons[activeTitle].textContent || titleInput.value;
      closeTitles();
    } else if (event.key === 'Escape') {
      closeTitles();
    }
  });

  submission.addEventListener('submit', async (event) => {
    const endpoint = submission.dataset.endpoint || '';
    syncKind();
    let firstInvalid: HTMLInputElement | HTMLTextAreaElement | null = null;
    for (const field of fields) {
      if (!field.checkValidity()) {
        showError(field, invalidMessage(field));
        firstInvalid ??= field;
      } else {
        showError(field, '');
      }
    }
    if (firstInvalid) {
      event.preventDefault();
      firstInvalid.focus();
      return;
    }
    if (!endpoint) {
      event.preventDefault();
      showStatus('err', message('error'));
      return;
    }
    if (submission.querySelector<HTMLInputElement>('[name="bot-field"]')?.value) {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    const button = submission.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (button) button.disabled = true;
    showStatus('ok', message('sending'));
    try {
      const payload = Object.fromEntries(new FormData(submission).entries());
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (response.status === 429) {
        showStatus('err', message('rate'));
      } else if (response.status === 400) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        showStatus('err', body.error === 'turnstile' ? message('turnstile') : message('error'));
      } else if (!response.ok) {
        showStatus('err', message('error'));
      } else {
        showStatus('ok', message('success'));
        submission.reset();
        syncKind();
      }
    } catch {
      showStatus('err', message('error'));
    } finally {
      if (button) button.disabled = false;
    }
  });
}
