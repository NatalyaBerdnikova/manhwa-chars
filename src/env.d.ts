/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_FORM_ENDPOINT?: string;
  readonly PUBLIC_FORM_ACTION?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}
