import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import ko from './ko.json'

const STORAGE_KEY = 'arc-reactor-language'

function getInitialLanguage(): string {
  // 1. Check localStorage
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && (saved === 'en' || saved === 'ko')) return saved

  // 2. Check browser language
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('ko')) return 'ko'

  // 3. Default to English
  return 'en'
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ko: { translation: ko },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already handles XSS
    },
  })

// Persist language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export default i18n
