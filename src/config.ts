import defaults from '../site.config.json';

export const author = defaults.author;
export const formEndpoint =
  import.meta.env.PUBLIC_FORM_ENDPOINT ||
  import.meta.env.PUBLIC_FORM_ACTION ||
  defaults.formEndpoint;
export const turnstileSiteKey =
  import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || defaults.turnstileSiteKey;
