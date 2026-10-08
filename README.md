# @digital-craft-ltd/astro-cookie-consent

Cookie consent components for Astro, built on Orest Bida's [CookieConsent](https://github.com/orestbida/cookieconsent). The package provides:

- an accessible opt-in banner and preferences dialog;
- a persistent cookie settings control;
- optional Google Consent Mode v2 defaults and updates;
- automatic handling for Astro client-side navigation;
- serializable configuration that works across the Astro server/client boundary.

## Why this package exists

`vanilla-cookieconsent` remains the consent engine and supplies the modal, preference storage, script management, and core styles. This package adds only the Astro integration: components, server-to-client configuration, Google Consent Mode wiring, and client-side navigation handling. Keeping that boundary small lets Astro projects share a reviewed setup without maintaining a fork of the upstream library.

## Install

```sh
npm install @digital-craft-ltd/astro-cookie-consent
```

Astro 5, 6, and 7 are supported.

## Basic Astro setup

Add the components to the shared layout used by every page:

```astro
---
import {
  CookieConsent,
  CookiePreferencesLink,
  createDefaultConsentConfig,
} from '@digital-craft-ltd/astro-cookie-consent';

const cookieConsentConfig = createDefaultConsentConfig({
  privacyPolicyUrl: '/privacy-policy/',
  termsUrl: '/terms-and-conditions/',
  contactUrl: '/contact/',
});
---

<html lang="en-GB">
  <head>
    <!-- Your normal head content -->
  </head>
  <body>
    <slot />

    <footer>
      <CookiePreferencesLink />
    </footer>

    <CookieConsent config={cookieConsentConfig} />
  </body>
</html>
```

The default configuration uses opt-in consent with `necessary`, `analytics`, and `ads` categories. Necessary cookies are always enabled. Optional categories remain disabled until the visitor grants consent.

The button rendered by `CookiePreferencesLink` lets visitors review or withdraw consent later. Keep this control available from every page, usually in the footer.

## Google Consent Mode v2

Render `ConsentModeDefaults` in the document head **before** Google Tag Manager, `gtag.js`, or any other Google tag. Then enable consent updates on `CookieConsent`:

```astro
---
import {
  ConsentModeDefaults,
  CookieConsent,
  createDefaultConsentConfig,
} from '@digital-craft-ltd/astro-cookie-consent';

const config = createDefaultConsentConfig({
  privacyPolicyUrl: '/privacy-policy/',
});
---

<html lang="en-GB">
  <head>
    <ConsentModeDefaults />

    <!-- Load Google Tag Manager or gtag.js after the defaults above. -->
  </head>
  <body>
    <slot />
    <CookieConsent {config} googleConsentMode />
  </body>
</html>
```

The package denies `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`, and `personalization_storage` by default. It grants `functionality_storage` and `security_storage`. Consent updates map `analytics` to `analytics_storage` and `ads` to the three advertising consent types.

You can override the defaults or category mapping:

```astro
<ConsentModeDefaults
  defaults={{
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500,
  }}
/>

<CookieConsent
  {config}
  googleConsentMode={{
    categoryMap: {
      statistics: ['analytics_storage'],
      marketing: ['ad_storage', 'ad_user_data', 'ad_personalization'],
    },
  }}
/>
```

## Custom configuration

`createDefaultConsentConfig` is a starting point. Change the returned serializable object before passing it to the component:

```astro
---
import { CookieConsent, createDefaultConsentConfig } from '@digital-craft-ltd/astro-cookie-consent';

const config = createDefaultConsentConfig({
  privacyPolicyUrl: '/privacy-policy/',
  revision: 2,
});

config.cookie = {
  name: 'site_cookie_consent',
  expiresAfterDays: 182,
  sameSite: 'Lax',
};

config.categories.analytics = {
  autoClear: {
    cookies: [
      { name: { pattern: '^_ga', flags: 'i' } },
      { name: '_gid' },
    ],
  },
};
---

<CookieConsent {config} />
```

Regular expressions use `{ pattern, flags }` because Astro serializes the configuration into HTML before the browser initializes the consent library.

The language, layout, cookie table, services, and category options follow the [vanilla-cookieconsent configuration reference](https://cookieconsent.orestbida.com/reference/configuration-reference.html). Configuration callbacks are intentionally excluded from the component API; listen for the browser event described below when application code needs to react to a change.

When the meaning of consent changes, increment `revision`. Existing visitors will be asked to choose again.

## Block scripts until consent

The underlying library can activate scripts after a category or service is accepted. Use an inert script type and declare its category:

```html
<script type="text/plain" data-category="analytics">
  console.log('Runs after analytics consent');
</script>

<script
  type="text/plain"
  data-category="analytics"
  data-src="https://example.com/analytics.js"
></script>
```

For service-level control, add `data-service="service-name"` and define the same service under the category configuration. Astro templates may also need `is:inline` when the script must be emitted exactly as written.

With Google Consent Mode, load Google tags after denied defaults and let Google receive consent updates. Do not also block the same Google tag with `type="text/plain"`, because that prevents Consent Mode from receiving the default state.

## React to consent changes

The package dispatches `dc:cookie-consent-change` after initial consent and whenever preferences change:

```ts
window.addEventListener('dc:cookie-consent-change', (event) => {
  console.log(event.detail.preferences);
  console.log(event.detail.consentMode);
});
```

`consentMode` is populated when Google Consent Mode is enabled and is otherwise an empty object.

For a custom preferences control, call `showCookiePreferences()` from `@digital-craft-ltd/astro-cookie-consent/client`, or add `data-dc-cookie-preferences` to a button or link.

## Styling

The component includes the upstream stylesheet. Override its CSS custom properties in your global stylesheet:

```css
#cc-main {
  --cc-bg: #ffffff;
  --cc-primary-color: #1f2937;
  --cc-btn-primary-bg: #1f2937;
  --cc-btn-primary-hover-bg: #111827;
}
```

See the [vanilla-cookieconsent styling guide](https://cookieconsent.orestbida.com/advanced/ui-customization.html) for the full set of variables and layout options.

## Astro navigation

No extra setup is required for Astro view transitions or client-side routing. The consent root persists between navigations, and the client initializer preserves the dialog state without copying unrelated document classes.

## Site responsibilities

The package supplies the consent interface and state handling. Each site still needs to:

- identify the cookies and storage it uses;
- put each optional service in the correct category;
- describe those services accurately in its privacy and cookie information;
- verify that optional scripts do not run before consent;
- keep a cookie settings control available after the first choice.

## Handover checklist

Before handing an Astro site to another developer or client:

1. Keep the configuration in a clearly named site file and import it into the shared layout.
2. Confirm that every optional script has the correct category or Consent Mode behaviour.
3. Replace the example copy and cookie entries with the site's actual services and policy links.
4. Test accept all, reject all, granular choices, withdrawal, and a subsequent page load.
5. Record why the current `revision` was chosen; increment it when visitors need to consent again.
6. Leave `CookiePreferencesLink` available on every page.

The receiving developer can change hosting, analytics, or tag management without modifying this package. Those site-specific decisions belong in the consuming Astro project.

## Exports

- `CookieConsent`
- `CookiePreferencesLink`
- `ConsentModeDefaults`
- `createDefaultConsentConfig`
- `defaultConsentModeDefaults`
- `defaultConsentModeCategoryMap`
- `initializeCookieConsent` and `showCookiePreferences` from `@digital-craft-ltd/astro-cookie-consent/client`
- `@digital-craft-ltd/astro-cookie-consent/styles.css` for manual stylesheet imports

## License

MIT

## Acknowledgements

This package is an Astro integration for [CookieConsent](https://github.com/orestbida/cookieconsent), created and maintained by [Orest Bida](https://github.com/orestbida) and its contributors. CookieConsent supplies the consent engine, modal interface, preference storage, script management, and core styles used here. It is distributed under its own [MIT licence](https://github.com/orestbida/cookieconsent/blob/master/LICENSE).

See the upstream [documentation](https://cookieconsent.orestbida.com/) for its complete configuration and API reference.
