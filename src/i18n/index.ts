import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ur from './locales/ur.json';
import hi from './locales/hi.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      hi: { translation: hi },
      ur: { translation: ur },
    },
    lng: 'hi', // Default language
    fallbackLng: 'hi',
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
  });

export default i18n;
