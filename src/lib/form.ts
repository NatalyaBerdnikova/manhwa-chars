export type FormProvider = 'netlify' | 'formspree' | 'web3forms' | 'custom';

export function formProvider(action: string): FormProvider {
  if (!action.trim()) return 'netlify';
  const url = action.toLowerCase();
  if (url.includes('formspree.io')) return 'formspree';
  if (url.includes('web3forms.com')) return 'web3forms';
  return 'custom';
}

export function honeypotName(provider: FormProvider): string {
  if (provider === 'formspree') return '_gotcha';
  if (provider === 'web3forms') return 'botcheck';
  return 'bot-field';
}
