import {
  acceptedCategory,
  getUserPreferences,
  run,
  showPreferences,
  type CookieConsentConfig,
} from 'vanilla-cookieconsent';
import { defaultConsentModeCategoryMap } from '../defaultConfig';
import type {
  ConsentModeCategoryMap,
  ConsentModeState,
  ConsentModeType,
  CookieConsentRuntimeOptions,
  SerializableConsentCategory,
  SerializableCookieItem,
} from '../types';

declare global {
  interface Window {
    __dcCookieConsent?: Promise<void>;
    gtag?: (command: 'consent', action: 'default' | 'update', values: Record<string, unknown>) => void;
  }

  interface WindowEventMap {
    'dc:cookie-consent-change': CustomEvent<{
      preferences: ReturnType<typeof getUserPreferences>;
      consentMode: Partial<Record<ConsentModeType, ConsentModeState>>;
    }>;
  }
}

const consentDocumentClasses = ['show--consent', 'show--preferences', 'disable--interaction'];

const hydrateCookie = (cookie: SerializableCookieItem) => ({
  ...cookie,
  name:
    typeof cookie.name === 'string'
      ? cookie.name
      : new RegExp(cookie.name.pattern, cookie.name.flags),
});

const hydrateCategory = (category: SerializableConsentCategory) => ({
  ...category,
  autoClear: category.autoClear
    ? {
        ...category.autoClear,
        cookies: category.autoClear.cookies.map(hydrateCookie),
      }
    : undefined,
  services: category.services
    ? Object.fromEntries(
        Object.entries(category.services).map(([name, service]) => [
          name,
          {
            ...service,
            cookies: service.cookies?.map(hydrateCookie),
          },
        ]),
      )
    : undefined,
});

const resolveConsentMode = (categoryMap: ConsentModeCategoryMap) => {
  const consentMode: Partial<Record<ConsentModeType, ConsentModeState>> = {};

  for (const [category, consentTypes] of Object.entries(categoryMap)) {
    const state: ConsentModeState = acceptedCategory(category) ? 'granted' : 'denied';
    for (const consentType of consentTypes) consentMode[consentType] = state;
  }

  return consentMode;
};

const notifyConsentChange = (categoryMap?: ConsentModeCategoryMap) => {
  const consentMode = categoryMap ? resolveConsentMode(categoryMap) : {};
  if (categoryMap) window.gtag?.('consent', 'update', consentMode);

  window.dispatchEvent(
    new CustomEvent('dc:cookie-consent-change', {
      detail: {
        preferences: getUserPreferences(),
        consentMode,
      },
    }),
  );
};

const preserveConsentClasses = () => {
  document.addEventListener('astro:before-swap', (event) => {
    for (const className of consentDocumentClasses) {
      event.newDocument.documentElement.classList.toggle(
        className,
        document.documentElement.classList.contains(className),
      );
    }
  });
};

const bindPreferencesControl = () => {
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest('[data-dc-cookie-preferences]') : null;
    if (!target) return;

    event.preventDefault();
    showPreferences();
  });
};

export const initializeCookieConsent = ({
  config,
  googleConsentMode = false,
  rootSelector = '#dc-cookie-consent-root',
}: CookieConsentRuntimeOptions) => {
  if (window.__dcCookieConsent) return window.__dcCookieConsent;

  const categoryMap =
    typeof googleConsentMode === 'object'
      ? googleConsentMode.categoryMap ?? defaultConsentModeCategoryMap
      : defaultConsentModeCategoryMap;

  const hydratedConfig: CookieConsentConfig = {
    ...config,
    root: config.root ?? rootSelector,
    categories: Object.fromEntries(
      Object.entries(config.categories).map(([name, category]) => [name, hydrateCategory(category)]),
    ),
    onConsent: () => notifyConsentChange(googleConsentMode ? categoryMap : undefined),
    onChange: () => notifyConsentChange(googleConsentMode ? categoryMap : undefined),
  };

  preserveConsentClasses();
  bindPreferencesControl();
  window.__dcCookieConsent = run(hydratedConfig).then(() => undefined);

  return window.__dcCookieConsent;
};

export const initializeCookieConsentFromDocument = () => {
  const element = document.querySelector<HTMLScriptElement>('[data-dc-cookie-consent-options]');
  if (!element?.textContent) return;

  const options = JSON.parse(element.textContent) as CookieConsentRuntimeOptions;
  void initializeCookieConsent(options);
};

export const showCookiePreferences = () => showPreferences();
