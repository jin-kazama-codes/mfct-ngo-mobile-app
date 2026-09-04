import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';
import ur from './locales/ur.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      hi: { translation: hi },
      en: { translation: en },
      ur: { translation: ur },
    },
    lng: 'hi', // Default language
    fallbackLng: 'hi',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
