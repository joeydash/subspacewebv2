import React, { useState } from 'react';
import { Globe, ChevronUp, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface Language {
  code: string;
  name: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'hi', name: 'Hindi' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'it', name: 'Italian' }
];

const LanguageSettingsComponent: React.FC = () => {
  const { user } = useAuthStore();
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLanguageChange = async (languageCode: string) => {
    if (!user?.id || !user?.auth_token) return;

    setIsChangingLanguage(true);
    try {
      const response = await fetch('https://db.subspace.money/v1/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.auth_token}`
        },
        body: JSON.stringify({
          query: `
            mutation UpdateLanguage($user_id: uuid!, $language: String!) {
              __typename
              update_whatsub_users_by_pk(
                pk_columns: {id: $user_id},
                _set: {language: $language}
              ) {
                __typename
                id
                language
              }
            }
          `,
          variables: {
            user_id: user.id,
            language: languageCode
          }
        })
      });

      const data = await response.json();

      if (data.errors) {
        console.error('Error updating language:', data.errors);
        return;
      }

      if (data.data?.update_whatsub_users_by_pk) {
        setSelectedLanguage(languageCode);
      }
    } catch (error) {
      console.error('Error updating language:', error);
    } finally {
      setIsChangingLanguage(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-dark-400 hover:bg-dark-300 rounded-lg transition-colors group"
      >
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-gray-400 group-hover:text-white" />
          <span className="font-medium">Language</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400 group-hover:text-white" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-white" />
        )}
      </button>
      {isExpanded && (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-3">
            Select your preferred language
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                disabled={isChangingLanguage}
                className={`p-3 rounded-lg border transition-colors ${
                  selectedLanguage === language.code
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-dark-400 border-dark-300 text-gray-300 hover:bg-dark-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {language.name}
              </button>
            ))}
          </div>
          {isChangingLanguage && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
              <span className="text-sm text-gray-400">Updating language...</span>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default LanguageSettingsComponent;
