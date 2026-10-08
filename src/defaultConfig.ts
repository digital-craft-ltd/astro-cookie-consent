import type {
  ConsentModeCategoryMap,
  ConsentModeDefaultState,
  CreateDefaultConsentConfigOptions,
  SerializableCookieConsentConfig,
} from './types';

export const defaultConsentModeDefaults: ConsentModeDefaultState = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  personalization_storage: 'denied',
  security_storage: 'granted',
};

export const defaultConsentModeCategoryMap: ConsentModeCategoryMap = {
  analytics: ['analytics_storage'],
  ads: ['ad_storage', 'ad_user_data', 'ad_personalization'],
};

const escapeAttribute = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export const createDefaultConsentConfig = ({
  privacyPolicyUrl,
  termsUrl,
  contactUrl,
  revision = 1,
}: CreateDefaultConsentConfigOptions): SerializableCookieConsentConfig => {
  const footerLinks = [
    `<a href="${escapeAttribute(privacyPolicyUrl)}">Privacy policy</a>`,
    termsUrl ? `<a href="${escapeAttribute(termsUrl)}">Terms and conditions</a>` : '',
  ].filter(Boolean);

  return {
    mode: 'opt-in',
    revision,
    root: '#dc-cookie-consent-root',
    guiOptions: {
      consentModal: {
        layout: 'box inline',
        position: 'bottom left',
        equalWeightButtons: true,
      },
      preferencesModal: {
        layout: 'box',
        position: 'right',
        equalWeightButtons: true,
        flipButtons: false,
      },
    },
    categories: {
      necessary: { readOnly: true },
      analytics: {},
      ads: {},
    },
    language: {
      default: 'en',
      autoDetect: 'document',
      translations: {
        en: {
          consentModal: {
            title: 'This website uses cookies',
            description:
              'We use necessary cookies to operate the site. With your permission, we also use optional cookies for analytics and advertising.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            showPreferencesBtn: 'Manage preferences',
            footer: footerLinks.join('\n'),
          },
          preferencesModal: {
            title: 'Manage cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            savePreferencesBtn: 'Save preferences',
            closeIconLabel: 'Close preferences',
            serviceCounterLabel: 'Service|Services',
            sections: [
              {
                title: 'Your choices',
                description:
                  'You can change these preferences at any time using the cookie settings control on the site.',
              },
              {
                title: 'Strictly necessary',
                description: 'These cookies are required for the website to function and cannot be disabled.',
                linkedCategory: 'necessary',
              },
              {
                title: 'Analytics',
                description: 'These cookies help the site owner understand how visitors use the website.',
                linkedCategory: 'analytics',
              },
              {
                title: 'Advertising',
                description: 'These cookies support advertising measurement and personalisation.',
                linkedCategory: 'ads',
              },
              ...(contactUrl
                ? [
                    {
                      title: 'More information',
                      description: `For questions about cookies, <a href="${escapeAttribute(contactUrl)}">contact us</a>.`,
                    },
                  ]
                : []),
            ],
          },
        },
      },
    },
  };
};
