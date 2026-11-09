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
  document.addEventListener('langchange', syncKind);
  syncKind();

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
