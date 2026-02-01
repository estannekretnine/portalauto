import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import srCommon from './locales/sr/common.json';
import srSidebar from './locales/sr/sidebar.json';
import srTraznja from './locales/sr/traznja.json';
import srPonuda from './locales/sr/ponuda.json';
import srAuto from './locales/sr/auto.json';

import enCommon from './locales/en/common.json';
import enSidebar from './locales/en/sidebar.json';
import enTraznja from './locales/en/traznja.json';
import enPonuda from './locales/en/ponuda.json';
import enAuto from './locales/en/auto.json';

const resources = {
  sr: {
    common: srCommon,
    sidebar: srSidebar,
    traznja: srTraznja,
    ponuda: srPonuda,
    auto: srAuto,
  },
  en: {
    common: enCommon,
    sidebar: enSidebar,
    traznja: enTraznja,
    ponuda: enPonuda,
    auto: enAuto,
  },
};

// Get saved language from localStorage or default to Serbian
const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('language') || 'sr'
  : 'sr';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'sr',
    defaultNS: 'common',
    ns: ['common', 'sidebar', 'traznja', 'ponuda', 'auto'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Save language preference when it changes
i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('language', lng);
  }
});

export default i18n;
