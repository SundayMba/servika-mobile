import { Linking } from 'react-native';

import { appAlert } from '@/components/ui/AppAlert';

/** Every outside address the app links to, in one place. */
export const SUPPORT_EMAIL = 'support@servika.com.ng';
export const SITE_URL = 'https://servika.com.ng';
export const TERMS_URL = `${SITE_URL}/terms`;
export const PRIVACY_URL = `${SITE_URL}/privacy`;
export const SERVIKA_PRO_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.servika.pro';

/** Open the mail app to support; if there is none, show the address instead. */
export function openSupportEmail(subject = 'Servika Support') {
  Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`).catch(() =>
    appAlert('Contact support', `Email us at ${SUPPORT_EMAIL}`),
  );
}

/** Open a web page; silently ignore if no browser can take it. */
export function openUrl(url: string) {
  Linking.openURL(url).catch(() => {});
}
