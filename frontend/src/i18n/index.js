import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';
import ar from './locales/ar.json';

const savedLanguage = localStorage.getItem('app_language') || 'fr';

// Set initial HTML direction and lang
document.documentElement.setAttribute('dir', savedLanguage === 'ar' ? 'rtl' : 'ltr');
document.documentElement.setAttribute('lang', savedLanguage);

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      ar: { translation: ar }
    },
    lng: savedLanguage,
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app_language', lng);
  document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
});

// Formatters
export function formatDate(dateString, locale = i18n.language) {
  if (!dateString) return '-';
  try {
    const loc = locale === 'ar' ? 'ar-SA' : (locale === 'en' ? 'en-US' : 'fr-FR');
    return new Intl.DateTimeFormat(loc, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  } catch (e) {
    return String(dateString);
  }
}

export function formatCurrency(amount, locale = i18n.language, currency = 'EUR') {
  if (amount === null || amount === undefined) return '-';
  try {
    const loc = locale === 'ar' ? 'ar-SA' : (locale === 'en' ? 'en-US' : 'fr-FR');
    return new Intl.NumberFormat(loc, {
      style: 'currency',
      currency
    }).format(amount);
  } catch (e) {
    return `${amount} €`;
  }
}

export function formatNumber(num, locale = i18n.language) {
  if (num === null || num === undefined) return '-';
  try {
    const loc = locale === 'ar' ? 'ar-SA' : (locale === 'en' ? 'en-US' : 'fr-FR');
    return new Intl.NumberFormat(loc).format(num);
  } catch (e) {
    return String(num);
  }
}

export default i18n;
