import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  English: {
    dashboard: 'Dashboard',
    datasets: 'Datasets',
    studio: 'AutoBI Studio',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    profile_settings: 'Profile Settings',
    plan_settings: 'Plan Settings',
    security_settings: 'Security Settings',
    appearance_settings: 'Appearance Settings',
    language_settings: 'Language Settings',
    delete_account: 'Delete Account',
    save_changes: 'Save Changes',
    cancel: 'Cancel',
    first_name: 'First Name',
    last_name: 'Last Name',
    bio: 'Bio',
    email_address: 'Email Address'
  },
  Hindi: {
    dashboard: 'डैशबोर्ड',
    datasets: 'डेटासेट',
    studio: 'ऑटोबीआई स्टूडियो',
    reports: 'रिपोर्ट',
    settings: 'सेटिंग्स',
    logout: 'लॉगआउट',
    profile_settings: 'प्रोफ़ाइल सेटिंग्स',
    plan_settings: 'प्लान सेटिंग्स',
    security_settings: 'सुरक्षा सेटिंग्स',
    appearance_settings: 'रूप सेटिंग्स',
    language_settings: 'भाषा सेटिंग्स',
    delete_account: 'खाता हटाएं',
    save_changes: 'परिवर्तन सहेजें',
    cancel: 'रद्द करें',
    first_name: 'पहला नाम',
    last_name: 'अंतिम नाम',
    bio: 'बायो',
    email_address: 'ईमेल पता'
  }
};

const TranslationContext = createContext();

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['English'][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export const useTranslation = () => useContext(TranslationContext);
