import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ collapsed = false }) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'sr', label: 'SR', flag: '🇷🇸', name: 'Srpski' },
    { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  ];

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  if (collapsed) {
    return (
      <div className="flex flex-col gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
              i18n.language === lang.code
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title={lang.name}
          >
            {lang.flag}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-xl">
      <Globe className="w-4 h-4 text-gray-400" />
      <div className="flex gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              i18n.language === lang.code
                ? 'bg-amber-500 text-white shadow-md'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
