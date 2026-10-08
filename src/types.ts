import type { CookieConsentConfig } from 'vanilla-cookieconsent';

export type ConsentModeState = 'granted' | 'denied';

export type ConsentModeType =
  | 'ad_storage'
  | 'ad_user_data'
  | 'ad_personalization'
  | 'analytics_storage'
  | 'functionality_storage'
  | 'personalization_storage'
  | 'security_storage';

export type ConsentModeDefaultState = Partial<Record<ConsentModeType, ConsentModeState>> & {
  region?: string[];
  wait_for_update?: number;
};

export interface CookieNamePattern {
  pattern: string;
  flags?: string;
}

export interface SerializableCookieItem {
  name: string | CookieNamePattern;
  path?: string;
  domain?: string;
}

export interface SerializableConsentService {
  label?: string;
  cookies?: SerializableCookieItem[];
}

export interface SerializableConsentCategory {
  enabled?: boolean;
  readOnly?: boolean;
  services?: Record<string, SerializableConsentService>;
  autoClear?: {
    cookies: SerializableCookieItem[];
    reloadPage?: boolean;
  };
}

export interface SerializableCookieConsentConfig {
  root?: string | null;
  mode?: 'opt-in' | 'opt-out';
  autoShow?: boolean;
  revision?: number;
  manageScriptTags?: boolean;
  autoClearCookies?: boolean;
  disablePageInteraction?: boolean;
  hideFromBots?: boolean;
  lazyHtmlGeneration?: boolean;
  cookie?: Omit<NonNullable<CookieConsentConfig['cookie']>, 'expiresAfterDays'> & {
    expiresAfterDays?: number;
  };
  guiOptions?: CookieConsentConfig['guiOptions'];
  categories: Record<string, SerializableConsentCategory>;
  language: {
    default: string;
    rtl?: string | string[];
    autoDetect?: 'document' | 'browser';
    translations: CookieConsentConfig['language']['translations'];
  };
}

export type ConsentModeCategoryMap = Record<string, ConsentModeType[]>;

export interface GoogleConsentModeOptions {
  categoryMap?: ConsentModeCategoryMap;
}

export interface CookieConsentRuntimeOptions {
  config: SerializableCookieConsentConfig;
  googleConsentMode?: boolean | GoogleConsentModeOptions;
  rootSelector?: string;
}

export interface CreateDefaultConsentConfigOptions {
  privacyPolicyUrl: string;
  termsUrl?: string;
  contactUrl?: string;
  revision?: number;
}
