import { useTranslation } from 'react-i18next';

const LanguageSwitcher = ({ collapsed = false }) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'sr', label: 'SR', flag: '🇷🇸', name: 'Srpski' },
    { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  ];

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
            className={`w-10 h-8 rounded-md flex items-center justify-center text-sm transition-all ${
              i18n.language === lang.code
                ? 'bg-gray-700 text-white'
                : 'text-gray-500 hover:text-gray-300'
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
    <div className="flex items-center justify-center gap-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleLanguageChange(lang.code)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-all ${
            i18n.language === lang.code
              ? 'bg-gray-700/50 text-gray-200'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <span>{lang.flag}</span>
          <span>{lang.label}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
